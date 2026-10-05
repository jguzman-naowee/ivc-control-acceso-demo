/* Tabla única de la demo: encabezado con total, filas clicables y paginador. Lo usan Gestión, Búsqueda y Solicitudes. */
(function (w, d) {
  'use strict';
  var GI = w.GI;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  GI.TABLA_PAG = 25;

  /* Título de la tabla con la etiqueta del total (de todas las páginas). o = { id, titulo, total, fuera? }; fuera: el título va sobre la tarjeta, no dentro. */
  GI.tablaHead = function (o) {
    return '<header class="gt-head' + (o.fuera ? ' gt-head--fuera' : '') + '"><h2 class="gt-title" id="' + o.id + 'T">' + esc(o.titulo) + '</h2><span class="gt-count" id="' + o.id + 'N">' + o.total + '</span></header>';
  };
  GI.tablaTotal = function (id, n) { var el = d.getElementById(id + 'N'); if (el) el.textContent = n; };

  /* Paginador: «1–25 de 43» a la izquierda; Anterior, números (con puntos si son muchos) y Siguiente a la derecha.
     o = { total, page, size, onPage(p), label? }. Devuelve la página efectiva; sin filas se oculta. */
  GI.pager = function (nav, o) {
    var pages = Math.max(1, Math.ceil(o.total / o.size)), pg = Math.min(Math.max(1, o.page), pages);
    nav.className = 'gt-pag'; nav.setAttribute('aria-label', o.label || 'Paginación'); nav.hidden = !o.total;
    if (!o.total) { nav.innerHTML = ''; return pg; }
    var ini = (pg - 1) * o.size, fin = Math.min(ini + o.size, o.total), nums = [], i;
    for (i = 1; i <= pages; i++) { if (pages <= 7 || i === 1 || i === pages || Math.abs(i - pg) <= 1) nums.push(i); else if (nums[nums.length - 1] !== 0) nums.push(0); }
    nav.innerHTML = '<p class="gt-pag__n" aria-live="polite">' + (ini + 1) + '–' + fin + ' de ' + o.total + '</p>' + (pages > 1 ? '<div class="gt-pag__b">' +
      '<button type="button" class="gt-pg gt-pg--t" data-p="' + (pg - 1) + '"' + (pg === 1 ? ' disabled' : '') + '>Anterior</button>' +
      nums.map(function (k) { return k ? '<button type="button" class="gt-pg" data-p="' + k + '" aria-label="Página ' + k + '"' + (k === pg ? ' aria-current="page"' : '') + '>' + k + '</button>' : '<span class="gt-pg__gap" aria-hidden="true">…</span>'; }).join('') +
      '<button type="button" class="gt-pg gt-pg--t" data-p="' + (pg + 1) + '"' + (pg === pages ? ' disabled' : '') + '>Siguiente</button></div>' : '');
    if (!nav._gt) {
      nav._gt = true;
      nav.addEventListener('click', function (e) {
        var b = e.target.closest('[data-p]'); if (!b || b.disabled) return;
        nav._onPage(+b.getAttribute('data-p'));
        var k = nav.querySelector('[aria-current]'); if (k) k.focus({ preventScroll: true });
        /* Al cambiar de página se vuelve al inicio de la tabla si quedó por encima de lo visible. */
        var sc = d.querySelector('.main-scroll'), card = nav.closest('.gt-card');
        if (sc && card) { var dy = card.getBoundingClientRect().top - sc.getBoundingClientRect().top; if (dy < 0) sc.scrollTop += dy - 8; }
      });
    }
    nav._onPage = o.onPage;
    return pg;
  };

  /* Filas clicables: clic, Enter y Espacio abren la fila `tr[data-id]`; cada fila lleva tabindex="0". */
  GI.filasClicables = function (tbody, abrir) {
    tbody.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id], .gc-persona[data-id]'); if (tr && !e.target.closest('a, button')) abrir(tr.getAttribute('data-id'), tr); });
    tbody.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var tr = e.target.closest('tr[data-id], .gc-persona[data-id]'); if (!tr || e.target !== tr) return;
      e.preventDefault(); abrir(tr.getAttribute('data-id'), tr);
    });
  };
})(window, document);
