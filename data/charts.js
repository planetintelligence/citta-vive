/* ============================================================
   Città vive — dati dei grafici
   ------------------------------------------------------------
   Questo file contiene SOLO dati, nessuna logica di disegno.
   Ogni serie porta con sé la propria provenienza:
     fonte        chi pubblica il dato
     url          dove verificarlo
     aggiornato   ultima verifica manuale (AAAA-MM)
     stato        "consolidato" | "provvisorio" | "stimato"
     stazione     per le serie sulla qualità dell'aria: quale tipo di
                  centralina è stato letto ("traffico", "fondo", "mista").
                  Cambia i valori anche del doppio, quindi va dichiarato.
                  ASSENTE = la fonte non lo specifica: non inventarlo,
                  metodo.html mostra la casella vuota ed è giusto così.
     riscontro    facoltativo: dice al lettore che di questa serie esiste
                  un riscontro alle centraline, aggiornato, sul cruscotto.
                  Porta SOLO il rimando, mai un numero — se qui entrasse un
                  valore che si muove, il testo di Luca lo commenterebbe
                  frase per frase senza più corrispondergli. Vale anche
                  quando il riscontro c'è ma NON è confrontabile: dirlo è
                  metà del punto.

   È un file .js (non .json) di proposito: così l'articolo si apre
   con un doppio click, senza server locale. La struttura è
   JSON puro, quindi resta leggibile e riscrivibile da uno script
   quando i dati verranno aggiornati automaticamente.
   ============================================================ */

window.CITTA_VIVE = {

  palette: {
    paris: '#005BAC', london: '#DC241F', barcelona: '#F4B223',
    madrid: '#7A3E9D', berlin: '#0F8B8D', milan: '#E63946', green: '#3f9d4f'
  },

  charts: {

    /* ---------- INTRODUZIONE ---------- */
    no2Chart: {
      tipo: 'line',
      titolo: 'Concentrazioni di NO₂ nelle sei città (µg/m³), 2013–2025',
      unita: 'µg/m³ NO₂',
      fonte: 'EEA Air Quality Database; Airparif, Generalitat de Catalunya, Ayuntamiento de Madrid, berlin.de/luftdaten, Greater London Authority. Milano: EEA, dati validati E1a, medie annue calcolate dalle osservazioni orarie delle 7 stazioni da traffico del comune',
      url: 'https://www.eea.europa.eu/en/datahub',
      aggiornato: '2026-08',
      stato: 'provvisorio',
      stazione: 'traffico',
      nota: 'Medie annue di stazioni rappresentative da traffico. Il 2020 riflette il calo eccezionale dei lockdown; i valori 2025 sono provvisori. Milano è entrata dopo le altre e con un metodo suo: le altre cinque seguono una centralina rappresentativa, Milano è la media delle sette stazioni da traffico del comune, calcolata dai dati validati dell’Agenzia europea dell’ambiente. Per questo la sua serie comincia nel 2015 e si ferma al 2024 invece di coprire tutto il periodo: prima e dopo la fonte non arriva. È un livello confrontabile con gli altri, non una misura fatta allo stesso modo.',
      riscontro: { dove: 'cruscotto.html#sez-scostamento',
                   testo: 'Di questa serie esiste un riscontro alle centraline, aggiornato: sul cruscotto lo scostamento è misurato città per città' },
      etichette: ['2013','2014','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'],
      serie: [
        { nome: 'Parigi',                  colore: 'paris',     dati: [44,42,41,40,38,37,36,29,33,32,31,30,29] },
        { nome: 'Barcellona (Eixample)',   colore: 'barcelona', dati: [60,58,56,54,52,50,47,38,42,38,35,33,29] },
        { nome: 'Madrid (Plaza Elíptica)', colore: 'madrid',    dati: [58,57,56,55,56,54,53,40,44,37,33,31,29] },
        { nome: 'Berlino (traffico)',      colore: 'berlin',    dati: [50,49,49,48,47,45,42,36,33,30,28,26,25] },
        { nome: 'Londra (centro)',         colore: 'london',    dati: [72,68,64,60,54,48,41,33,29,25,22,21,20] },
        /* Milano: media delle 7 stazioni da traffico del comune, non una centralina
           sola come le altre cinque — lo dice il nome della serie e lo spiega la
           nota. I null ai due capi sono buchi veri (la fonte non copre 2013-2014
           né il 2025) e restano buchi: il grafico non tira la riga sopra. */
        { nome: 'Milano (media traffico)', colore: 'milan',
          dati: [null,null,59.1,51.6,55.6,48.5,44.9,40.7,41.0,39.2,37.2,35.3,null] }
      ],
      soglie: [
        { nome: 'Limite UE (40 µg/m³)',        valore: 40, colore: '#999', tratteggio: [6,4], spessore: 1.5 },
        { nome: 'Valore guida OMS (10 µg/m³)', valore: 10, colore: '#bbb', tratteggio: [3,3], spessore: 1 }
      ],
      asseY: { min: 0, max: 80 }
    },

    /* ---------- PARIGI ---------- */
    cyclingParis: {
      tipo: 'bar',
      titolo: 'Parigi: chilometri di piste ciclabili, 2001–2024',
      unita: 'Chilometri totali',
      fonte: "Mairie de Paris, Plan Vélo 2021–2026",
      url: 'https://www.paris.fr/pages/paris-a-velo-198',
      aggiornato: '2026-08',
      stato: 'consolidato',
      etichette: ['2001','2005','2010','2015','2019','2020','2021','2022','2023','2024'],
      serie: [
        { nome: 'km di piste ciclabili', colore: 'paris', dati: [200,371,530,700,1000,1150,1200,1320,1380,1420] }
      ],
      legenda: false
    },

    /* ---------- BARCELLONA ---------- */
    healthBenefits: {
      tipo: 'bar',
      titolo: 'Barcellona: morti premature evitabili ogni anno con il modello Superblock',
      unita: 'Morti evitate/anno',
      fonte: 'Mueller N. et al. (2020), Superblock model, Environment International',
      url: 'https://doi.org/10.1016/j.envint.2019.105132',
      aggiornato: '2026-08',
      stato: 'stimato',
      nota: 'Stima modellistica a piena attuazione dei 503 Superblocks, non un dato osservato.',
      etichette: ['Riduzione PM2.5','Riduzione calore','Aumento attività fisica','Riduzione rumore','Totale stimato'],
      serie: [
        { nome: 'Morti premature evitate/anno',
          coloriPerBarra: ['#81c784','#ffb74d','#64b5f6','#ce93d8','#ef5350'],
          dati: [446,108,73,40,667] }
      ],
      legenda: false
    },

    /* ---------- MADRID ---------- */
    madridAir: {
      tipo: 'bar',
      titolo: 'Madrid: NO₂ per stazione di misura, 2019 vs 2024',
      unita: 'µg/m³ NO₂',
      fonte: 'Ayuntamiento de Madrid, qualità dell’aria 2024',
      url: 'https://diario.madrid.es/blog/notas-de-prensa/madrid-cumple-por-tercer-ano-con-la-directiva-europea-y-cierra-2024-con-la-mejor-calidad-del-aire-de-su-historia/',
      aggiornato: '2026-08',
      stato: 'consolidato',
      stazione: 'mista',
      nota: 'Le prime tre stazioni sono da traffico, Retiro è di fondo urbano: è il confronto che mostra quanto la scelta della centralina cambi il risultato.',
      riscontro: { dove: 'cruscotto.html#sez-scostamento',
                   testo: 'Perché questa serie non si può confrontare con i dati vivi, e che cosa si confronta al suo posto' },
      etichette: ['Plaza Elíptica','Escuelas Aguirre','Castellana','Retiro (fondo)','Media città'],
      serie: [
        { nome: '2019 (µg/m³)', colore: 'madrid', riempimento: 'rgba(122,62,157,.3)', bordo: true, dati: [53,51,47,24,48] },
        { nome: '2024 (µg/m³)', colore: 'madrid', dati: [31,28,30,15,29] }
      ],
      asseY: { min: 0, max: 60 }
    },

    /* ---------- LONDRA ---------- */
    ulezChart: {
      tipo: 'line',
      titolo: 'Londra: NO₂ nella zona ULEZ centrale, 2016–2024',
      unita: 'µg/m³ NO₂',
      fonte: 'Transport for London, London-wide ULEZ One Year Report (2024)',
      url: 'https://content.tfl.gov.uk/london-wide-ulez-one-year-report.pdf',
      aggiornato: '2026-08',
      stato: 'consolidato',
      riscontro: { dove: 'cruscotto.html#sez-scostamento',
                   testo: 'Perché questa serie non si può confrontare con i dati vivi, e che cosa si confronta al suo posto' },
      etichette: ['2016','2017','2018','2019 (ULEZ)','2020','2021 (Inner)','2022','2023 (Greater)','2024'],
      serie: [
        { nome: 'NO₂ zona ULEZ centrale (µg/m³)', colore: 'london', riempi: true, spessore: 3, punto: 5,
          dati: [68,65,62,55,44,40,37,34,31] }
      ],
      legenda: false,
      asseY: { min: 0, max: 80 }
    },

    /* ---------- MILANO ---------- */
    milanAirChart: {
      tipo: 'bar',
      orizzontale: true,
      titolo: 'PM2.5 medio annuo nelle sei città',
      unita: 'µg/m³ PM2.5',
      fonte: 'ARPA Lombardia; EEA Air Quality Database; Legambiente Mal’Aria 2026',
      url: 'https://www.arpalombardia.it/temi-ambientali/aria/',
      aggiornato: '2026-08',
      stato: 'provvisorio',
      riscontro: { dove: 'cruscotto.html#sez-scostamento',
                   testo: 'Di questa serie esiste un riscontro alle centraline, aggiornato: sul cruscotto è affiancata al traffico e al fondo urbano' },
      etichette: ['Milano','Barcellona','Parigi','Berlino','Londra','Madrid'],
      serie: [
        { nome: 'PM2.5 medio annuo (µg/m³)',
          coloriPerBarra: ['milan','barcelona','paris','berlin','london','madrid'],
          dati: [21,13,12,11,10,9] }
      ],
      legenda: false,
      asseX: { min: 0, max: 25 }
    },

    milanCycleChart: {
      tipo: 'bar',
      titolo: 'Piste ciclabili per 100.000 abitanti',
      unita: 'km per 100.000 ab.',
      fonte: 'Elaborazione su dati comunali (Paris, Milano, Barcelona, Madrid, TfL)',
      url: 'https://www.paris.fr/pages/paris-a-velo-198',
      aggiornato: '2026-08',
      stato: 'stimato',
      nota: 'Rapporto calcolato su popolazione del comune centrale, non dell’area metropolitana: penalizza Londra, che misura la rete sulla Greater London.',
      etichette: ['Parigi','Milano','Barcellona','Madrid','Londra'],
      serie: [
        { nome: 'km piste ciclabili per 100.000 ab.',
          coloriPerBarra: ['paris','milan','barcelona','madrid','london'],
          dati: [66.7,24.1,16.3,9.5,4.5] }
      ],
      legenda: false
    },

    milanModalChart: {
      tipo: 'bar',
      titolo: 'Quota di spostamenti in auto privata',
      unita: '% auto privata',
      fonte: 'Senatsverwaltung Berlin SrV 2023; Institut Paris Région; AMAT Milano; TfL Travel in London',
      url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/verkehrsdaten/zahlen-und-fakten/mobilitaet-in-staedten-srv-2023/',
      aggiornato: '2026-08',
      stato: 'consolidato',
      nota: 'Indagini nazionali diverse per anno e metodo: il confronto è indicativo dell’ordine di grandezza, non una misura omogenea.',
      etichette: ['Parigi','Berlino','Barcellona','Londra','Madrid','Milano'],
      serie: [
        { nome: '% spostamenti in auto privata',
          coloriPerBarra: ['paris','berlin','barcelona','london','madrid','milan'],
          dati: [13,22,22,28,34,36] }
      ],
      legenda: false,
      suffisso: '% degli spostamenti in auto',
      asseY: { max: 50 }
    },

    /* ---------- VERDE E CALDO ---------- */
    treeCooling: {
      tipo: 'bar',
      orizzontale: true,
      titolo: 'Raffrescamento della temperatura superficiale prodotto dagli alberi',
      unita: '°C di raffrescamento (max)',
      fonte: 'Schwaab J. et al. (2021), Nature Communications',
      url: 'https://www.nature.com/articles/s41467-021-26768-w',
      aggiornato: '2026-08',
      stato: 'consolidato',
      etichette: ['Alberi, Europa centrale','Alberi, Europa mediterranea'],
      serie: [
        { nome: 'Raffrescamento della temperatura superficiale (°C)',
          coloriPerBarra: ['green','#a5d6a7'], dati: [10,2],
          intervalli: ['8-12','0-4'] }
      ],
      legenda: false,
      asseX: { min: 0, max: 14 }
    },

    heatDeaths: {
      tipo: 'bar',
      titolo: 'Morti stimate legate al caldo, 23 giugno – 2 luglio 2025',
      unita: 'Morti stimate',
      fonte: 'Grantham Institute (Imperial College) e LSHTM (2025), studio di attribuzione',
      url: 'https://www.imperial.ac.uk/grantham/',
      aggiornato: '2026-08',
      stato: 'stimato',
      nota: 'Stima di attribuzione rapida su una singola ondata di calore, con intervalli di incertezza ampi.',
      etichette: ['Milano','Barcellona','Parigi'],
      serie: [
        { nome: 'Morti stimate legate al caldo (23 giu – 2 lug 2025)',
          coloriPerBarra: ['milan','barcelona','paris'], dati: [499,286,235] }
      ],
      legenda: false
    },

    /* ---------- LEZIONI ---------- */
    trafficComparison: {
      tipo: 'bar',
      titolo: 'Traffico automobilistico rispetto al picco storico (=100)',
      unita: '% rispetto al picco storico (=100)',
      fonte: 'Mairie de Paris; Ajuntament de Barcelona; Ayuntamiento de Madrid; Transport for London',
      url: 'https://content.tfl.gov.uk/london-wide-ulez-one-year-report.pdf',
      aggiornato: '2026-08',
      stato: 'stimato',
      nota: 'Serie indicizzate su basi e perimetri diversi città per città: mostrano la direzione del cambiamento, non un confronto quantitativo diretto.',
      etichette: ['2005','2010','2015','2020','2024'],
      serie: [
        { nome: 'Parigi (zona centrale)',        colore: 'paris',     dati: [100,92,85,68,58] },
        { nome: 'Barcellona (zone Superblock)',  colore: 'barcelona', dati: [100,99,98,90,62] },
        { nome: 'Madrid (Distrito Centro)',      colore: 'madrid',    dati: [100,99,97,80,72] },
        { nome: 'Londra (Congestion/ULEZ)',      colore: 'london',    dati: [100,95,87,70,62] }
      ],
      asseY: { min: 0, max: 110 }
    }
  }
};
