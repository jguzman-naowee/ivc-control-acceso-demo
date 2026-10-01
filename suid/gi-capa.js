/* Franja de la consulta (DC-300): recorrido simulado por los sistemas mientras se consulta. Versión propia del IVC, a partir de la capa oculta del SVN. */
window.GICapa = (function (w, d) {
  'use strict';
  var LENTO = 1000; /* Slow motion: 1 s por paso; en Tiempo real cada paso dura su propio `ms` y la suma es la consulta de DC-299 */
  var vel = 'real';
  var PAUSA = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="3" x2="5" y2="13"/><line x1="11" y1="3" x2="11" y2="13"/></svg>';
  var PLAY = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.2v9.6c0 .5.5.8.9.5l7.2-4.8c.4-.3.4-.8 0-1L5.9 2.7c-.4-.3-.9 0-.9.5z"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function seg(ms) { return (ms / 1000).toFixed(2).replace('.', ',') + ' s'; }

  /* def: { pasos: [{ n, sigla, texto, baja, sube, ms, r: 'ok' | 'vacio' | 'falla' }] } */
  function crear(wrap) {
    wrap.innerHTML = '<p class="gk__sr" role="status" aria-live="polite"></p><section class="gk" hidden aria-label="Recorrido de la consulta"></section>';
    var sr = wrap.firstChild, panel = wrap.lastChild;
    var vivo = false, corriendo = true, raf = 0, ultimo = 0, avance = 0, idx = -1, pasos = [], corren = 0, el = {};

    function dur(k) { return vel === 'slow' ? LENTO : pasos[k].ms; }
    function total() { var t = 0; for (var k = 0; k < corren; k++) t += dur(k); return t; }
    function simAntes(i) { var t = 0; for (var k = 0; k < i; k++) t += pasos[k].ms; return t; }
    function donde(av) { var a = 0; for (var k = 0; k < corren; k++) { var x = dur(k); if (av < a + x) return { k: k, f: (av - a) / x }; a += x; } return null; }
    function anunciar(t) { sr.textContent = t; }

    function pintarPlay() {
      el.play.innerHTML = corriendo ? PAUSA : PLAY;
      el.play.setAttribute('aria-label', corriendo ? 'Pausar la consulta' : 'Reanudar la consulta');
      panel.classList.toggle('gk--pausa', !corriendo);
    }
    function pintar(i) {
      [].forEach.call(el.lis, function (li, k) {
        var p = pasos[k];
        li.className = 'gk__p ' + (k < i ? 'is-hecho' : k === i ? 'is-act' + (p.r === 'falla' ? ' is-falla' : '') : 'is-pend');
      });
      panel.style.setProperty('--paso', dur(i) + 'ms');
      anunciar('Paso ' + (i + 1) + ' de ' + corren + ': ' + pasos[i].n + '. ' + pasos[i].texto);
    }

    function cuadro(ahora) {
      if (!vivo) return;
      if (!panel.isConnected) { cancelar(); return; }
      if (corriendo) avance += Math.max(0, ahora - ultimo); /* el primer cuadro puede venir antes que performance.now() */
      ultimo = ahora;
      var p = donde(avance);
      if (!p) { terminar(); return; }
      if (p.k !== idx) { idx = p.k; pintar(idx); }
      el.reloj.textContent = seg(simAntes(idx) + p.f * pasos[idx].ms);
      raf = w.requestAnimationFrame(cuadro);
    }

    function limpiar() { vivo = false; if (raf) { w.cancelAnimationFrame(raf); raf = 0; } panel.hidden = true; panel.innerHTML = ''; anunciar(''); }
    var alFinal = null;
    function terminar() { var f = alFinal; limpiar(); if (f) f(); }
    function cancelar() { alFinal = null; limpiar(); }

    function correr(def, alFin) {
      cancelar();
      pasos = def.pasos; alFinal = alFin; corriendo = true; avance = 0; idx = -1;
      var corte = pasos.length - 1;
      for (var k = 0; k < pasos.length; k++) { if (pasos[k].r === 'falla') { corte = k; break; } } /* una falla corta el recorrido */
      corren = corte + 1;
      panel.innerHTML = '<header class="gk__head"><h2 class="gk__t">Consultando en los sistemas…</h2><div class="gk__ctl"><span class="gk__reloj" aria-hidden="true">0,00 s</span>' +
        '<button type="button" class="gk__play"></button></div></header><ol class="gk__pasos">' + pasos.map(function (p) {
          var tag = p.r === 'falla' ? ['negative', 'Error'] : p.r === 'ok' ? ['positive', 'Con resultado'] : ['neutral', 'Sin resultado'];
          return '<li class="gk__p is-pend"><span class="gk__rail" aria-hidden="true"><i class="gk__punto"></i><i class="gk__linea"></i></span>' +
            '<span class="gk__id"><span class="gk__logo" aria-hidden="true">' + esc(p.sigla) + '</span><strong class="gk__n">' + esc(p.n) + '</strong></span>' +
            '<span class="gk__x">' + esc(p.texto) + '</span>' +
            '<span class="gk__dato" aria-hidden="true"><span class="gk__b">' + esc(p.baja) + '</span><span class="gk__s gk__s--' + p.r + '">' + esc(p.sube) + '</span></span>' +
            '<span class="gk__tag"><span class="naowee-badge naowee-badge--' + tag[0] + ' naowee-badge--quiet">' + tag[1] + '</span></span></li>';
        }).join('') + '</ol>';
      el.reloj = panel.querySelector('.gk__reloj'); el.play = panel.querySelector('.gk__play'); el.lis = panel.querySelectorAll('.gk__p');
      el.play.addEventListener('click', function () {
        if (!vivo) return;
        corriendo = !corriendo; pintarPlay(); anunciar(corriendo ? 'Consulta reanudada.' : 'Consulta en pausa.');
      });
      pintarPlay(); panel.hidden = false; vivo = true; ultimo = w.performance.now();
      raf = w.requestAnimationFrame(cuadro);
    }

    /* Cambiar la velocidad en pleno recorrido conserva el avance proporcional. */
    function setVel(v) {
      if (v === vel) return;
      var antes = vivo ? total() : 0;
      vel = v;
      if (vivo && antes) { avance = avance * total() / antes; if (idx >= 0) panel.style.setProperty('--paso', dur(idx) + 'ms'); }
    }
    return { correr: correr, cancelar: cancelar, setVel: setVel, vel: function () { return vel; }, activa: function () { return vivo; } };
  }

  return { crear: crear, vel: function () { return vel; } };
})(window, document);
