/* ============================================================
   Città vive — motore dei grafici
   ------------------------------------------------------------
   Legge window.CITTA_VIVE (data/charts.js) e disegna gli 11
   grafici. Nessun dato qui dentro: solo come si disegnano.
   ============================================================ */

(function () {
  'use strict';

  if (typeof Chart === 'undefined') {
    console.error('[città vive] Chart.js non caricato: i grafici restano vuoti.');
    return;
  }
  if (!window.CITTA_VIVE) {
    console.error('[città vive] data/charts.js non caricato: nessun dato da disegnare.');
    return;
  }

  var PALETTE = window.CITTA_VIVE.palette;
  var CHARTS = window.CITTA_VIVE.charts;

  /* i colori li detta assets/stile.css: qui si leggono, non si riscrivono.
     Così il trattato e l'atlante restano intonati da soli. */
  function token(nome, ripiego) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return v || ripiego;
  }
  var TENUE = token('--tenue', '#8d8271');
  var RIGA = token('--riga', '#ddd3c2');
  var SU_SCURO = token('--su-scuro', 'rgba(255,255,255,.78)');
  var RIGA_SCURA = token('--riga-scura', 'rgba(255,255,255,.16)');

  Chart.defaults.font.family = token('--sans', "'Helvetica Neue', Arial, sans-serif");
  Chart.defaults.color = TENUE;

  /* una chiave di palette ("paris") o un colore letterale ("#a5d6a7") */
  function colore(c) {
    return (c && PALETTE[c]) ? PALETTE[c] : c;
  }

  function trasparente(c, alpha) {
    var hex = colore(c);
    if (!hex || hex.charAt(0) !== '#') return hex;
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  /* ---------- dataset ---------- */

  function datasetLinea(s) {
    return {
      label: s.nome,
      data: s.dati,
      borderColor: colore(s.colore),
      backgroundColor: trasparente(s.colore, 0.10),
      tension: 0.4,
      fill: !!s.riempi,
      borderWidth: s.spessore || 2.4,
      pointRadius: s.punto || 2.5,
      pointBackgroundColor: colore(s.colore)
    };
  }

  function datasetSoglia(t, nPunti) {
    var dati = [];
    for (var i = 0; i < nPunti; i++) dati.push(t.valore);
    return {
      label: t.nome,
      data: dati,
      borderColor: t.colore,
      borderDash: t.tratteggio,
      borderWidth: t.spessore,
      pointRadius: 0,
      fill: false
    };
  }

  function datasetBarra(s) {
    var sfondo;
    if (s.coloriPerBarra) sfondo = s.coloriPerBarra.map(colore);
    else if (s.riempimento) sfondo = s.riempimento;
    else sfondo = colore(s.colore);

    var d = {
      label: s.nome,
      data: s.dati,
      backgroundColor: sfondo,
      borderRadius: s.coloriPerBarra ? 6 : 4
    };
    if (s.bordo) {
      d.borderColor = colore(s.colore);
      d.borderWidth = 2;
    }
    return d;
  }

  /* ---------- opzioni ---------- */

  /* le sezioni "verde e caldo" e "lezioni" hanno fondo scuro:
     lì assi, griglia e legenda devono schiarirsi, altrimenti
     il testo grigio resta illeggibile sul fondo */
  function suFondoScuro(canvas) {
    return !!canvas.closest('.green-section, .lessons');
  }

  function opzioni(cfg, scuro) {
    var testoAsse = scuro ? SU_SCURO : TENUE;
    var griglia = scuro ? RIGA_SCURA : RIGA;

    var asseValori = {
      title: { display: true, text: cfg.unita, font: { size: 11 }, color: testoAsse },
      grid: { color: griglia },
      ticks: { color: testoAsse }
    };
    var asseCategorie = { grid: { display: false }, ticks: { color: testoAsse } };

    var limiti = cfg.orizzontale ? cfg.asseX : cfg.asseY;
    if (limiti) {
      if (limiti.min !== undefined) asseValori.min = limiti.min;
      if (limiti.max !== undefined) asseValori.max = limiti.max;
    }

    var tooltip = {};
    if (cfg.suffisso) {
      tooltip.callbacks = { label: function (ctx) { return ctx.raw + cfg.suffisso.replace(/^%?/, '%'); } };
    }
    /* treeCooling: la barra è il massimo, il tooltip mostra l'intervallo vero */
    var serieConIntervalli = cfg.serie.filter(function (s) { return s.intervalli; })[0];
    if (serieConIntervalli) {
      tooltip.callbacks = {
        label: function (ctx) {
          return 'fino a ' + serieConIntervalli.intervalli[ctx.dataIndex] + ' °C in meno';
        }
      };
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: cfg.orizzontale ? 'y' : 'x',
      plugins: {
        legend: cfg.legenda === false
          ? { display: false }
          : { position: 'bottom', labels: scuro ? { color: SU_SCURO, boxWidth: 12 } : {} },
        tooltip: tooltip
      },
      scales: cfg.orizzontale
        ? { x: asseValori, y: asseCategorie }
        : { y: asseValori, x: asseCategorie }
    };
  }

  /* ---------- badge di provenienza ---------- */

  var ETICHETTE_STATO = {
    consolidato: 'dato consolidato',
    provvisorio: 'dato provvisorio',
    stimato: 'stima modellistica'
  };

  function badge(canvas, cfg) {
    var wrap = canvas.closest('.chart-wrap');
    if (!wrap || wrap.querySelector('.data-badge')) return;

    var p = document.createElement('p');
    p.className = 'data-badge stato-' + cfg.stato;

    var tag = document.createElement('span');
    tag.className = 'badge-tag';
    tag.textContent = ETICHETTE_STATO[cfg.stato] || cfg.stato;
    p.appendChild(tag);

    /* la fonte è già scritta per esteso nella didascalia sopra:
       il badge aggiunge solo ciò che lì non c'è, cioè quanto è
       solido il dato e quando è stato verificato */
    var testo = document.createElement('span');
    testo.className = 'badge-testo';
    testo.textContent = 'verificato ' + cfg.aggiornato;
    p.appendChild(testo);

    if (cfg.nota) {
      var nota = document.createElement('span');
      nota.className = 'badge-nota';
      nota.textContent = cfg.nota;
      p.appendChild(nota);
    }

    /* il rimando al riscontro vivo, dove esiste. Porta un link e non un
       numero: questa pagina è una fotografia dell'agosto 2026 e il testo
       la commenta frase per frase, quindi qui dentro niente si muove.
       Di quanto si sia mosso lo dice il cruscotto, che è l'altra pagina. */
    if (cfg.riscontro) {
      var r = document.createElement('a');
      r.className = 'badge-riscontro';
      r.href = cfg.riscontro.dove;
      r.textContent = cfg.riscontro.testo + ' →';
      p.appendChild(r);
    }
    wrap.appendChild(p);
  }

  /* ---------- disegno ---------- */

  var disegnati = 0, mancanti = [];

  Object.keys(CHARTS).forEach(function (id) {
    var cfg = CHARTS[id];
    var canvas = document.getElementById(id);
    if (!canvas) { mancanti.push(id); return; }

    /* il file salvato dal browser aveva le dimensioni congelate
       negli attributi: le tolgo, così il grafico è responsivo */
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    canvas.removeAttribute('style');

    var datasets = cfg.serie.map(cfg.tipo === 'line' ? datasetLinea : datasetBarra);
    if (cfg.soglie) {
      cfg.soglie.forEach(function (t) {
        datasets.push(datasetSoglia(t, cfg.etichette.length));
      });
    }

    new Chart(canvas, {
      type: cfg.tipo,
      data: { labels: cfg.etichette, datasets: datasets },
      options: opzioni(cfg, suFondoScuro(canvas))
    });

    badge(canvas, cfg);
    disegnati++;
  });

  if (mancanti.length) console.warn('[città vive] canvas mancanti:', mancanti.join(', '));
  console.log('[città vive] grafici disegnati: ' + disegnati + '/' + Object.keys(CHARTS).length);
})();
