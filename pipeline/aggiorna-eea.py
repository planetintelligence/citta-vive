#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Città vive — le sei città, dalle stazioni dell'EEA
==================================================

Questa è la pipeline che il progetto inseguiva dall'inizio: le **sei città
del pezzo** (non le capitali di Eurostat) e la **distinzione fra stazioni
da traffico e di fondo urbano**, cioè la definizione che usa il trattato.

Come ci arriva, visto che non è la strada ovvia
-----------------------------------------------
L'API ufficiale di download dell'EEA (`/ParquetFile/urls`) al 15 agosto
2026 **restituisce zero file** per i dataset dal 2013 in poi: verificato su
sei paesi e contro l'esempio di codice della loro stessa documentazione
(versione 1.2, maggio 2026), copiato carattere per carattere. Vedi
`verifica-eea.py`.

I dati però ci sono, raggiungibili per un'altra via:

1. **I metadati delle stazioni** stanno in un CSV pubblico (27 MB, tabulato
   nonostante l'estensione) con `AirQualityStationType` — traffic,
   background, industrial — le coordinate e l'identificatore del punto di
   campionamento.
2. **I dati orari** stanno su un blob pubblico, un file Parquet per punto di
   campionamento, con dentro l'intera serie 2013-2024.

L'URL del file si costruisce dall'identificatore. Non è documentato come
interfaccia stabile: se un giorno smette di funzionare, la spiegazione è
questa, non un errore nostro.

Perché usa pyarrow mentre aggiorna.py no
----------------------------------------
Perché i file sono Parquet e non c'è alternativa. È il motivo per cui i due
script sono separati: `aggiorna.py` gira sulla sola libreria standard e deve
restare così, questo ha una dipendenza e lo dichiara.

    pip install pyarrow
    python3 pipeline/aggiorna-eea.py                 # tutte e sei
    python3 pipeline/aggiorna-eea.py --citta Milano  # una sola, per provare
    python3 pipeline/aggiorna-eea.py --anni 2020     # dal 2020 in poi
"""

import argparse
import csv
import io
import json
import sys
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timezone, date
from pathlib import Path

try:
    import pyarrow.parquet as pq
except ImportError:
    sys.exit("Serve pyarrow per leggere i file dell'EEA:  pip install pyarrow")

META = "https://discomap.eea.europa.eu/map/fme/metadata/PanEuropean_metadata.csv"
BLOB = "https://eeadmz1batchservice02.blob.core.windows.net/airquality-p-e1a"
RADICE = Path(__file__).resolve().parent.parent
USCITA = RADICE / "data" / "auto"

# I riquadri sono dichiarati qui invece che presi da una geometria ufficiale:
# l'EEA assegna le stazioni alle città con i confini dell'Urban Audit, che
# non sono esposti in una forma comoda. Sono approssimazioni generose del
# comune (per Londra e Berlino, dell'area metropolitana), e vanno lette come
# tali: una stazione appena fuori confine può entrare o restare fuori.
CITTA = {
    "Parigi":     {"id": "paris",     "colore": "#005BAC", "paese": "FR", "bbox": (2.20, 2.50, 48.78, 48.92)},
    "Barcellona": {"id": "barcelona", "colore": "#F4B223", "paese": "ES", "bbox": (2.05, 2.25, 41.32, 41.47)},
    "Madrid":     {"id": "madrid",    "colore": "#7A3E9D", "paese": "ES", "bbox": (-3.80, -3.55, 40.33, 40.52)},
    "Berlino":    {"id": "berlin",    "colore": "#0F8B8D", "paese": "DE", "bbox": (13.09, 13.76, 52.34, 52.68)},
    "Londra":     {"id": "london",    "colore": "#DC241F", "paese": "GB", "bbox": (-0.51, 0.33, 51.28, 51.69)},
    "Milano":     {"id": "milan",     "colore": "#E63946", "paese": "IT", "bbox": (9.04, 9.28, 45.39, 45.54)},
}

INQUINANTI = {"8": "NO2", "6001": "PM2.5"}
TIPI = ("traffic", "background")          # l'industriale non riguarda questo lavoro
TIPO_IT = {"traffic": "traffico", "background": "fondo urbano"}


def scarica(url, timeout=300):
    r = urllib.request.Request(url, headers={"User-Agent": "citta-vive/1.0 (Planet Intelligence)"})
    with urllib.request.urlopen(r, timeout=timeout) as risposta:
        return risposta.read()


def stazioni(anno_da):
    """Le stazioni urbane delle sei città, per città, inquinante e tipo."""
    print("Metadati delle stazioni (27 MB)…")
    testo = scarica(META).decode("utf-8-sig", "replace")
    righe = csv.DictReader(io.StringIO(testo), delimiter="\t")

    trovate = defaultdict(list)
    visti = set()
    for r in righe:
        codice = r["AirPollutantCode"].rsplit("/", 1)[-1]
        tipo = r["AirQualityStationType"]
        if codice not in INQUINANTI or tipo not in TIPI or r["AirQualityStationArea"] != "urban":
            continue
        # una stazione ferma prima del periodo che ci interessa non serve
        fine = (r.get("ObservationDateEnd") or "").strip()
        if fine and fine[:4].isdigit() and int(fine[:4]) < anno_da:
            continue
        try:
            lon, lat = float(r["Longitude"]), float(r["Latitude"])
        except ValueError:
            continue

        for nome, c in CITTA.items():
            o, e, s, n = c["bbox"]
            if not (o < lon < e and s < lat < n):
                continue
            punto = r["SamplingPoint"].strip()
            chiave = (nome, INQUINANTI[codice], tipo, punto)
            if chiave in visti:
                continue
            visti.add(chiave)
            # La distanza dal bordo strada è il dato che rende confrontabili —
            # o incomparabili — le stazioni "da traffico" di città diverse:
            # il NO₂ cala rapidamente allontanandosi dalla carreggiata, e i
            # paesi non collocano le centraline con lo stesso criterio.
            # -999 è il codice con cui alcuni paesi dichiarano "non rilevato".
            try:
                bordo = float(r.get("KerbDistance", ""))
                if bordo < 0:
                    bordo = None
            except ValueError:
                bordo = None

            trovate[(nome, INQUINANTI[codice], tipo)].append({
                "punto": punto,
                "stazione": r["AirQualityStationEoICode"],
                "paese": r["Countrycode"],
                "bordo": bordo,
            })
    return trovate


def url_parquet(paese, punto):
    """Da 'SPO.IT0477A_8_chemi_1973-11-01_00:00:00' all'indirizzo del file."""
    return "%s/%s/%s.parquet" % (BLOB, paese, punto.replace(":", "_"))


def medie_annue(dati, anno_da):
    """Medie annue dalle osservazioni orarie valide di un punto di campionamento."""
    tavola = pq.read_table(io.BytesIO(dati), columns=["Start", "Value", "Validity", "AggType"])
    d = tavola.to_pydict()
    per_anno = defaultdict(list)
    for inizio, valore, valido, tipo_agg in zip(d["Start"], d["Value"], d["Validity"], d["AggType"]):
        # Validity <= 0 vuol dire dato non valido o mancante: l'EEA lo marca,
        # e mediarlo insieme agli altri sarebbe sbagliato.
        if valore is None or valido is None or valido <= 0:
            continue
        if tipo_agg not in ("hour", "day"):
            continue
        if inizio.year < anno_da:
            continue
        per_anno[inizio.year].append(float(valore))
    # sotto il 75% di copertura oraria l'anno non è rappresentativo: è la
    # soglia che usa la direttiva europea per considerare valida una media
    return {a: (sum(v) / len(v), len(v)) for a, v in per_anno.items()
            if len(v) >= (0.75 * 8760 if len(v) > 400 else 0.75 * 365)}


def main():
    p = argparse.ArgumentParser(description="Le sei città dalle stazioni dell'EEA")
    p.add_argument("--citta", help="una sola città, per provare")
    p.add_argument("--anni", type=int, default=2015, help="anno di partenza (default 2015)")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    scelte = {args.citta: CITTA[args.citta]} if args.citta else CITTA
    if args.citta and args.citta not in CITTA:
        sys.exit("Città sconosciuta. Sono: " + ", ".join(CITTA))

    elenco = stazioni(args.anni)
    da_fare = [(c, i, t) for c in scelte for i in ("NO2", "PM2.5") for t in TIPI if elenco.get((c, i, t))]
    totale = sum(len(elenco[k]) for k in da_fare)
    print("Stazioni da leggere: %d\n" % totale)

    risultato, falliti, fatti = {}, 0, 0
    for citta, inquinante, tipo in da_fare:
        punti = elenco[(citta, inquinante, tipo)]
        somma = defaultdict(list)
        for s in punti:
            fatti += 1
            try:
                dati = scarica(url_parquet(s["paese"], s["punto"]))
                for anno, (media, n) in medie_annue(dati, args.anni).items():
                    somma[anno].append(media)
            except urllib.error.HTTPError as e:
                falliti += 1
                if e.code != 404:
                    print("   ! %s: HTTP %s" % (s["stazione"], e.code), file=sys.stderr)
            except Exception as e:
                falliti += 1
                print("   ! %s: %s" % (s["stazione"], type(e).__name__), file=sys.stderr)
            print("\r  %s · %s · %s  [%d/%d]" % (citta, inquinante, TIPO_IT[tipo], fatti, totale),
                  end="", flush=True)

        if somma:
            bordi = sorted(s["bordo"] for s in punti if s["bordo"] is not None)
            risultato.setdefault(citta, {}).setdefault(inquinante, {})[TIPO_IT[tipo]] = {
                "stazioni": len(punti),
                "bordo_mediano": bordi[len(bordi) // 2] if bordi else None,
                "bordo_dichiarato": len(bordi),
                "serie": [{"anno": a, "valore": round(sum(v) / len(v), 1), "stazioni": len(v)}
                          for a, v in sorted(somma.items())],
            }
    print("\n")

    citta_fuori = [{**CITTA[c], "nome": c, "misure": risultato[c]} for c in scelte if c in risultato]
    anni = sorted({s["anno"] for c in citta_fuori for i in c["misure"].values()
                   for t in i.values() for s in t["serie"]})

    uscita = {
        "titolo": "Le sei città alle stazioni di misura",
        "fonte": "Agenzia europea dell'ambiente, dati validati E1a e metadati delle stazioni",
        "url": "https://www.eea.europa.eu/en/datahub/datahubitem-view/778ef9f5-6293-4846-badd-56a29c70880d",
        "metodo": (
            "Media delle medie annue delle singole stazioni urbane, separate per tipo. "
            "Sono escluse le osservazioni che l'EEA marca come non valide e gli anni con "
            "meno del 75%% di copertura, la soglia della direttiva europea. I confini delle "
            "città sono riquadri dichiarati in pipeline/aggiorna-eea.py, non le geometrie "
            "ufficiali dell'Urban Audit."
        ),
        "anni": anni,
        "ultimo_anno": anni[-1] if anni else None,
        "soglie": [
            {"valore": 40, "nome": "limite UE oggi", "inquinante": "NO2"},
            {"valore": 20, "nome": "limite UE dal 2030", "inquinante": "NO2"},
            {"valore": 10, "nome": "guida OMS", "inquinante": "NO2"},
            {"valore": 25, "nome": "limite UE oggi", "inquinante": "PM2.5"},
            {"valore": 10, "nome": "limite UE dal 2030", "inquinante": "PM2.5"},
            {"valore": 5, "nome": "guida OMS", "inquinante": "PM2.5"},
        ],
        "citta": citta_fuori,
    }

    print("Anni coperti: %s → %s" % (anni[0], anni[-1]) if anni else "Nessun dato")
    for c in citta_fuori:
        pezzi = []
        for inq, tipi in c["misure"].items():
            for t, v in tipi.items():
                ultimo = v["serie"][-1]
                # l'anno va sempre accanto al valore: le città non finiscono
                # tutte allo stesso anno (Londra si ferma al 2019) e un numero
                # senza data fa credere a un confronto che non esiste
                pezzi.append("%s %s %s nel %d (%d staz.)"
                             % (inq, t[:4], ultimo["valore"], ultimo["anno"], ultimo["stazioni"]))
        print("  %-11s %s" % (c["nome"], " · ".join(pezzi)))
    if falliti:
        print("\nFile non recuperati: %d su %d (stazioni dismesse o rinominate)." % (falliti, totale))

    if args.dry_run:
        print("\n(prova: non scrivo niente)")
        return

    USCITA.mkdir(parents=True, exist_ok=True)
    percorso = USCITA / "aria-citta.json"
    percorso.write_text(json.dumps(uscita, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("\nScritto %s — %d KB" % (percorso.name, percorso.stat().st_size // 1024))

    manifesto = USCITA / "manifest.json"
    if manifesto.exists():
        m = json.loads(manifesto.read_text(encoding="utf-8"))
        m["serie"] = [s for s in m["serie"] if s["file"] != "aria-citta.json"] + [{
            "file": "aria-citta.json", "titolo": uscita["titolo"], "fonte": uscita["fonte"],
            "url": uscita["url"], "ultimo_periodo": str(uscita["ultimo_anno"]),
            "fonte_aggiornata": date.today().isoformat(), "assenti": [],
        }]
        m["generato"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        manifesto.write_text(json.dumps(m, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("Manifesto aggiornato.")


if __name__ == "__main__":
    main()
