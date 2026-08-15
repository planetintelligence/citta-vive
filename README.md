# Città vive

Long-form su aria, mobilità, verde e adattamento al caldo in sei metropoli europee
(Parigi, Barcellona, Madrid, Berlino, Londra, Milano). Testata *Planet Intelligence*,
edizione agosto 2026. Testo e direzione editoriale di **Luca Carra**.

→ **[planetintelligence.github.io/citta-vive](https://planetintelligence.github.io/citta-vive/)**

## Le quattro pagine

| | |
|---|---|
| `index.html` | il trattato: testo, fotografie, 11 grafici |
| `dashboard.html` | l'atlante visivo: le sei città con una sola grammatica di segni |
| `metodo.html` | la nota metodologica: quale aria misuriamo, da dove viene ogni numero |
| `cruscotto.html` | le due serie che si aggiornano da sole, da Eurostat |

Sono collegate fra loro (voce di menu e "ponti" in fondo alle pagine).

Le prime tre sono ferme ad agosto 2026 ed è voluto: il trattato è una fotografia, e i
suoi numeri sono legati a un testo che li commenta. Il cruscotto è l'unico posto dove i
dati si muovono.

`metodo.html` non ricopia niente: costruisce la tabella delle fonti, le note per
indicatore e l'elenco delle lacune leggendo `data/charts.js` e `data/citta.js`, gli
stessi file da cui i grafici prendono i valori. Se aggiorni un dato lì, la metodologia
lo segue da sé — è l'unico modo perché non divergano. Le sue due figure a barre sono
HTML e CSS, senza Chart.js: due confronti fermi non giustificano una libreria.

Il sito è statico e funziona anche offline, aperto con un doppio click: Chart.js è
vendorizzato, i dati sono file `.js`, le fotografie stanno nel progetto e non c'è
nessun servizio esterno di mappe. Per lavorarci con un server locale:

```bash
python3 -m http.server 8099
```

## Struttura

```
index.html                  il trattato
dashboard.html              l'atlante visivo
metodo.html                 la nota metodologica, generata dai dati
cruscotto.html              i dati vivi, generati da data/auto/
pipeline/aggiorna.py        li scarica da Eurostat (solo libreria standard)
.github/workflows/          l'Action che lo rilancia il 12 di ogni mese
data/auto/                  QUELLO CHE SCRIVE LA PIPELINE: non modificare a mano
data/charts.js              dati degli 11 grafici, per grafico
data/citta.js               gli stessi indicatori, per città
data/mappa-europa.js        confini d'Europa proiettati (Natural Earth)
data/crediti-immagini.json  autore, licenza e pagina Commons di ogni foto
assets/stile.css            IL SISTEMA GRAFICO: palette, caratteri, componenti
assets/charts.js            motore dei grafici del trattato
assets/dashboard.js         motore dei glifi dell'atlante
assets/img/                 sei fotografie da Wikimedia Commons
assets/vendor/              Chart.js 4.5.1
```

## Il sistema grafico

`assets/stile.css` è l'unica fonte di verità per colori e caratteri: lo caricano
entrambe le pagine, e anche `assets/charts.js` legge da lì i colori di assi e
griglia invece di riscriverli. Cambiare un token lì dentro cambia le due pagine
insieme. Impianto: fondo di carta con grana, filetti sottili, niente ombre lucide;
i sei colori delle città restano quelli originali del pezzo.

## Le mappe

Cinque, tutte disegnate nel progetto, nessun servizio di tiles esterno:

| mappa | cosa mostra |
|---|---|
| Europa | le sei città sulla carta, ciascuna col proprio glifo |
| Londra | la ULEZ che si allarga per anelli, 2019 → 2023 |
| Barcellona | la forma di una superilla: nove isolati, un interno restituito |
| Parigi | la rete ciclabile nel 2001, 2015 e 2024, a confronto |
| Milano | Area C, Area B e la pianura padana che resta fuori |

La carta d'Europa usa i confini di **Natural Earth** (pubblico dominio), proiezione
di Mercatore, generati da script e salvati come geometria già proiettata: 16 KB, e
la pagina resta apribile con un doppio click. I cerchi hanno tutti lo stesso raggio —
a variare è solo quello che contengono, altrimenti sarebbero due codifiche per la
stessa grandezza. Le altre quattro sono schemi, non mappe in scala.

## La grammatica dell'atlante

L'atlante non usa grafici ma segni contabili, dichiarati in legenda (che è la prima
scheda della griglia, non una nota a piè di pagina):

| segno | vale |
|---|---|
| 1 puntino dentro il cerchio | 1 µg/m³ di PM2.5 |
| 1 raggio attorno al cerchio | 10 km di piste / 100.000 ab. |
| arco scuro sul bordo | quota di spostamenti in auto |
| 1 tacca rossa | 50 morti stimate da caldo |
| tratteggio | dato non disponibile |

Il tremolio del tratto è deterministico: stesso seme, stesso disegno a ogni ricarica.

## Provenienza dei dati

Ogni serie in `data/charts.js` porta `fonte`, `url`, `aggiornato` e `stato`:

| stato | significato |
|---|---|
| `consolidato` | dato pubblicato e definitivo |
| `provvisorio` | pubblicato ma soggetto a revisione (tipicamente 2025–2026) |
| `stimato` | uscita di un modello o di uno studio di attribuzione, non una misura |

Lo `stato` diventa il badge sotto ogni grafico: serve a non far passare per misura
quello che è una stima. Le 667 morti evitate a Barcellona e le 499 di Milano sono
numeri modellistici, e il lettore lo vede senza leggere la nota di metodo in fondo.
In `data/citta.js` i buchi restano `null` e vengono disegnati come assenza
tratteggiata, mai come zero. La sezione "Quello che questi disegni non sanno"
li elenca per esteso.

## Fotografie

Sei immagini da Wikimedia Commons, ridimensionate a 1100 px (1,7 MB in tutto).
Credito e licenza sono stampati sotto ogni foto e registrati in
`data/crediti-immagini.json`:

| città | autore | licenza |
|---|---|---|
| Parigi — Rue de Rivoli | Chabe01 | CC BY-SA 4.0 |
| Barcellona — superilla Sant Antoni | Cataleirxs | CC BY-SA 4.0 |
| Madrid — Gran Vía | Javier Perez Montes | CC BY-SA 4.0 |
| Berlino — Fahrradstraße | Singlespeedfahrer | CC0 |
| Londra — cartello ULEZ | citytransportinfo | CC0 |
| Milano — varco Area C | Ita140188 | CC BY-SA 3.0 |

Le CC BY-SA obbligano ad attribuire e a mantenere la stessa licenza sulle opere
derivate: se le foto finiscono altrove, il credito va con loro.

## Diritti

Il testo e la direzione editoriale sono di Luca Carra; la pubblicazione qui è
concordata con l'autore. Le fotografie restano dei rispettivi autori, con le
licenze indicate sopra.

## I dati che si aggiornano da soli

`cruscotto.html` è l'unica pagina viva. Legge `data/auto/`, che riempie
`pipeline/aggiorna.py` scaricando da Eurostat due serie e due soltanto:

| serie | flusso | cadenza | ritardo |
|---|---|---|---|
| NO₂ mensile delle capitali | `ENV_AIR_NO2` | mensile | ~1 mese |
| decessi settimanali per provincia | `DEMO_R_MWK3_T`, `DEMO_R_MWK2_TS` | settimanale | ~5 settimane |

```bash
python3 pipeline/aggiorna.py            # aggiorna data/auto/
python3 pipeline/aggiorna.py --dry-run  # prova senza scrivere
```

Lo script usa la sola libreria standard: nessun `pip install`, né in locale né in CI.
L'Action lo rilancia il 12 di ogni mese e committa **solo se qualcosa è cambiato**.

Tre vincoli che sembrano dettagli e non lo sono:

- **La pipeline non tocca `data/charts.js`.** Quei numeri sono legati al testo del
  trattato, che li commenta: riscriverli sotto vorrebbe dire far mentire il testo il
  giorno in cui Eurostat rivede una serie. I dati automatici stanno in `data/auto/` e
  li legge solo il cruscotto.
- **Le serie del cruscotto non sono confrontabili con quelle del trattato.** Il pezzo
  usa stazioni da traffico, Eurostat qui non dichiara il tipo di stazione e i valori
  risultano più bassi. Il cruscotto lo dice a chiare lettere, `metodo.html` spiega perché.
- **Il perimetro della fonte non coincide con quello del pezzo.** Il NO₂ di Eurostat
  copre le capitali: mancano Barcellona, Milano e Londra, e compare Roma. Sui decessi
  manca Londra, perché il Regno Unito non trasmette più dal 2021. Le pagine dichiarano
  le assenze invece di far finta che le sei città ci siano tutte.

Perché solo due serie: piste ciclabili, quote di spostamento, superfici verdi e
personale della manutenzione non esistono in nessuna banca dati interrogabile — stanno
in piani comunali, indagini quinquennali e contratti d'appalto. L'Urban Audit di
Eurostat sembrerebbe la risposta, ma i suoi indicatori ambientali sono fermi al 2013 e
per Barcellona e Milano sono vuoti.
