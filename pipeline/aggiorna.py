#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Città vive — aggiornamento delle serie che si possono aggiornare da sole
========================================================================

Scarica da Eurostat le due sole serie che, verificate una per una, sono
davvero vive: il NO₂ mensile delle capitali e i decessi settimanali per
provincia. Scrive tre file in data/auto/ e non tocca nient'altro.

Perché non usa librerie
-----------------------
Solo urllib e la libreria standard. Gira su una GitHub Action senza
`pip install`, quindi senza un albero di dipendenze che invecchia per
conto suo: per due chiamate REST e un po' di aritmetica sarebbe un costo
senza contropartita.

Perché non tocca data/charts.js
-------------------------------
Quel file è il trattato: numeri scelti, verificati a mano e legati a un
testo che li commenta. Se uno script glieli riscrivesse sotto, il giorno
in cui Eurostat rivede una serie il testo direbbe una cosa e il grafico
un'altra. Qui i dati automatici stanno in un posto loro, li legge solo
il cruscotto, e la separazione è il punto.

Uso:
    python3 pipeline/aggiorna.py            # scrive in data/auto/
    python3 pipeline/aggiorna.py --dry-run  # stampa e basta
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, date
from pathlib import Path
from collections import defaultdict

API = "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data"
RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "data" / "auto"

# ---------------------------------------------------------------- NO₂
# ENV_AIR_NO2 copre le sole capitali: Barcellona, Milano e Londra non
# ci sono e non è un errore di configurazione. Il cruscotto lo dichiara.
CAPITALI = [
    {"codice": "FR_CAP", "citta": "Parigi",  "id": "paris",  "colore": "#005BAC"},
    {"codice": "ES_CAP", "citta": "Madrid",  "id": "madrid", "colore": "#7A3E9D"},
    {"codice": "DE_CAP", "citta": "Berlino", "id": "berlin", "colore": "#0F8B8D"},
    {"codice": "IT_CAP", "citta": "Roma",    "id": "roma",   "colore": "#E63946"},
]

# ------------------------------------------------------- mortalità
# Quattro province su DEMO_R_MWK3_T (NUTS3) e Berlino su DEMO_R_MWK2_TS,
# perché la Germania non trasmette a livello di NUTS3. Londra manca:
# il Regno Unito si ferma al dicembre 2020, dopo l'uscita dall'UE.
AREE = [
    {"flusso": "mwk3", "codice": "ITC4C", "citta": "Milano",     "id": "milan",     "colore": "#E63946", "area": "città metropolitana"},
    {"flusso": "mwk3", "codice": "FR101", "citta": "Parigi",     "id": "paris",     "colore": "#005BAC", "area": "dipartimento di Parigi"},
    {"flusso": "mwk3", "codice": "ES511", "citta": "Barcellona", "id": "barcelona", "colore": "#F4B223", "area": "provincia"},
    {"flusso": "mwk3", "codice": "ES300", "citta": "Madrid",     "id": "madrid",    "colore": "#7A3E9D", "area": "comunità autonoma"},
    {"flusso": "mwk2", "codice": "DE3",   "citta": "Berlino",    "id": "berlin",    "colore": "#0F8B8D", "area": "Land (NUTS 2)"},
]

BASE_DA, BASE_A = 2015, 2019   # anni di riferimento per l'atteso
ESTATE = (24, 36)              # settimane ISO indicativamente estive
DETTAGLIO_DA = 2024            # sotto questa soglia si tiene solo il bilancio estivo:
                               # la serie settimanale intera pesava 330 KB e nessuno
                               # va a guardare la settimana 7 del 2021.


def scarica(percorso):
    """Una GET su Eurostat, con l'User-Agent esplicito e un errore leggibile."""
    url = "%s/%s&format=SDMX-CSV" % (API, percorso)
    richiesta = urllib.request.Request(url, headers={"User-Agent": "citta-vive/1.0 (Planet Intelligence)"})
    try:
        with urllib.request.urlopen(richiesta, timeout=120) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        raise SystemExit("Eurostat ha risposto %s su %s\n%s" % (e.code, url, e.read().decode("utf-8", "replace")[:400]))
    except urllib.error.URLError as e:
        raise SystemExit("Eurostat non raggiungibile: %s" % e.reason)


def leggi_csv(testo):
    """SDMX-CSV in dizionari. Le righe senza valore sono buchi e restano fuori."""
    righe = testo.strip().split("\n")
    intestazione = [c.strip() for c in righe[0].split(",")]
    fuori = []
    for riga in righe[1:]:
        campi = riga.split(",")
        if len(campi) != len(intestazione):
            continue
        d = dict(zip(intestazione, campi))
        if d.get("OBS_VALUE", "").strip():
            fuori.append(d)
    return fuori


def aggiornato_il(righe):
    """La data che Eurostat dichiara come ultimo aggiornamento del flusso."""
    if not righe:
        return None
    grezza = righe[0].get("LAST UPDATE", "").strip()
    try:                                        # '14/08/26 23:00:00'
        return datetime.strptime(grezza.split()[0], "%d/%m/%y").date().isoformat()
    except ValueError:
        return grezza or None


# ======================================================== NO₂ mensile
def raccogli_aria():
    citta, ultimo_periodo, aggiornamenti = [], "", []

    for c in CAPITALI:
        righe = leggi_csv(scarica("ENV_AIR_NO2/M.NO2.MCG_M3.%s?startPeriod=2018-01" % c["codice"]))
        if not righe:
            print("  ! nessun dato per %s" % c["citta"], file=sys.stderr)
            continue
        aggiornamenti.append(aggiornato_il(righe))

        mensile = [{"periodo": r["TIME_PERIOD"], "valore": float(r["OBS_VALUE"])} for r in righe]
        mensile.sort(key=lambda x: x["periodo"])

        per_anno = defaultdict(list)
        for m in mensile:
            per_anno[m["periodo"][:4]].append(m["valore"])

        annuale = []
        for anno in sorted(per_anno):
            v = per_anno[anno]
            annuale.append({
                "anno": anno,
                "media": round(sum(v) / len(v), 1),
                "mesi": len(v),
                "completo": len(v) == 12,       # un anno a metà non si confronta con uno intero
            })

        ultimo_periodo = max(ultimo_periodo, mensile[-1]["periodo"])
        citta.append({**c, "mensile": mensile, "annuale": annuale,
                      "ultimo": mensile[-1]["periodo"], "ultimo_valore": mensile[-1]["valore"]})

    return {
        "titolo": "Biossido di azoto nelle capitali europee",
        "unita": "µg/m³ NO₂, media mensile",
        "fonte": "Eurostat, ENV_AIR_NO2 (statistiche sperimentali)",
        "url": "https://ec.europa.eu/eurostat/databrowser/product/page/ENV_AIR_NO2",
        "stazione": None,   # Eurostat non dichiara il tipo: vedi metodo.html
        "ultimo_periodo": ultimo_periodo,
        "fonte_aggiornata": max([a for a in aggiornamenti if a], default=None),
        "soglie": [
            {"valore": 40, "nome": "limite UE oggi"},
            {"valore": 20, "nome": "limite UE dal 2030"},
            {"valore": 10, "nome": "guida OMS"},
        ],
        "assenti": ["Barcellona", "Milano", "Londra"],
        "citta": citta,
    }


# ============================================== decessi settimanali
def raccogli_mortalita():
    aree, ultimo_periodo, aggiornamenti = [], "", []

    for a in AREE:
        if a["flusso"] == "mwk3":
            percorso = "DEMO_R_MWK3_T/W.NR.%s?startPeriod=%d-W01" % (a["codice"], BASE_DA)
        else:
            percorso = "DEMO_R_MWK2_TS/W.T.NR.%s?startPeriod=%d-W01" % (a["codice"], BASE_DA)

        righe = leggi_csv(scarica(percorso))
        if not righe:
            print("  ! nessun dato per %s" % a["citta"], file=sys.stderr)
            continue
        aggiornamenti.append(aggiornato_il(righe))

        # la W99 è la settimana di riporto di alcuni paesi, non una settimana vera
        osservazioni = []
        for r in righe:
            p = r["TIME_PERIOD"]
            if "-W" not in p:
                continue
            anno, sett = p.split("-W")
            if sett == "99":
                continue
            osservazioni.append({"anno": int(anno), "settimana": int(sett),
                                 "valore": float(r["OBS_VALUE"]),
                                 "provvisorio": "p" in (r.get("OBS_FLAG") or "")})

        # atteso = media della stessa settimana ISO negli anni di riferimento
        riferimento = defaultdict(list)
        for o in osservazioni:
            if BASE_DA <= o["anno"] <= BASE_A:
                riferimento[o["settimana"]].append(o["valore"])
        atteso = {s: sum(v) / len(v) for s, v in riferimento.items() if len(v) >= 3}

        serie = []
        for o in sorted(osservazioni, key=lambda x: (x["anno"], x["settimana"])):
            if o["anno"] <= BASE_A:
                continue                        # gli anni della baseline non si confrontano con sé stessi
            base = atteso.get(o["settimana"])
            serie.append({
                "periodo": "%d-W%02d" % (o["anno"], o["settimana"]),
                "anno": o["anno"], "settimana": o["settimana"],
                "morti": o["valore"],
                "atteso": round(base, 1) if base else None,
                "eccesso": round(o["valore"] - base, 1) if base else None,
                "eccesso_pct": round((o["valore"] - base) / base * 100, 1) if base else None,
                "provvisorio": o["provvisorio"],
            })

        # bilancio estivo di ogni anno: quante morti sopra l'atteso fra le
        # settimane 24 e 36. Il numero di settimane va portato accanto al
        # totale, altrimenti un'estate ancora in corso sembra mite.
        per_estate = defaultdict(list)
        for s in serie:
            if ESTATE[0] <= s["settimana"] <= ESTATE[1] and s["eccesso"] is not None:
                per_estate[s["anno"]].append(s)
        estati = [{
            "anno": anno,
            "settimane": len(v),
            "complete": len(v) == ESTATE[1] - ESTATE[0] + 1,
            "eccesso": round(sum(x["eccesso"] for x in v), 1),
            "eccesso_pct": round(sum(x["eccesso"] for x in v) / sum(x["atteso"] for x in v) * 100, 1),
        } for anno, v in sorted(per_estate.items())]

        if serie:
            ultimo_periodo = max(ultimo_periodo, serie[-1]["periodo"])

        aree.append({**a,
                     "serie": [s for s in serie if s["anno"] >= DETTAGLIO_DA],
                     "estati": estati,
                     "ultimo": serie[-1] if serie else None})

    return {
        "titolo": "Decessi settimanali e scarto dall'atteso",
        "unita": "decessi per settimana",
        "fonte": "Eurostat, DEMO_R_MWK3_T e DEMO_R_MWK2_TS",
        "url": "https://ec.europa.eu/eurostat/databrowser/product/page/DEMO_R_MWK3_T",
        "metodo": ("Atteso = media della stessa settimana ISO negli anni %d-%d. È un confronto "
                   "grezzo: non corregge per l'invecchiamento della popolazione né per la sua "
                   "crescita, e non attribuisce lo scarto a una causa." % (BASE_DA, BASE_A)),
        "baseline": {"da": BASE_DA, "a": BASE_A},
        "dettaglio_da": DETTAGLIO_DA,
        "estate": {"da_settimana": ESTATE[0], "a_settimana": ESTATE[1]},
        "ultimo_periodo": ultimo_periodo,
        "fonte_aggiornata": max([a for a in aggiornamenti if a], default=None),
        "assenti": ["Londra"],
        "aree": aree,
    }


def scrivi(percorso, contenuto, prova):
    testo = json.dumps(contenuto, ensure_ascii=False, indent=1, sort_keys=False)
    if prova:
        print("  (prova) %s — %d KB" % (percorso.name, len(testo) // 1024))
        return
    percorso.parent.mkdir(parents=True, exist_ok=True)
    percorso.write_text(testo + "\n", encoding="utf-8")
    print("  scritto %s — %d KB" % (percorso.name, len(testo) // 1024))


def main():
    prova = "--dry-run" in sys.argv
    print("Città vive · aggiornamento dei dati automatici")

    print("\nNO₂ mensile delle capitali…")
    aria = raccogli_aria()
    print("  %d città, ultimo periodo %s" % (len(aria["citta"]), aria["ultimo_periodo"]))

    print("\nDecessi settimanali…")
    morti = raccogli_mortalita()
    print("  %d aree, ultima settimana %s" % (len(morti["aree"]), morti["ultimo_periodo"]))

    manifesto = {
        "generato": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generato_giorno": date.today().isoformat(),
        "serie": [
            {"file": "aria.json", "titolo": aria["titolo"], "fonte": aria["fonte"],
             "url": aria["url"], "ultimo_periodo": aria["ultimo_periodo"],
             "fonte_aggiornata": aria["fonte_aggiornata"], "assenti": aria["assenti"]},
            {"file": "mortalita.json", "titolo": morti["titolo"], "fonte": morti["fonte"],
             "url": morti["url"], "ultimo_periodo": morti["ultimo_periodo"],
             "fonte_aggiornata": morti["fonte_aggiornata"], "assenti": morti["assenti"]},
        ],
    }

    print()
    scrivi(USCITA / "aria.json", aria, prova)
    scrivi(USCITA / "mortalita.json", morti, prova)
    scrivi(USCITA / "manifest.json", manifesto, prova)
    print("\nFatto.")


if __name__ == "__main__":
    main()
