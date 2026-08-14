/* ============================================================
   Città vive — indicatori per città
   ------------------------------------------------------------
   data/charts.js organizza i numeri PER GRAFICO. Questo file li
   riorganizza PER CITTÀ, che è quello che serve alla dashboard.

   Regola: i buchi restano buchi. Dove il dato non c'è il valore
   è null e la dashboard lo disegna come assenza dichiarata, mai
   come zero e mai interpolato.
   ============================================================ */

window.CITTA_VIVE_CITTA = {

  /* la grammatica visiva: quanto "vale" un segno sulla pagina */
  grammatica: {
    puntino_pm25:   { unita: 'µg/m³ PM2.5',            per_segno: 1   },
    raggio_bici:    { unita: 'km piste / 100.000 ab.', per_segno: 10  },
    tacca_caldo:    { unita: 'morti stimate',          per_segno: 50  },
    quadratino_auto:{ unita: '% spostamenti',          per_segno: 1   }
  },

  note_globali: {
    caldo: 'Morti stimate in una singola ondata di calore, 23 giugno – 2 luglio 2025. Non è un dato annuale.',
    no2: 'Media annua 2025 di stazioni da traffico, valore provvisorio.',
    bici: 'Km di rete rapportati alla popolazione del comune centrale: penalizza Londra, che misura la rete sull’intera Greater London.',
    auto: 'Indagini nazionali sulla mobilità, anni e metodi diversi. Indicativo dell’ordine di grandezza.'
  },

  citta: [
    {
      id: 'paris', nome: 'Parigi', paese: '🇫🇷', colore: '#005BAC',
      titolo: 'La révolution du vélo',
      no2_2025: 29, pm25: 12, auto_pct: 13, bici_km_100k: 66.7, caldo_morti: 235,
      no2_serie: [44,42,41,40,38,37,36,29,33,32,31,30,29],
      verde: '170.000 alberi piantati, cortili-oasi',
      chiave: 'La bici (11,2%) ha superato l’auto (4,3%) dentro il perimetro cittadino.'
    },
    {
      id: 'barcelona', nome: 'Barcellona', paese: '🇪🇸', colore: '#F4B223',
      titolo: 'Le superilles',
      no2_2025: 29, pm25: 13, auto_pct: 22, bici_km_100k: 16.3, caldo_morti: 286,
      no2_serie: [60,58,56,54,52,50,47,38,42,38,35,33,29],
      verde: 'Rete di rifugi climatici, Pla Natura',
      chiave: '667 morti premature evitabili ogni anno a piena attuazione dei Superblocks (stima).'
    },
    {
      id: 'madrid', nome: 'Madrid', paese: '🇪🇸', colore: '#7A3E9D',
      titolo: 'L’aria pulita in tribunale',
      no2_2025: 29, pm25: 9, auto_pct: 34, bici_km_100k: 9.5, caldo_morti: null,
      no2_serie: [58,57,56,55,56,54,53,40,44,37,33,31,29],
      verde: 'Bosque Metropolitano, il grande anello verde',
      chiave: 'Il PM2.5 più basso delle sei, ma un terzo degli spostamenti resta in auto.'
    },
    {
      id: 'berlin', nome: 'Berlino', paese: '🇩🇪', colore: '#0F8B8D',
      titolo: 'La Verkehrswende dal basso',
      no2_2025: 25, pm25: 11, auto_pct: 22, bici_km_100k: null, caldo_morti: null,
      no2_serie: [50,49,49,48,47,45,42,36,33,30,28,26,25],
      verde: '430.000 alberi stradali, città spugna',
      chiave: '18% degli spostamenti in bicicletta nel 2023, senza una rete paragonabile a Parigi.'
    },
    {
      id: 'london', nome: 'Londra', paese: '🇬🇧', colore: '#DC241F',
      titolo: 'L’effetto ULEZ',
      no2_2025: 20, pm25: 10, auto_pct: 28, bici_km_100k: 4.5, caldo_morti: null,
      no2_serie: [72,68,64,60,54,48,41,33,29,25,22,21,20],
      verde: 'Prima National Park City al mondo',
      chiave: 'Partita dal NO₂ peggiore delle sei nel 2013, oggi è la migliore.'
    },
    {
      id: 'milan', nome: 'Milano', paese: '🇮🇹', colore: '#E63946',
      titolo: 'La trappola della pianura',
      no2_2025: null, pm25: 21, auto_pct: 36, bici_km_100k: 24.1, caldo_morti: 499,
      no2_serie: null,
      verde: 'ForestaMi, obiettivo 3 milioni di alberi al 2030',
      chiave: 'Il PM2.5 più alto e la quota d’auto più alta. Il NO₂ non è nella serie comparativa.'
    }
  ],

  /* cosa manca, detto per esteso invece che lasciato intuire */
  lacune: [
    'Milano non compare nella serie storica comparativa del NO₂ (data/charts.js → no2Chart).',
    'Berlino non compare nel confronto sui km di piste ciclabili per abitante.',
    'Le morti da caldo sono disponibili solo per Milano, Barcellona e Parigi: lo studio di attribuzione copriva quelle città.',
    'Il patrimonio arboreo non è confrontabile: ogni città conta cose diverse (alberi piantati, alberi stradali, obiettivi al 2030).'
  ]
};
