/* Selector desplegable único de la demo: botón + lista flotante absoluta al select, que se acomoda sola (no toca los bordes). */
(function (w, d) {
  'use strict';
  var GI = w.GI;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* o = { host, id, label, prefijo?, campo?, items: [{ v, n, t?, av?, tag? }], value?, onPick(v) }
     prefijo: texto visible antes del valor (ej. «Registro»). campo: el select ocupa todo el ancho (formularios y modales).
     av/tag = HTML propio ('' = nada). Teclado: flechas, Inicio/Fin, Enter, Esc. */
  GI.selectGrafico = function (o) {
    var host = o.host, bid = o.id || 'gsSel', items = o.items;
    var cur = Math.max(0, items.map(function (x) { return x.v; }).indexOf(o.value || '')), act = cur, abierto = false;
    var TODOS = '<span class="gi-av gi-av--all" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/></svg></span>';
    function cara(x) { return (x.av !== undefined ? x.av : x.v ? GI.origenAvatar(x.n) : TODOS) + '<span class="gs-opt__t"><strong>' + esc(x.n) + '</strong>' + (x.tag !== undefined ? x.tag : x.t ? GI.origenTag(x.t) : '') + '</span>'; }
    host.classList.add('gs-pick'); if (o.campo) host.classList.add('gs-pick--campo');
    host.innerHTML = '<button type="button" class="gs-pick__btn" id="' + bid + '" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + bid + 'Lb"></button>' +
      '<ul class="gs-pick__list" id="' + bid + 'Lb" role="listbox" tabindex="-1" aria-label="' + esc(o.label) + '" hidden>' + items.map(function (x, i) { return '<li role="option" id="' + bid + 'Opt' + i + '" data-i="' + i + '">' + cara(x) + '</li>'; }).join('') + '</ul>';
    var btn = host.querySelector('button'), lb = host.querySelector('ul'), ops = lb.querySelectorAll('[role=option]');

    /* Acomoda la lista respecto al select: abajo si cabe, arriba si no; alineada a la izquierda o a la derecha según el espacio. */
    function ubica() {
      var M = 12, G = 6;
      lb.style.cssText = '';
      var r = btn.getBoundingClientRect(), vw = d.documentElement.clientWidth, vh = w.innerHeight;
      lb.style.minWidth = Math.max(r.width, 240) + 'px';
      var ancho = Math.min(Math.max(lb.offsetWidth, r.width), vw - 2 * M);
      var abajo = vh - r.bottom - M - G, arriba = r.top - M - G, alto = Math.min(lb.offsetHeight, 340);
      var sube = alto > abajo && arriba > abajo, maxH = Math.max(120, Math.min(340, sube ? arriba : abajo));
      var izq = r.left; if (izq + ancho > vw - M) izq = r.right - ancho >= M ? r.right - ancho : Math.max(M, vw - M - ancho);
      var alt = Math.min(alto, maxH);
      /* Siempre fija a la ventana: ni el cuerpo de un modal ni el scroll de la página recortan la lista. */
      lb.style.position = 'fixed'; lb.style.maxHeight = maxH + 'px'; lb.style.width = ancho + 'px'; lb.style.minWidth = '0';
      lb.style.left = izq + 'px'; lb.style.top = (sube ? r.top - G - alt : r.bottom + G) + 'px';
      lb.classList.toggle('is-up', sube);
    }
    function pinta() {
      btn.innerHTML = (o.prefijo ? '<span class="gs-pick__pre">' + esc(o.prefijo) + '</span>' : '') + '<span class="gs-pick__lbl">' + esc(o.label) + '</span>' + cara(items[cur]) + '<span class="gs-pick__car" aria-hidden="true"></span>';
      ops.forEach(function (op, i) { op.setAttribute('aria-selected', i === cur); op.classList.toggle('is-act', abierto && i === act); });
      if (abierto) { lb.setAttribute('aria-activedescendant', bid + 'Opt' + act); ops[act].scrollIntoView({ block: 'nearest' }); }
    }
    function reubica() { if (abierto) ubica(); }
    function abrir(v) {
      if (v) d.dispatchEvent(new CustomEvent('gs-abre', { detail: host }));
      abierto = v; lb.hidden = !v; btn.setAttribute('aria-expanded', v);
      if (v) { act = cur; ubica(); lb.focus(); w.addEventListener('resize', reubica); d.addEventListener('scroll', reubica, true); }
      else { w.removeEventListener('resize', reubica); d.removeEventListener('scroll', reubica, true); }
      pinta();
    }
    function elegir(i) { cur = i; abrir(false); btn.focus(); o.onPick(items[i].v); }
    btn.addEventListener('click', function () { abrir(!abierto); });
    d.addEventListener('gs-abre', function f(e) { if (!d.body.contains(host)) return d.removeEventListener('gs-abre', f); if (abierto && e.detail !== host) abrir(false); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(true); } });
    lb.addEventListener('click', function (e) { var op = e.target.closest('[role=option]'); if (op) elegir(+op.getAttribute('data-i')); });
    lb.addEventListener('keydown', function (e) {
      var k = e.key, n = items.length;
      if (k === 'ArrowDown') act = (act + 1) % n; else if (k === 'ArrowUp') act = (act + n - 1) % n; else if (k === 'Home') act = 0; else if (k === 'End') act = n - 1;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); return elegir(act); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); abrir(false); return btn.focus(); }
      else if (k === 'Tab') return abrir(false);
      else return;
      e.preventDefault(); pinta();
    });
    d.addEventListener('click', function f(e) { if (!d.body.contains(host)) return d.removeEventListener('click', f); if (abierto && e.target.isConnected && !host.contains(e.target)) abrir(false); });
    pinta();
    return { get: function () { return items[cur].v; } };
  };
})(window, document);
