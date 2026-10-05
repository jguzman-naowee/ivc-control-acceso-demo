/* Panel derecho único de la demo: ficha rápida sin scrim (solo un velo difuso, sin bloquear clics). Lo usan Gestión y Solicitudes. */
(function (w, d) {
  'use strict';
  var GI = w.GI;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qs(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  var X = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var root = null, velo = null, st = null; /* st = { id, o, origen } mientras está abierto */
  var HTML = { tag: '.gpn__tag', chip: '.gpn__chip', resumen: '.gpn__res', cuerpo: '.gpn__cuerpo', acciones: '.gpn__acc' };
  var TEXTO = { meta: '.gpn__meta', titulo: '#gpnT', sub: '.gpn__sub', nota: '.gpn__nota' };

  function crear() {
    root = d.createElement('aside');
    root.id = 'gpn'; root.className = 'gpn'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'false'); root.setAttribute('aria-labelledby', 'gpnT');
    root.innerHTML = '<header class="gpn__cab"><div class="gpn__top">' +
      '<button type="button" class="gpn__x" data-gpn-x aria-label="Cerrar el panel">' + X + '</button></div>' +
      '<div class="gpn__acc"></div><p class="gpn__nota"></p>' +
      '<div class="gpn__est"><span class="gpn__tag"></span><span class="gpn__meta"></span></div>' +
      '<div class="gpn__ttl"><h2 id="gpnT" tabindex="-1"></h2><span class="gpn__chip"></span></div><p class="gpn__sub"></p><div class="gpn__res"></div></header>' +
      '<div class="gpn__cuerpo"></div>';
    velo = d.createElement('div'); velo.className = 'gpn-velo'; velo.setAttribute('aria-hidden', 'true');
    (d.getElementById('overlays') || d.body).appendChild(velo);
    (d.getElementById('overlays') || d.body).appendChild(root);
    root.addEventListener('click', function (e) { if (e.target.closest('[data-gpn-x]')) cerrar('x'); });
  }

  /* Pinta solo los campos recibidos y oculta las zonas que quedan vacías. */
  function pintar(o) {
    Object.keys(HTML).forEach(function (k) { if (o[k] !== undefined) root.querySelector(HTML[k]).innerHTML = o[k] || ''; });
    Object.keys(TEXTO).forEach(function (k) { if (o[k] !== undefined) root.querySelector(TEXTO[k]).textContent = o[k] || ''; });
    ['gpn__chip', 'gpn__tag', 'gpn__meta', 'gpn__sub', 'gpn__res', 'gpn__nota'].forEach(function (c) { var n = root.querySelector('.' + c); n.hidden = !n.textContent.trim() && !n.children.length; });
    if (st && typeof st.o.onPintar === 'function') st.o.onPintar(root);
  }

  /* Clave estable del elemento con foco, para devolvérselo tras repintar el HTML. */
  function claveFoco() {
    var a = d.activeElement; if (!a || !root.contains(a) || a === root) return null;
    return a.id ? '#' + a.id : a.getAttribute('data-k') ? '[data-k="' + qs(a.getAttribute('data-k')) + '"]' : '';
  }
  /* El velo arranca donde empieza el contenido: ni el menú lateral ni su estado colapsado lo cubren. */
  function ajustaVelo() { var v = d.getElementById('view'); if (velo && v) velo.style.left = Math.max(0, v.getBoundingClientRect().left) + 'px'; }
  function titulo() { return root.querySelector('#gpnT'); }

  function abrir(o) {
    if (!root) crear();
    var yaAbierto = !!st, mismo = yaAbierto && st.id === String(o.id);
    if (mismo) return actualizar(o);
    st = { id: String(o.id), o: o, origen: o.origen || (st && st.origen) || null };
    /* Todo se reemplaza: lo que no se pasa se vacía para no dejar restos del registro anterior. */
    pintar({ tag: o.tag || '', meta: o.meta || '', titulo: o.titulo || '', chip: o.chip || '', sub: o.sub || '', resumen: o.resumen || '', cuerpo: o.cuerpo || '', acciones: o.acciones || '', nota: o.nota || '' });
    root.querySelector('.gpn__cuerpo').scrollTop = 0;
    d.body.classList.add('has-gpn');
    void root.offsetWidth; /* sin este reflujo no hay deslizamiento al entrar */
    ajustaVelo(); root.setAttribute('data-open', ''); velo.setAttribute('data-open', '');
    titulo().focus({ preventScroll: true });
    sincronizar();
    return root;
  }

  function actualizar(p) {
    if (!st) return null;
    p = p || {};
    if (p.onPintar !== undefined) st.o.onPintar = p.onPintar;
    if (p.onCerrar !== undefined) st.o.onCerrar = p.onCerrar;
    if (p.origen) st.origen = p.origen;
    var cuerpo = root.querySelector('.gpn__cuerpo'), y = cuerpo.scrollTop, a = d.activeElement, clave = claveFoco();
    pintar(p);
    cuerpo.scrollTop = y;
    if (clave !== null && !(a && a !== root && root.contains(a))) {
      var el = clave ? root.querySelector(clave) : null;
      (el || titulo()).focus({ preventScroll: true });
    }
    return root;
  }

  /* Devuelve el foco solo si el usuario cerró (X o Esc): al cambiar de ruta o filtrar no hay a quién devolvérselo. */
  function cerrar(motivo) {
    if (!st) return;
    var s = st, m = motivo || 'api';
    st = null;
    root.removeAttribute('data-open'); velo.removeAttribute('data-open');
    d.body.classList.remove('has-gpn');
    sincronizar();
    if (m === 'x' || m === 'esc') {
      var v = d.getElementById('view'), tr = v && v.querySelector('tr[data-id="' + qs(s.id) + '"]');
      var o = s.origen && s.origen.isConnected ? s.origen : null;
      var a = o && (!tr || tr === o || tr.contains(o)) ? o : tr || o; /* el botón de la fila si fue él quien abrió */
      if (a) a.focus();
    }
    if (typeof s.o.onCerrar === 'function') s.o.onCerrar(m);
  }

  /* Marca en la tabla la fila del registro abierto; se llama tras cada pintura de la tabla. */
  function sincronizar() {
    var v = d.getElementById('view'); if (!v) return;
    v.querySelectorAll('tr.is-selected, .gc-persona.is-selected').forEach(function (t) { t.classList.remove('is-selected'); t.removeAttribute('aria-current'); });
    if (!st) return;
    var tr = v.querySelector('tr[data-id="' + qs(st.id) + '"], .gc-persona[data-id="' + qs(st.id) + '"]');
    if (tr) { tr.classList.add('is-selected'); tr.setAttribute('aria-current', 'true'); }
  }

  /* Esc cierra solo si nada más lo reclama: modal, tooltip abierto o selector desplegado. */
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !st || e.defaultPrevented) return;
    if (d.querySelector('#overlays .naowee-modal-overlay.open, .gt-tip:not([hidden]), #view [aria-expanded="true"], #gpn [aria-expanded="true"]')) return;
    cerrar('esc');
  });
  w.addEventListener('hashchange', function () { cerrar('ruta'); });
  w.addEventListener('resize', function () { if (st) ajustaVelo(); });

  /* Piezas de contenido para vistas que aún no usan GI.expediente: el valor de las filas es HTML ya escapado. */
  function sec(t, h) { return '<section class="gpn-sec"><h3 class="gpn-sec__h">' + esc(t) + '</h3>' + h + '</section>'; }
  function kv(filas) {
    return '<dl class="gpn-kv">' + filas.map(function (f) { return '<div' + (f[2] ? ' class="gpn-kv__w"' : '') + '><dt>' + esc(f[0]) + '</dt><dd>' + (f[1] === '' || f[1] == null ? '—' : f[1]) + '</dd></div>'; }).join('') + '</dl>';
  }

  GI.panel = {
    abrir: abrir, actualizar: actualizar, cerrar: cerrar, sincronizar: sincronizar,
    id: function () { return st ? st.id : ''; }, el: function () { return root; }, abierto: function () { return !!st; },
    sec: sec, kv: kv
  };
})(window, document);
