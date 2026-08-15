#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Città vive — la fonte EEA è tornata?
====================================

Il servizio di download dell'Agenzia europea dell'ambiente è l'unica fonte
che coprirebbe tutte e sei le città del pezzo **e** distinguerebbe le
stazioni da traffico da quelle di fondo — cioè la definizione che usa il
trattato. Eurostat non può farlo: copre le sole capitali.

Il 15 agosto 2026 quel servizio risponde, ma i dati dal 2013 in poi non
ci sono: le richieste per i dataset 1 (in tempo reale), 2 (verificato) e 5
(gap-filled) tornano vuote per ogni paese provato, mentre il dataset 3
(archivio 2002-2012) restituisce centinaia di file con lo stesso identico
corpo di richiesta. È la prova che il guasto è loro e non nostro.

Questo script non scarica niente: fa la domanda e stampa la risposta.
Serve a sapere quando si può scrivere il fetch vero, con i dati veri sotto
mano invece che a indovinare.

    python3 pipeline/verifica-eea.py

Esce con codice 0 se la fonte è tornata, 1 se è ancora ferma: così può
stare dentro una Action senza altra logica.
"""

import json
import sys
import urllib.request
import urllib.error

API = "https://eeadmz1-downloads-api-appservice.azurewebsites.net"
NO2 = "http://dd.eionet.europa.eu/vocabulary/aq/pollutant/8"

# I nomi sono quelli dell'endpoint /City, verificati il 15/8/2026: vanno
# copiati alla lettera, "(greater city)" compreso. Londra c'è — a differenza
# di Eurostat, dove il Regno Unito è uscito dal reporting dopo la Brexit.
CITTA = {
    "FR": "Paris (greater city)",
    "ES": "Barcelona",
    "DE": "Berlin",
    "GB": "London (greater city)",
    "IT": "Milano (greater city)",
}

DATASET = {
    1: "in tempo reale (E2a)",
    2: "verificato (E1a, dal 2013)",
    3: "archivio storico (2002-2012)",
    5: "gap-filled",
}


def chiedi(percorso, corpo):
    dati = json.dumps(corpo).encode("utf-8")
    r = urllib.request.Request(API + percorso, data=dati,
                               headers={"Content-Type": "application/json",
                                        "User-Agent": "citta-vive/1.0 (Planet Intelligence)"})
    try:
        with urllib.request.urlopen(r, timeout=180) as risposta:
            return risposta.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return "ERRORE HTTP %s: %s" % (e.code, e.read().decode("utf-8", "replace")[:200])
    except urllib.error.URLError as e:
        return "IRRAGGIUNGIBILE: %s" % e.reason


def quanti_file(paese, dataset):
    """Numero di file parquet offerti. La prima riga è l'intestazione CSV."""
    testo = chiedi("/ParquetFile/urls", {
        "countries": [paese], "cities": [], "pollutants": [NO2],
        "dataset": dataset, "source": "Api",
    })
    if testo.startswith(("ERRORE", "IRRAGGIUNGIBILE")):
        return None, testo
    righe = [r for r in testo.strip().split("\n") if r.strip()]
    return max(0, len(righe) - 1), None


def main():
    print("Città vive · la fonte EEA risponde con dati?\n")

    print("Servizio: %s" % API)
    print("Domanda: quanti file di NO₂ vengono offerti, per paese e per dataset.\n")

    tornata = False
    for paese in sorted(CITTA):
        print("%s — %s" % (paese, CITTA[paese]))
        for ds in sorted(DATASET):
            n, guasto = quanti_file(paese, ds)
            if guasto:
                print("   dataset %d  %-28s %s" % (ds, DATASET[ds], guasto))
                continue
            nota = ""
            if ds in (1, 2, 5) and n > 0:
                nota = "  ← LA FONTE È TORNATA"
                tornata = True
            elif ds in (1, 2, 5):
                nota = "  (ancora ferma)"
            print("   dataset %d  %-28s %5d file%s" % (ds, DATASET[ds], n, nota))
        print()

    if tornata:
        print("I dataset recenti offrono file: si può scrivere il fetch vero.")
        print("Attenzione: sono file Parquet, quindi quella pipeline avrà bisogno di")
        print("pyarrow — a differenza di aggiorna.py, che gira sulla sola libreria")
        print("standard. Tenerla in uno script separato, con le sue dipendenze.")
        return 0

    print("I dataset dal 2013 in poi sono ancora vuoti, mentre l'archivio storico")
    print("risponde: il guasto è dell'EEA, non della richiesta. Niente da fare se")
    print("non riprovare più avanti.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
