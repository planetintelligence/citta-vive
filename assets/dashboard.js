/* ============================================================
   Città vive — atlante visivo
   ------------------------------------------------------------
   Disegna i glifi delle sei città a partire da data/citta.js.
   Nessun numero qui dentro: solo come i numeri diventano segni.

   La grammatica (dichiarata nella legenda della pagina):
     1 puntino    = 1 µg/m³ di PM2.5          dentro il cerchio
     1 raggio     = 10 km di piste / 100.000 ab.  attorno al cerchio
     1 arco scuro = quota di spostamenti in auto  sul bordo
     1 tacca      = 50 morti stimate da caldo     sotto il cerchio
     tratteggio   = dato non disponibile
   ============================================================ */

(function () {
  'use strict';

  var D = window.CITTA_VIVE_CITTA;
  if (!D) { console.error('[atlante] data/citta.js non caricato'); return; }

  var NS = 'http://www.w3.org/2000/svg';
  var INCHIOSTRO = '#2b2b2b';
  var CARTA = '#f2ede3';

  /* ---------- casualità deterministica ----------
     Il tremolio della mano non deve cambiare a ogni ricarica:
     stesso seme, stesso disegno. */
  function seme(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  function el(tag, attr) {
    var e = document.createElementNS(NS, tag);
    for (var k in attr) e.setAttribute(k, attr[k]);
    return e;
  }

  /* ---------- tratto disegnato a mano ---------- */

  /* una linea con un impercettibile arco: mai perfettamente dritta */
  function linea(x1, y1, x2, y2, rnd, opt) {
    opt = opt || {};
    var sc = (rnd() - 0.5) * (opt.tremore || 1.6);
    var mx = (x1 + x2) / 2 + sc, my = (y1 + y2) / 2 + sc;
    return el('path', {
      d: 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2,
      stroke: opt.colore || INCHIOSTRO,
      'stroke-width': opt.spessore || 1.1,
      'stroke-linecap': 'round',
      fill: 'none',
      'stroke-dasharray': opt.tratteggio || 'none',
      opacity: opt.opacita === undefined ? 1 : opt.opacita
    });
  }

  /* un cerchio con il raggio che respira: 24 punti leggermente irregolari */
  function cerchio(cx, cy, r, rnd, opt) {
    opt = opt || {};
    var passi = 26, d = '', ampiezza = opt.tremore || 1.4;
    for (var i = 0; i <= passi; i++) {
      var a = (i / passi) * Math.PI * 2;
      var rr = r + (rnd() - 0.5) * ampiezza;
      var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    return el('path', {
      d: d + 'Z',
      stroke: opt.colore || INCHIOSTRO,
      'stroke-width': opt.spessore || 1.3,
      'stroke-linejoin': 'round',
      fill: opt.riempimento || 'none',
      'stroke-dasharray': opt.tratteggio || 'none',
      opacity: opt.opacita === undefined ? 1 : opt.opacita
    });
  }

  /* un arco sul bordo: la fetta di città che si muove ancora in auto */
  function arco(cx, cy, r, da, a, rnd, opt) {
    opt = opt || {};
    var passi = Math.max(6, Math.round((a - da) / 0.12)), d = '';
    for (var i = 0; i <= passi; i++) {
      var ang = da + (a - da) * (i / passi);
      var rr = r + (rnd() - 0.5) * 1.2;
      var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    return el('path', {
      d: d,
      stroke: opt.colore || INCHIOSTRO,
      'stroke-width': opt.spessore || 7,
      'stroke-linecap': 'round',
      fill: 'none',
      opacity: opt.opacita === undefined ? 1 : opt.opacita
    });
  }

  function testo(x, y, str, opt) {
    opt = opt || {};
    var t = el('text', {
      x: x, y: y,
      'font-family': opt.mano ? "'Bradley Hand','Chalkboard SE','Marker Felt',cursive"
                              : "'Helvetica Neue',Arial,sans-serif",
      'font-size': opt.dim || 10,
      fill: opt.colore || INCHIOSTRO,
      'text-anchor': opt.ancora || 'start',
      'font-weight': opt.peso || 'normal',
      opacity: opt.opacita === undefined ? 1 : opt.opacita
    });
    t.textContent = str;
    return t;
  }

  /* ---------- il glifo di una città ---------- */

  /* Le fasce verticali sono separate di proposito: l'etichetta della
     percentuale sta sopra la punta massima dei raggi, le tacche sotto
     la loro punta inferiore, la traiettoria in fondo. Senza questo
     margine le scritte si sovrappongono ai segni. */
  var W = 250, H = 336, CX = 125, CY = 128, R = 50;
  var RAGGIO_MAX = R + 4 + 32;          /* punta più lontana dei raggi */
  var Y_ETICHETTA = 16;                 /* "% in auto", sopra tutto */
  var Y_TACCHE = 244;                   /* tacche del caldo */
  var Y_SERIE = 312;                    /* base della traiettoria NO₂ */

  function glifo(c) {
    var rnd = seme(c.id);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'glifo' });

    /* --- 1. il cerchio: la città --- */
    svg.appendChild(cerchio(CX, CY, R, rnd, { colore: c.colore, spessore: 1.6 }));

    /* --- 2. i puntini dentro: PM2.5, uno per µg/m³ --- */
    if (c.pm25 != null) {
      for (var i = 0; i < c.pm25; i++) {
        /* disposizione a spirale, così la densità si legge a colpo d'occhio */
        var t = i / c.pm25;
        var ang = i * 2.399963;                 /* angolo aureo */
        var rr = Math.sqrt(t) * (R - 11);
        svg.appendChild(el('circle', {
          cx: (CX + Math.cos(ang) * rr + (rnd() - 0.5) * 2).toFixed(1),
          cy: (CY + Math.sin(ang) * rr + (rnd() - 0.5) * 2).toFixed(1),
          r: 2.5, fill: c.colore, opacity: 0.75
        }));
      }
    }

    /* --- 3. i raggi fuori: piste ciclabili, uno ogni 10 km/100.000 ab. --- */
    var g = el('g', {});
    if (c.bici_km_100k != null) {
      var interi = Math.floor(c.bici_km_100k / 10);
      var resto = (c.bici_km_100k / 10) - interi;
      var totale = interi + (resto > 0.05 ? 1 : 0);
      for (var k = 0; k < totale; k++) {
        /* si parte dal basso: la cima resta libera per l'etichetta */
        var a2 = Math.PI / 2 + (k / Math.max(totale, 8)) * Math.PI * 2;
        var quota = (k < interi) ? 1 : resto;     /* l'ultimo raggio è parziale */
        var l = 10 + quota * 22;
        g.appendChild(linea(
          CX + Math.cos(a2) * (R + 4), CY + Math.sin(a2) * (R + 4),
          CX + Math.cos(a2) * (R + 4 + l), CY + Math.sin(a2) * (R + 4 + l),
          rnd, { colore: c.colore, spessore: 2 }
        ));
      }
    } else {
      /* dato assente: un arco tratteggiato, non un cerchio vuoto */
      g.appendChild(cerchio(CX, CY, R + 20, rnd, {
        colore: '#b3a99a', spessore: 1, tratteggio: '3,5'
      }));
      g.appendChild(testo(CX, CY + R + 40, 'rete ciclabile: dato assente',
        { dim: 8.5, ancora: 'middle', colore: '#8d8271', mano: true }));
    }
    svg.appendChild(g);

    /* --- 4. l'arco scuro sul bordo: la quota di spostamenti in auto --- */
    if (c.auto_pct != null) {
      var estensione = (c.auto_pct / 100) * Math.PI * 2;
      var inizio = -Math.PI / 2;
      svg.appendChild(arco(CX, CY, R, inizio, inizio + estensione, rnd,
        { colore: INCHIOSTRO, spessore: 7, opacita: 0.82 }));
      svg.appendChild(testo(CX, Y_ETICHETTA, c.auto_pct + '% in auto',
        { dim: 10, ancora: 'middle', peso: '700' }));
    }

    /* --- 5. le tacche sotto: morti da caldo, una ogni 50 --- */
    var yT = Y_TACCHE;
    if (c.caldo_morti != null) {
      var tacche = c.caldo_morti / 50;
      var piene = Math.floor(tacche), parziale = tacche - piene;
      var x0 = CX - (Math.min(piene, 10) * 7) / 2;
      for (var j = 0; j < piene; j++) {
        var xx = x0 + j * 7;
        svg.appendChild(linea(xx, yT - 9, xx, yT + 9, rnd,
          { colore: '#c0392b', spessore: 1.8 }));
      }
      if (parziale > 0.1) {
        var xp = x0 + piene * 7;
        svg.appendChild(linea(xp, yT + 9 - 18 * parziale, xp, yT + 9, rnd,
          { colore: '#c0392b', spessore: 1.8, opacita: 0.6 }));
      }
      svg.appendChild(testo(CX, yT + 22, c.caldo_morti + ' morti in 10 giorni',
        { dim: 9, ancora: 'middle', colore: '#c0392b', mano: true }));
    } else {
      svg.appendChild(linea(CX - 26, yT, CX + 26, yT, rnd,
        { colore: '#b3a99a', spessore: 1, tratteggio: '3,4' }));
      svg.appendChild(testo(CX, yT + 22, 'caldo: non misurato qui',
        { dim: 8.5, ancora: 'middle', colore: '#8d8271', mano: true }));
    }

    /* --- 6. il NO₂ come traiettoria, in basso --- */
    var yS = Y_SERIE;
    if (c.no2_serie) {
      var s = c.no2_serie, min = 15, max = 75, largh = 150, x1 = CX - largh / 2;
      var d = '';
      for (var n = 0; n < s.length; n++) {
        var x = x1 + (n / (s.length - 1)) * largh;
        var y = yS - ((s[n] - min) / (max - min)) * 30;
        d += (n === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      svg.appendChild(el('path', {
        d: d, stroke: c.colore, 'stroke-width': 1.6, fill: 'none',
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }));
      svg.appendChild(testo(x1 - 4, yS + 4, s[0], { dim: 8, ancora: 'end', colore: '#8d8271' }));
      svg.appendChild(testo(x1 + largh + 4, yS - 26, s[s.length - 1],
        { dim: 8.5, colore: c.colore, peso: '700' }));
      svg.appendChild(testo(CX, yS + 16, 'NO₂ 2013 → 2025',
        { dim: 7.5, ancora: 'middle', colore: '#8d8271' }));
    } else {
      svg.appendChild(linea(CX - 70, yS - 14, CX + 70, yS - 14, rnd,
        { colore: '#b3a99a', spessore: 1, tratteggio: '3,4' }));
      svg.appendChild(testo(CX, yS + 4, 'NO₂: Milano non è nella serie',
        { dim: 8.5, ancora: 'middle', colore: '#8d8271', mano: true }));
    }

    return svg;
  }

  /* ---------- la legenda: la grammatica spiegata ---------- */

  function legenda() {
    var rnd = seme('legenda');
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'glifo' });
    var c = '#6b6357';

    /* stesso impianto dei glifi veri, così il confronto è immediato */
    svg.appendChild(cerchio(CX, CY, R, rnd, { colore: c, spessore: 1.4 }));

    for (var i = 0; i < 9; i++) {
      var t = i / 9, ang = i * 2.399963, rr = Math.sqrt(t) * 32;
      svg.appendChild(el('circle', {
        cx: CX + Math.cos(ang) * rr, cy: CY + Math.sin(ang) * rr,
        r: 2.5, fill: c, opacity: 0.6
      }));
    }

    for (var k = 0; k < 3; k++) {
      var a = Math.PI / 2 + (k / 8) * Math.PI * 2;
      svg.appendChild(linea(CX + Math.cos(a) * (R + 4), CY + Math.sin(a) * (R + 4),
        CX + Math.cos(a) * RAGGIO_MAX, CY + Math.sin(a) * RAGGIO_MAX,
        rnd, { colore: c, spessore: 2 }));
    }

    svg.appendChild(arco(CX, CY, R, -Math.PI / 2, -Math.PI / 2 + 1.4, rnd,
      { colore: INCHIOSTRO, spessore: 7, opacita: 0.8 }));
    svg.appendChild(testo(CX, Y_ETICHETTA, '% in auto', { dim: 10, ancora: 'middle', peso: '700' }));

    for (var j = 0; j < 4; j++) {
      svg.appendChild(linea(CX - 11 + j * 7, Y_TACCHE - 9, CX - 11 + j * 7, Y_TACCHE + 9,
        rnd, { colore: '#c0392b', spessore: 1.8 }));
    }

    /* la voce di legenda, riga per riga */
    var voci = [
      ['1 puntino = 1 µg/m³ di PM2.5', c],
      ['1 raggio = 10 km di piste / 100.000 ab.', c],
      ['arco scuro = quota di spostamenti in auto', c],
      ['1 tacca = 50 morti stimate da caldo', '#c0392b'],
      ['tratteggio = dato non disponibile', '#8d8271']
    ];
    voci.forEach(function (v, n) {
      svg.appendChild(testo(CX, Y_TACCHE + 24 + n * 14, v[0],
        { dim: 8.8, ancora: 'middle', colore: v[1], mano: true }));
    });

    return svg;
  }

  /* ---------- la carta d'Europa ----------
     Stessa grammatica dei glifi, in scala ridotta: il cerchio è la
     città, i puntini dentro sono il PM2.5, l'arco scuro la quota
     d'auto. Nessuna codifica nuova, altrimenti la legenda mentirebbe. */

  function mappaEuropa() {
    var M = window.CITTA_VIVE_MAPPA;
    if (!M) return null;

    var svg = el('svg', { viewBox: '0 0 ' + M.w + ' ' + M.h, class: 'carta-europa' });

    svg.appendChild(el('path', { d: M.sfondo, fill: '#e7e0d1', stroke: '#d5cab6',
                                 'stroke-width': 0.8, 'fill-rule': 'evenodd' }));
    svg.appendChild(el('path', { d: M.primo, fill: '#ddd4c1', stroke: '#c3b69d',
                                 'stroke-width': 1, 'fill-rule': 'evenodd' }));

    /* etichette spostate a mano dove il glifo coprirebbe il nome */
    var scostamento = {
      paris:  [-34, -40], london: [-30, -40], berlin: [26, -34],
      milan:  [30, -30],  barcelona: [30, -26], madrid: [-34, 26]
    };

    D.citta.forEach(function (c) {
      var p = M.punti[c.id];
      if (!p) return;
      var rnd = seme('mappa-' + c.id);
      var cx = p[0], cy = p[1], r = 25;

      var g = el('g', {});
      g.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: 'var(--carta-2)', opacity: .92 }));
      g.appendChild(cerchio(cx, cy, r, rnd, { colore: c.colore, spessore: 1.5 }));

      if (c.pm25 != null) {
        for (var i = 0; i < c.pm25; i++) {
          var t = i / c.pm25, ang = i * 2.399963, rr = Math.sqrt(t) * (r - 6);
          g.appendChild(el('circle', {
            cx: (cx + Math.cos(ang) * rr).toFixed(1),
            cy: (cy + Math.sin(ang) * rr).toFixed(1),
            r: 1.5, fill: c.colore, opacity: .8
          }));
        }
      }
      if (c.auto_pct != null) {
        var est = (c.auto_pct / 100) * Math.PI * 2;
        g.appendChild(arco(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + est, rnd,
          { colore: INCHIOSTRO, spessore: 4.5, opacita: .85 }));
      }

      var s = scostamento[c.id] || [30, -28];
      var ancora = s[0] < 0 ? 'end' : 'start';
      g.appendChild(testo(cx + s[0], cy + s[1], c.nome,
        { dim: 15, ancora: ancora, colore: c.colore, peso: '700' }));
      g.appendChild(testo(cx + s[0], cy + s[1] + 14,
        'PM2.5 ' + c.pm25 + ' · auto ' + c.auto_pct + '%',
        { dim: 10.5, ancora: ancora, colore: '#6b6357' }));

      svg.appendChild(g);
    });

    return svg;
  }

  /* ---------- matrice di quadratini: lo spazio dell'auto ---------- */

  function matriceAuto(c) {
    var svg = el('svg', { viewBox: '0 0 210 46', class: 'matrice' });
    var lato = 3.4, gap = 2.2, perRiga = 25;
    for (var i = 0; i < 100; i++) {
      var r = Math.floor(i / perRiga), col = i % perRiga;
      var pieno = i < c.auto_pct;
      svg.appendChild(el('rect', {
        x: col * (lato + gap), y: r * (lato + gap),
        width: lato, height: lato,
        fill: pieno ? c.colore : 'none',
        stroke: pieno ? 'none' : '#c9c0b1',
        'stroke-width': 0.6
      }));
    }
    return svg;
  }

  /* ---------- montaggio ---------- */

  var grigliaCitta = document.getElementById('griglia-citta');
  var grigliaAuto = document.getElementById('griglia-auto');

  /* la carta apre l'atlante */
  var contenitoreMappa = document.getElementById('carta-europa');
  if (contenitoreMappa) {
    var carta = mappaEuropa();
    if (carta) contenitoreMappa.appendChild(carta);
    else contenitoreMappa.textContent = 'Geometria della mappa non caricata (data/mappa-europa.js).';
  }

  /* la legenda apre la griglia, come una scheda fra le altre */
  var cardL = document.createElement('div');
  cardL.className = 'card card-legenda';
  cardL.innerHTML = '<p class="card-occhiello">Come si legge</p>' +
                    '<h3 class="card-nome">La grammatica</h3>' +
                    '<p class="card-titolo">Ogni segno vale una quantità precisa e contabile.</p>';
  cardL.appendChild(legenda());
  grigliaCitta.appendChild(cardL);

  D.citta.forEach(function (c) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--c', c.colore);
    card.innerHTML =
      '<p class="card-occhiello">' + c.paese + ' &nbsp;' + c.titolo + '</p>' +
      '<h3 class="card-nome" style="color:' + c.colore + '">' + c.nome + '</h3>';
    card.appendChild(glifo(c));
    var p = document.createElement('p');
    p.className = 'card-chiave';
    p.textContent = c.chiave;
    card.appendChild(p);
    var v = document.createElement('p');
    v.className = 'card-verde';
    v.textContent = '🌿 ' + c.verde;
    card.appendChild(v);
    grigliaCitta.appendChild(card);
  });

  /* la matrice dell'auto, ordinata dal meno al più */
  D.citta.slice().sort(function (a, b) { return a.auto_pct - b.auto_pct; })
    .forEach(function (c) {
      var riga = document.createElement('div');
      riga.className = 'riga-auto';
      riga.innerHTML = '<span class="riga-nome" style="color:' + c.colore + '">' + c.nome + '</span>';
      riga.appendChild(matriceAuto(c));
      var v = document.createElement('span');
      v.className = 'riga-valore';
      v.textContent = c.auto_pct + '%';
      v.style.color = c.colore;
      riga.appendChild(v);
      grigliaAuto.appendChild(riga);
    });

  /* le lacune, dette per esteso */
  var ul = document.getElementById('lista-lacune');
  D.lacune.forEach(function (t) {
    var li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  console.log('[atlante] glifi disegnati: ' + D.citta.length);
})();
