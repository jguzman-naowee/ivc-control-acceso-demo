/* Gestión de infractores · HU-26.3. Vistas: bandeja, registro, ficha y carga masiva. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, esc = SUID.esc, C = GI.cat;
  var BASE = '#/control-acceso/infractores';

  var PAISES = ['Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Brasil', 'Argentina', 'Estados Unidos', 'España', 'Otro'];
  var INDICATIVO = { Colombia: '+57', Venezuela: '+58', Ecuador: '+593', 'Perú': '+51', Brasil: '+55', Argentina: '+54', 'Estados Unidos': '+1', 'España': '+34', Otro: '+' };
  /* Listado parcial para el demo; el real carga el oficial de departamentos y municipios. */
  var GEO = {
    'Antioquia': ['Medellín', 'Envigado', 'Itagüí', 'Bello'], 'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
    'Bogotá D.C.': ['Bogotá D.C.'], 'Bolívar': ['Cartagena de Indias', 'Magangué'], 'Caldas': ['Manizales', 'Chinchiná'],
    'Cesar': ['Valledupar', 'Aguachica'], 'Cundinamarca': ['Soacha', 'Chía', 'Zipaquirá'], 'Norte de Santander': ['Cúcuta', 'Ocaña'],
    'Risaralda': ['Pereira', 'Dosquebradas'], 'Santander': ['Bucaramanga', 'Floridablanca', 'Girón'],
    'Tolima': ['Ibagué', 'Espinal'], 'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá']
  };
  var ESTADOS_REG = ['Recibido', 'Validado', 'Por Subsanar'];
  var PROFESIONALES = ['Marcela Ortiz', 'Hernán Salcedo', 'Paola Rincón'];

  /* ───────── utilidades de UI ───────── */
  function badgeReg(e) {
    var v = { Recibido: 'informative', Validado: 'positive', 'Por Subsanar': 'caution' }[e] || 'neutral';
    return '<span class="naowee-badge naowee-badge--' + v + ' naowee-badge--quiet">' + esc(e) + '</span>';
  }
  function badgeRes(e) {
    var v = { Activa: 'negative', Inactiva: 'neutral', Cumplida: 'positive' }[e] || 'neutral';
    return '<span class="naowee-badge naowee-badge--' + v + ' naowee-badge--quiet">' + esc(e) + '</span>';
  }
  function nowTs() { var n = U.now(); return U.fmt(n.fecha) + ' ' + n.hora; }
  function toast(msg, kind) {
    var t = d.createElement('div');
    t.className = 'gi-toast gi-toast--' + (kind || 'ok');
    t.textContent = msg;
    var box = d.querySelector('.gi-toasts') || d.body.appendChild(Object.assign(d.createElement('div'), { className: 'gi-toasts' }));
    box.appendChild(t);
    setTimeout(function () { t.classList.add('is-in'); }, 10);
    setTimeout(function () { t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 300); }, 3600);
  }
  function modal(o) {
    var ov = d.createElement('div');
    ov.className = 'naowee-modal-overlay open';
    ov.innerHTML = '<div class="naowee-modal" style="max-width:' + (o.width || 480) + 'px"><div class="naowee-modal__header"><div class="naowee-modal__title-group">' +
      '<h2 class="naowee-modal__title">' + esc(o.title) + '</h2>' + (o.sub ? '<p class="naowee-modal__subtitle">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<button type="button" class="naowee-modal__dismiss" data-x aria-label="Cerrar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
      '<div class="naowee-modal__body">' + o.body + '</div>' +
      '<div class="naowee-modal__footer naowee-modal__footer--end">' + (o.footer || '') + '</div></div>';
    d.getElementById('overlays').appendChild(ov);
    function close() { ov.remove(); }
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-x]')) close(); });
    return { el: ov, close: close };
  }

  /* ───────── bandeja ───────── */
  var filt = { q: '', reg: '', res: '' };
  var chartN = null; /* 6 o 12 meses; null = según el ancho de la pantalla */
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var CONDUCTA = ['Armas u objetos peligrosos', 'Estupefacientes', 'Violencia contra la fuerza pública', 'Invasión del terreno de juego', 'Desacato a la logística', 'Alcohol en el estadio', 'Agresión física', 'Agresión verbal', 'Daño a infraestructura', 'Derecho de admisión'];

  /* ───────── panorama: insights calculados + gráfica mes a mes ───────── */
  function n1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : p); }
  function signo(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n); }

  /* Tendencia con glifo y palabra, para que el color nunca sea el único aviso (DC-297). */
  function tend(x, u) { return x > u ? ['▲', 'Al alza'] : x < -u ? ['▼', 'A la baja'] : ['▬', 'Estable']; }

  function insightsHtml() {
    var I = GI.stats.insights(), L = [], c = I.conducta;
    L.push({ tono: I.por30 ? 'caution' : 'positive', tag: I.por30 ? ['!', 'Por vencer'] : ['✓', 'Sin salidas'], cifra: I.por30, sub: ' de ' + I.vigentes, t: 'Vencen en los próximos 30 días', corta: 'Vencen en 30 días',
      ctx: I.por30 ? pct(I.por30, I.vigentes) + '% de las vigentes. La más próxima termina el ' + U.fmt(I.proximaFin) + ': ' + GI.fmtDias(I.proximaDias).toLowerCase() + '.' : 'Ninguna medida vigente termina este mes.',
      lec: I.por30 ? 'Pasan solas a Cumplida al día siguiente; revisa antes si hay un reporte abierto.' : 'No hay salidas próximas que preparar.' });
    L.push({ tono: I.sinValidar ? 'negative' : 'positive', tag: I.sinValidar ? ['!', 'Sin bloquear'] : ['✓', 'Al día'], cifra: I.sinValidar, sub: ' sin validar', t: 'Sanción que corre sin bloquear', corta: 'Corren sin bloquear',
      ctx: 'Llevan en promedio ' + plural(Math.round(I.sinDiasProm || 0), 'día', 'días') + ' de vigencia consumidos; el mayor, ' + plural(I.sinMax ? I.sinMax.dias : 0, 'día', 'días') + ' (' + (I.sinMax ? I.sinMax.id : '—') + ').',
      lec: 'La vigencia cuenta desde la ejecutoria: mientras no se valida, la persona todavía puede entrar.' });
    var dr = I.revPrevio == null || I.revActual == null ? null : I.revActual - I.revPrevio;
    L.push({ tono: dr == null ? 'informative' : dr > 0.2 ? 'caution' : dr < -0.2 ? 'positive' : 'informative', tag: dr == null ? ['i', 'Sin dato'] : tend(dr, 0.2), cifra: I.revActual == null ? '—' : n1(I.revActual), sub: ' días', t: 'Tiempo medio de revisión', corta: 'Revisión media',
      ctx: 'De recibido a decisión en 90 días' + (I.revPrevio != null ? ' (antes ' + n1(I.revPrevio) + ')' : '') + '. El pendiente más viejo lleva ' + plural(I.pendienteViejo || 0, 'día', 'días') + '.',
      lec: dr == null ? 'Aún no hay comparación.' : dr > 0.2 ? 'Se demora más que antes: atiende primero el pendiente más viejo.' : dr < -0.2 ? 'Se revisa más rápido que antes.' : 'Se mantiene estable.' });
    var dn = I.dev.n - I.devPrev.n;
    L.push({ tono: dn > 0 ? 'negative' : dn < 0 ? 'positive' : 'informative', tag: tend(dn, 0), cifra: I.dev.n, sub: ' devueltos', t: 'Devueltos a la inspección de policía', corta: 'Devueltos a policía',
      ctx: 'En 90 días, contra ' + I.devPrev.n + ' antes: ' + pct(I.dev.n, I.dev.recibidos) + '% de lo recibido (' + I.dev.n + ' de ' + I.dev.recibidos + ').',
      lec: dn > 0 ? 'Suben las devoluciones: a los oficios les falta algo con frecuencia.' : dn < 0 ? 'Bajan las devoluciones: los oficios llegan más completos.' : 'Sin cambios frente al periodo anterior.' });
    var rp = pct(I.reincidentes, I.personas);
    L.push({ tono: rp <= 10 ? 'positive' : rp <= 25 ? 'caution' : 'negative', tag: rp <= 10 ? ['✓', 'Baja'] : rp <= 25 ? ['!', 'Moderada'] : ['▲', 'Alta'], cifra: rp + '%', sub: '', t: 'Reincidencia a 3 años', corta: 'Reincidencia a 3 años',
      ctx: I.reincidentes + ' de ' + I.personas + ' personas con medida en 36 meses tienen dos o más.',
      lec: I.reincidentes ? 'Una de cada ' + Math.round(I.personas / I.reincidentes) + ' repite; mira su historial antes de validar.' : 'Nadie repite en el periodo.' });
    if (c) {
      var ant = pct(c.prevN, c.prevTotal), act = pct(c.n, c.total), dc = act - ant;
      L.push({ tono: dc > 0 ? 'caution' : dc < 0 ? 'positive' : 'informative', tag: tend(dc, 0), cifra: act + '%', sub: '', t: 'Conducta más frecuente', corta: 'Conducta frecuente',
        ctx: CONDUCTA[c.idx] + ': ' + c.n + ' de ' + plural(c.total, 'registro', 'registros') + ' en 90 días (antes ' + ant + '%).',
        lec: dc > 0 ? 'Sube ' + dc + ' puntos: puede pedir una campaña con los clubes.' : dc < 0 ? 'Baja ' + Math.abs(dc) + ' puntos frente al periodo anterior.' : 'Se mantiene igual que antes.' });
    }
    /* Dato + descripción corta a la vista; la explicación larga va en el tooltip del ⓘ (DC-259). */
    return '<article class="gi-panel gi-panel--ins" aria-labelledby="giInsT"><header class="gi-panel__head"><h2 class="gi-panel__title" id="giInsT">Insights</h2>' +
      '<p class="gi-panel__sub">Calculados con los registros de hoy.</p></header><ul class="gi-insights">' +
      L.map(function (x, i) {
        return '<li class="gi-insight gi-insight--' + x.tono + '"><div class="gi-insight__fig"><strong>' + x.cifra + '</strong><span>' + esc(x.sub) + '</span></div>' +
          '<span class="gi-insight__tag"><i aria-hidden="true">' + x.tag[0] + '</i>' + esc(x.tag[1]) + '</span>' +
          '<h3 class="gi-insight__t">' + esc(x.corta) + '</h3>' +
          '<button type="button" class="gt-info" aria-label="Qué significa: ' + esc(x.t) + '" aria-describedby="gtIns' + i + '" aria-expanded="false">' + INFO_ICO + '</button>' +
          '<div class="gt-tip" role="tooltip" id="gtIns' + i + '" hidden><strong>' + esc(x.t) + '</strong><p>' + esc(x.ctx) + '</p><p>' + esc(x.lec) + '</p></div></li>';
      }).join('') + '</ul></article>';
  }

  var INFO_ICO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg>';

  /* Tooltip de los ⓘ: fixed para no recortarse con el scroll interno; hover/foco lo muestran, el clic lo fija. */
  var tipOn = null;
  function tipHide() { if (!tipOn) return; tipOn.t.hidden = true; tipOn.b.setAttribute('aria-expanded', 'false'); tipOn.b.removeAttribute('data-pin'); tipOn = null; }
  function tipShow(b) {
    if (tipOn && tipOn.b !== b) tipHide();
    var t = d.getElementById(b.getAttribute('aria-describedby')); if (!t) return;
    t.hidden = false; b.setAttribute('aria-expanded', 'true'); tipOn = { b: b, t: t };
    var r = b.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight;
    var left = Math.max(8, Math.min(r.right - tw, w.innerWidth - tw - 8)), top = r.bottom + 4;
    if (top + th > w.innerHeight - 8) top = Math.max(8, r.top - th - 4);
    t.style.left = left + 'px'; t.style.top = top + 'px';
  }
  function initTips(root) {
    root.querySelectorAll('.gt-info').forEach(function (b) {
      b.addEventListener('mouseenter', function () { tipShow(b); });
      b.addEventListener('mouseleave', function () { if (!b.hasAttribute('data-pin')) tipHide(); });
      b.addEventListener('focus', function () { tipShow(b); });
      b.addEventListener('blur', function () { if (!b.hasAttribute('data-pin')) tipHide(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (b.hasAttribute('data-pin')) { tipHide(); return; }
        tipShow(b); b.setAttribute('data-pin', '1');
      });
    });
    root.querySelectorAll('.gi-insights').forEach(function (u) { u.addEventListener('scroll', tipHide); });
  }
  if (!w.__gtTips) {
    w.__gtTips = true;
    d.addEventListener('click', function () { tipHide(); });
    w.addEventListener('resize', function () { tipHide(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tipOn) { var b = tipOn.b; tipHide(); b.focus(); } });
  }

  /* Gráfica de líneas en SVG inline (DC-260): se dibuja con el ancho real del contenedor para que el texto no se escale. */
  var MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var NS = 'http://www.w3.org/2000/svg';
  var chartS = null, chartRO = null;
  function mk(sh, cx, cy, r, cls) {
    cx = +cx; cy = +cy;
    return sh === 'c' ? '<circle class="' + cls + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'
      : '<polygon class="' + cls + '" points="' + cx + ',' + (cy - r - 1) + ' ' + (cx + r + 1) + ',' + cy + ' ' + cx + ',' + (cy + r + 1) + ' ' + (cx - r - 1) + ',' + cy + '"/>';
  }
  function legSw(sh, cls, dash) {
    return '<svg class="gt-legsw" width="34" height="14" viewBox="0 0 34 14" aria-hidden="true"><line class="' + cls + '" x1="1" y1="7" x2="33" y2="7"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>' + mk(sh, 17, 7, 4, 'gt-mk ' + cls) + '</svg>';
  }

  function netoHtml(neto, n, nu, sa) {
    return '<strong>' + signo(neto) + '</strong><span><span class="gt-n-l">Neto de ' + n + ' meses: entran ' + nu + ' y salen ' + sa + '.</span><span class="gt-n-c">Neto ' + n + ' m: entran ' + nu + ', salen ' + sa + '</span></span>';
  }
  /* silent: el neto se rellena después del repintado para que el lector lo anuncie al cambiar el periodo. */
  function chartHtml(silent) {
    var n = chartN || (w.innerWidth < 600 ? 6 : 12), S = GI.stats.serieMensual(n), nu = 0, sa = 0, mx = 0;
    S.forEach(function (m) { nu += m.nuevos; sa += m.salen; mx = Math.max(mx, m.nuevos, m.salen); });
    var neto = nu - sa, paso = mx <= 4 ? 1 : mx <= 8 ? 2 : 5, top = Math.ceil(mx / paso) * paso || paso;
    var resumen = 'Infractores mes a mes, de ' + MES[S[0].mes] + ' ' + S[0].anio + ' a ' + MES[S[n - 1].mes] + ' ' + S[n - 1].anio + ' (' + n + ' meses): ' + nu + ' nuevos con medida vigente y ' + sa + ' salidas por cumplimiento; neto ' + signo(neto) + '.';
    chartS = { neto: neto, nu: nu, sa: sa, n: n, S: S, top: top, paso: paso, resumen: resumen };
    return '<figure class="gi-panel gi-chart gt-chart"><header class="gi-panel__head gi-chart__head"><div><h2 class="gi-panel__title" id="giChT">Infractores mes a mes</h2>' +
      '<p class="gi-panel__sub">Entran con medida vigente y salen al cumplirla.</p></div>' +
      '<div class="gi-seg" role="group" aria-label="Periodo de la gráfica">' + [6, 12].map(function (k) { return '<button type="button" class="gi-seg__b" data-n="' + k + '" aria-pressed="' + (k === n) + '">' + k + ' meses</button>'; }).join('') + '</div></header>' +
      '<div class="gt-plotwrap" tabindex="0" role="group" aria-label="Gráfica de líneas por mes. Con las flechas izquierda y derecha ves el dato de cada mes."><div class="gt-plot"></div></div>' +
      /* Leyenda y neto comparten la franja inferior de la tarjeta (DC-281). */
      '<div class="gt-foot"><ul class="gi-legend gt-legend"><li>' + legSw('c', 'gt-s-in') + 'Nuevos</li><li>' + legSw('d', 'gt-s-out', 1) + 'Salen por cumplimiento</li></ul>' +
      '<div class="gi-chart__neto" role="status" aria-live="polite">' + (silent ? '' : netoHtml(neto, n, nu, sa)) + '</div></div>' +
      '<div class="sr-only"><table><caption>Infractores mes a mes: nuevos con medida vigente y salidas por cumplimiento</caption><thead><tr><th scope="col">Mes</th><th scope="col">Nuevos</th><th scope="col">Salen por cumplimiento</th><th scope="col">Neto</th></tr></thead><tbody>' +
      S.map(function (m) { return '<tr><th scope="row">' + MES[m.mes] + ' ' + m.anio + '</th><td>' + m.nuevos + '</td><td>' + m.salen + '</td><td>' + signo(m.nuevos - m.salen) + '</td></tr>'; }).join('') +
      '</tbody></table></div></figure>';
  }

  function drawChart(cc) {
    var plot = cc.querySelector('.gt-plot'), wrap = cc.querySelector('.gt-plotwrap'), C0 = chartS;
    if (!plot || !C0) return;
    var W = Math.floor(plot.clientWidth), H = w.innerWidth > 1180 ? 218 : 230;
    if (W < 120) return;
    var S = C0.S, n = C0.n, top = C0.top, pl = 34, pr = 14, pt = 14, pb = 30, iw = W - pl - pr, ih = H - pt - pb, step = iw / n;
    function X(i) { return pl + (i + .5) * step; }
    function Y(v) { return pt + ih - v / top * ih; }
    var g = '', y = '';
    for (var t = 0; t <= top; t += C0.paso) { g += '<line class="gt-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>'; y += '<text class="gt-ytxt" x="' + (pl - 8) + '" y="' + (Y(t) + 5) + '" text-anchor="end">' + t + '</text>'; }
    var xl = S.map(function (m, i) {
      return '<text class="gt-xtxt" x="' + X(i) + '" y="' + (H - pb + 20) + '" text-anchor="middle">' + MES[m.mes] + '</text>';
    }).join('');
    function pts(k) { return S.map(function (m, i) { return X(i).toFixed(1) + ',' + Y(m[k]).toFixed(1); }).join(' '); }
    var pin = S.map(function (m, i) { return mk('c', X(i).toFixed(1), Y(m.nuevos).toFixed(1), 4.5, 'gt-mk gt-s-in'); }).join('');
    var pout = S.map(function (m, i) { return mk('d', X(i).toFixed(1), Y(m.salen).toFixed(1), 4.5, 'gt-mk gt-s-out'); }).join('');
    var hit = S.map(function (m, i) { return '<rect class="gt-hit" x="' + (pl + i * step).toFixed(1) + '" y="0" width="' + step.toFixed(1) + '" height="' + (H - pb) + '" fill="transparent"/>'; }).join('');
    plot.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(C0.resumen) + '">' +
      g + y + xl + '<line class="gt-guide" y1="' + pt + '" y2="' + (H - pb) + '" hidden/>' +
      '<polyline class="gt-line gt-s-out" stroke-dasharray="7 5" fill="none" points="' + pts('salen') + '"/>' +
      '<polyline class="gt-line gt-s-in" fill="none" points="' + pts('nuevos') + '"/>' + pout + pin +
      '<g class="gt-ring" hidden><circle class="gt-ring-in" r="8"/><circle class="gt-ring-out" r="8"/></g>' + hit + '</svg>' +
      '<div class="gt-tipc" role="status" aria-live="polite" hidden></div>';
    var guide = plot.querySelector('.gt-guide'), ring = plot.querySelector('.gt-ring'), tip = plot.querySelector('.gt-tipc'), act = -1;
    function clear() { act = -1; guide.setAttribute('hidden', ''); ring.setAttribute('hidden', ''); tip.hidden = true; }
    function show(i) {
      i = Math.max(0, Math.min(n - 1, i)); act = i;
      var m = S[i], x = X(i);
      guide.removeAttribute('hidden'); guide.setAttribute('x1', x); guide.setAttribute('x2', x); ring.removeAttribute('hidden');
      var ri = ring.querySelector('.gt-ring-in'), ro = ring.querySelector('.gt-ring-out');
      ri.setAttribute('cx', x); ri.setAttribute('cy', Y(m.nuevos)); ro.setAttribute('cx', x); ro.setAttribute('cy', Y(m.salen));
      tip.innerHTML = '<strong>' + MES[m.mes] + ' ' + m.anio + '</strong><span class="gt-tipc__r">' + legSw('c', 'gt-s-in') + 'Nuevos: <b>' + m.nuevos + '</b></span>' +
        '<span class="gt-tipc__r">' + legSw('d', 'gt-s-out', 1) + 'Salen: <b>' + m.salen + '</b></span><span class="gt-tipc__n">Neto: <b>' + signo(m.nuevos - m.salen) + '</b></span>';
      tip.hidden = false;
      var tw = tip.offsetWidth, left = x + 14; if (left + tw > W) left = x - tw - 14;
      tip.style.left = Math.max(0, left) + 'px'; tip.style.top = (pt + 4) + 'px';
    }
    function idx(e) { var r = plot.getBoundingClientRect(); return Math.floor((e.clientX - r.left - pl) / step); }
    plot.addEventListener('pointermove', function (e) { var i = idx(e); if (i >= 0 && i < n) show(i); else clear(); });
    plot.addEventListener('pointerdown', function (e) { var i = idx(e); if (i >= 0 && i < n) show(i); });
    plot.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && d.activeElement !== wrap) clear(); });
    wrap.onfocus = function () { if (act < 0) show(n - 1); };
    wrap.onblur = clear;
    wrap.onkeydown = function (e) {
      var k = e.key;
      if (k === 'ArrowRight') show(act < 0 ? n - 1 : act + 1); else if (k === 'ArrowLeft') show(act < 0 ? n - 1 : act - 1);
      else if (k === 'Home') show(0); else if (k === 'End') show(n - 1); else if (k === 'Escape') clear(); else return;
      e.preventDefault();
    };
  }
  function initChart(cc) {
    drawChart(cc);
    if (chartRO) chartRO.disconnect();
    var plot = cc.querySelector('.gt-plot'), lw = plot ? plot.clientWidth : 0;
    if (plot && w.ResizeObserver) {
      chartRO = new ResizeObserver(function () { if (!d.body.contains(plot)) { chartRO.disconnect(); return; } if (Math.abs(plot.clientWidth - lw) > 1) { lw = plot.clientWidth; drawChart(cc); } });
      chartRO.observe(plot);
    }
  }

  /* Conducta: artículo en tag + descripción corta en una sola línea; el texto completo va en title (DC-254). */
  var CORTA = ['Ingreso o posesión de armas u objetos peligrosos', 'Ingreso o posesión de estupefacientes', 'Violencia contra la fuerza pública', 'Invasión del terreno de juego', 'No atender las recomendaciones de logística', 'Ingreso o consumo de bebidas alcohólicas', 'Agresión física', 'Agresión verbal', 'Daño a infraestructura', 'Derecho de admisión'];
  function conductaHtml(r) {
    var art = function (i) { return (/Art\. (\d+)/.exec(C.origen[i]) || [0, 'Admisión'])[0]; };
    var full = r.origen.map(function (i) { return C.origen[i].replace(/^(\d+\.|[a-d]\)) /, ''); }).join('\n');
    var i0 = r.origen[0], mas = r.origen.length - 1;
    return '<span class="gt-cond" title="' + esc(full) + '"><span class="naowee-badge naowee-badge--neutral naowee-badge--quiet gt-cond__tag">' + esc(art(i0)) + '</span>' +
      '<span class="gt-cond__txt">' + esc(CORTA[i0] || '') + '</span>' + (mas > 0 ? '<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet gt-cond__tag">+' + mas + '</span>' : '') + '</span>';
  }

  /* DC-296: los filtros usan el selector gráfico de Solicitudes (GI.selectGrafico) con punto de color y conteo. */
  var TONO = { Recibido: 'informative', Validado: 'positive', 'Por Subsanar': 'caution', Activa: 'negative', Cumplida: 'positive' };
  function filtrosHtml() {
    return '<div class="gs-pick gi-fsel gi-fsel--reg" id="giRegH"></div><div class="gs-pick gi-fsel gi-fsel--res" id="giResH"></div>';
  }
  function filtrosInit(onReg, onRes) {
    var all = GI.all(), cr = {}, cs = {};
    all.forEach(function (r) { cr[r.estadoRegistro] = (cr[r.estadoRegistro] || 0) + 1; var s = D.estadoRestriccion(r); cs[s] = (cs[s] || 0) + 1; });
    function items(list, c, todos) {
      var dot = function (e) { return '<span class="gs-dot gi-dot gi-dot--' + (TONO[e] || 'neutral') + '" aria-hidden="true"></span>'; };
      var n = function (k) { return '<span class="gi-fsel__n">' + k + '</span>'; };
      return [{ v: '', n: todos, av: '', tag: n(all.length) }].concat(list.map(function (e) { return { v: e, n: e, av: dot(e), tag: n(c[e] || 0) }; }));
    }
    GI.selectGrafico({ host: d.getElementById('giRegH'), id: 'giReg', label: 'Estado del registro', value: filt.reg, onPick: onReg, items: items(ESTADOS_REG, cr, 'Todos') });
    GI.selectGrafico({ host: d.getElementById('giResH'), id: 'giRes', label: 'Estado de la restricción', value: filt.res, onPick: onRes, items: items(['Activa', 'Inactiva', 'Cumplida'], cs, 'Todas') });
  }

  function viewList(view, ctx) {
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Gestión' }];
    var all = GI.all();

    view.innerHTML = '<div class="page-inner gi-page">' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">Gestión de infractores</h1>' +
      '<p class="page-subtitle">Registra, valida y consulta las sanciones en firme de la Ley 1453 de 2011.</p></div>' +
      '<div class="gi-head__actions"><a class="naowee-btn naowee-btn--mute" href="' + BASE + '/carga-masiva">' + svg('upload') + ' Carga masiva</a>' +
      '<a class="naowee-btn naowee-btn--loud" href="' + BASE + '/nuevo">' + svg('plus') + ' Registrar infractor</a></div></header>' +
      '<section class="gi-panel-row" aria-label="Panorama de infractores">' + insightsHtml() + '<div id="giChartCard">' + chartHtml() + '</div></section>' +
      '<section class="naowee-table-card"><div class="gi-tbar"><div class="gi-tbar__title"><h2 class="naowee-table-card__title">Registros de infractores</h2><p class="naowee-table-card__subtitle" id="giSub"></p></div>' +
        '<div class="gi-search">' + svg('search') + '<input type="text" id="giQ" aria-label="Buscar por documento, nombre o acto" title="Buscar por documento, nombre o acto" placeholder="Buscar" value="' + esc(filt.q) + '"></div>' +
        filtrosHtml() + '</div>' +
        '<div class="gi-table-wrap"><table class="gi-table"><thead><tr><th>Registro</th><th>Infractor</th><th>Origen de la obligación</th><th>Acto administrativo</th><th>Fin de vigencia</th><th>Registro</th><th>Restricción</th><th></th></tr></thead><tbody id="giBody"></tbody></table></div>' +
        '<div class="gi-foot" id="giFoot"></div></section></div>';

    function paint() {
      var q = filt.q.trim().toLowerCase();
      var rows = all.filter(function (r) {
        if (filt.reg && r.estadoRegistro !== filt.reg) return false;
        if (filt.res && D.estadoRestriccion(r) !== filt.res) return false;
        if (!q) return true;
        var h = [r.numId, D.nombreCompleto(r), r.numActo, r.id].join(' ').toLowerCase();
        return h.indexOf(q) >= 0 || h.indexOf(q.replace(/\./g, '')) >= 0; /* acepta el documento con puntos */
      });
      d.getElementById('giSub').textContent = rows.length + ' de ' + all.length + ' registros';
      d.getElementById('giFoot').innerHTML = 'Mostrando ' + rows.length + ' de ' + all.length + ' <button type="button" class="gi-reset" id="giReset">Restablecer datos de la demo</button>';
      d.getElementById('giReset').addEventListener('click', function () { GI.reset(); toast('Datos de la demo restablecidos.'); SUID.render(); });
      d.getElementById('giBody').innerHTML = rows.length ? rows.map(function (r) {
        var menor = D.esMenor(r);
        var dias = D.diasRestantes(r);
        var res = D.estadoRestriccion(r);
        return '<tr data-id="' + r.id + '"><td><span class="gi-mono">' + r.id + '</span><small>' + U.fmt(r.fechaRegistro) + '</small></td>' +
          '<td><strong>' + esc(D.nombreCompleto(r)) + '</strong>' + (menor ? ' <span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Menor</span>' : '') +
          '<small>' + esc(r.tipoId.replace(/^.*\(|\)$/g, '')) + ' ' + esc(GI.fmtDoc(r.tipoId, r.numId)) + '</small></td>' +
          '<td>' + conductaHtml(r) + '</td>' +
          '<td>' + esc(r.numActo) + '<small>Ejecutoria ' + U.fmt(r.fechaEjecutoria) + '</small></td>' +
          '<td>' + U.fmt(D.finVigencia(r)) + ((res === 'Activa' || res === 'Cumplida') && dias != null ? '<small>' + GI.fmtDias(dias) + '</small>' : '') + '</td>' +
          '<td>' + badgeReg(r.estadoRegistro) + '</td><td>' + badgeRes(res) + '</td>' +
          '<td class="gi-actions"><a class="naowee-btn naowee-btn--quiet naowee-btn--small" href="' + BASE + '/' + r.id + '">Ver ficha</a></td></tr>';
      }).join('') : '<tr><td colspan="8" class="gi-empty">Ningún registro coincide con los filtros.</td></tr>';
    }
    paint();
    d.getElementById('giQ').addEventListener('input', function (e) { filt.q = e.target.value; paint(); });
    filtrosInit(function (v) { filt.reg = v; viewList(view, ctx); d.getElementById('giReg').focus(); },
      function (v) { filt.res = v; viewList(view, ctx); d.getElementById('giRes').focus(); });
    var cc = d.getElementById('giChartCard');
    cc.addEventListener('click', function (e) {
      var b = e.target.closest('[data-n]'); if (!b) return;
      chartN = +b.getAttribute('data-n');
      cc.innerHTML = chartHtml(true); initChart(cc);
      var nb = cc.querySelector('.gi-chart__neto'), cs = chartS;
      setTimeout(function () { if (nb) nb.innerHTML = netoHtml(cs.neto, cs.n, cs.nu, cs.sa); }, 60);
      var f = cc.querySelector('[data-n="' + chartN + '"]'); if (f) f.focus();
    });
    initChart(cc); initTips(view);
    d.getElementById('giBody').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr && !e.target.closest('a')) location.hash = BASE.slice(1) + '/' + tr.getAttribute('data-id'); });
  }

  function svg(n) {
    var P = {
      plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.650" y2="16.650"/>', back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      check: '<polyline points="20 6 9 17 4 12"/>', undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.700L3 13"/>', pencil: '<path d="M12 20h9"/><path d="M16.500 3.500a2.120 2.120 0 0 1 3 3L7 19l-4 1 1-4z"/>',
      dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
    };
    return '<svg class="gi-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[n] || '') + '</svg>';
  }

  /* ───────── ficha ───────── */
  function viewFicha(view, ctx, id) {
    var r = GI.get(id);
    if (!r) { location.hash = BASE; return; }
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Gestión', href: BASE }, { label: r.id }];
    var res = D.estadoRestriccion(r), menor = D.esMenor(r), fin = D.finVigencia(r), dias = D.diasRestantes(r);
    var enlazadas = w.GS ? w.GS.porMedida(r.id) : [];
    var misma = GI.all().filter(function (x) { return x.numId === r.numId && x.tipoId === r.tipoId && x.id !== r.id; });

    function kv(rows) {
      return '<dl class="gi-kv">' + rows.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + (x[1] === '' || x[1] == null ? '—' : x[1]) + '</dd></div>'; }).join('') + '</dl>';
    }
    function persona(p, titulo) {
      return '<section class="gi-card"><h3 class="gi-card__title">' + titulo + '</h3>' + kv([
        ['Documento', esc(p.tipoId) + ' · ' + esc(GI.fmtDoc(p.tipoId, p.numId))], ['Nombre completo', esc((p.nombres + ' ' + p.apellidos).trim())],
        ['Residencia', esc([p.ciudad, p.depto, p.pais].filter(Boolean).join(', '))], ['Dirección', esc(p.dir)],
        ['Teléfono', p.telefono ? esc(p.indicativo + ' ' + p.telefono) : ''], ['Correo', esc(p.correo)],
        ['Fecha de nacimiento', U.fmt(p.fechaNac)], ['Edad', U.ageAt(p.fechaNac, r.fechaHechos) != null ? U.ageAt(p.fechaNac, r.fechaHechos) + ' años (a la fecha de los hechos)' : ''], ['Sexo', esc(p.sexo)]
      ]) + '</section>';
    }
    var acciones = '';
    if (r.estadoRegistro === 'Recibido' || r.estadoRegistro === 'Por Subsanar') {
      acciones = '<button class="naowee-btn naowee-btn--mute" id="aSub">' + svg('undo') + ' Devolver por subsanar</button>' +
        '<button class="naowee-btn naowee-btn--loud" id="aVal">' + svg('check') + ' Validar registro</button>';
    }
    var banner = '';
    if (r.estadoRegistro !== 'Validado') banner = '<div class="gi-banner gi-banner--warn"><strong>La restricción está inactiva.</strong> Pasa a Activa en cuanto el registro quede Validado.' + (r.estadoRegistro === 'Por Subsanar' && r.observaciones ? '<br>Motivo de la devolución: ' + esc(r.observaciones) : '') + '</div>';
    else if (res === 'Cumplida') banner = '<div class="gi-banner gi-banner--ok"><strong>Restricción cumplida.</strong> Terminó su vigencia el ' + U.fmt(fin) + '. El expediente se conserva con su soporte e historial.</div>';
    else banner = '<div class="gi-banner gi-banner--danger"><strong>Restricción activa.</strong> Prohibición de ingreso vigente hasta el ' + U.fmt(fin) + (dias != null ? ' (' + GI.fmtDias(dias).toLowerCase() + ').' : '.') + '</div>';

    view.innerHTML = '<div class="page-inner gi-page">' +
      '<a class="gi-back" href="' + BASE + '">' + svg('back') + ' Volver a la bandeja</a>' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">' + esc(D.nombreCompleto(r)) + (menor ? ' <span class="naowee-badge naowee-badge--neutral naowee-badge--quiet">Menor de edad</span>' : '') + '</h1>' +
      '<p class="page-subtitle"><span class="gi-mono">' + r.id + '</span> · ' + esc(r.tipoId) + ' ' + esc(GI.fmtDoc(r.tipoId, r.numId)) + '</p></div>' +
      '<div class="gi-head__actions"><a class="naowee-btn naowee-btn--quiet" href="' + BASE + '/' + r.id + '/editar">' + svg('pencil') + ' Editar</a>' + acciones + '</div></header>' +
      '<div class="gi-states"><div><span>Estado del registro</span>' + badgeReg(r.estadoRegistro) + '</div><div><span>Estado de la restricción</span>' + badgeRes(res) + '</div>' +
      '<div><span>Fin de vigencia</span><strong>' + U.fmt(fin) + '</strong></div><div><span>Sanción</span><strong>' + r.meses + ' meses' + (r.valor ? ' · $' + Number(r.valor).toLocaleString('es-CO') : '') + '</strong></div></div>' +
      banner +
      (enlazadas.length ? '<div class="gi-banner gi-banner--info">Esta medida salió de <strong>' + enlazadas.length + '</strong> solicitud(es) de control: ' + enlazadas.map(function (x) { return '<a href="#/control-acceso/solicitudes">' + x.id + '</a>'; }).join(', ') + '.</div>' : '') +
      (misma.length ? '<div class="gi-banner gi-banner--info">Esta persona tiene <strong>' + misma.length + '</strong> restricción(es) más: ' + misma.map(function (x) { return '<a href="' + BASE + '/' + x.id + '">' + x.id + '</a>'; }).join(', ') + '.</div>' : '') +
      '<div class="gi-grid">' +
        '<div class="gi-col">' + persona(r, 'Infractor') + (r.rep ? persona(r.rep, 'Representante legal o tutor') : '') +
          '<section class="gi-card"><h3 class="gi-card__title">Hechos y conducta</h3>' + kv([
            ['Fecha de los hechos', U.fmt(r.fechaHechos)], ['Competición', esc(r.competicion + (r.otraCompeticion ? ' · ' + r.otraCompeticion : ''))],
            ['Evento deportivo', esc(r.local + ' vs. ' + r.visitante)], ['Ciudad de los hechos', esc(r.ciudadHechos)],
            ['Origen de la obligación', '<ul class="gi-list">' + r.origen.map(function (i) { return '<li>' + esc(C.origen[i]) + '</li>'; }).join('') + '</ul>'],
            ['Agravantes', r.agravantes.length ? '<ul class="gi-list">' + r.agravantes.map(function (i) { return '<li>' + esc(C.agravantes[i]) + '</li>'; }).join('') + '</ul>' : 'Ninguno'],
            ['Descripción', esc(r.descripcion)]]) + '</section>' +
          '<section class="gi-card"><h3 class="gi-card__title">Sanción</h3>' + kv([
            ['Acto administrativo', esc(r.numActo) + ' · ' + U.fmt(r.fechaActo)], ['Constancia de ejecutoria', U.fmt(r.fechaEjecutoria)],
            ['Tiempo de sanción', r.meses + ' meses'], ['Fin de vigencia', U.fmt(fin)], ['Valor de la sanción', r.valor ? '$' + Number(r.valor).toLocaleString('es-CO') : '—']]) + '</section>' +
          '<section class="gi-card"><h3 class="gi-card__title">Gestión interna</h3>' + kv([
            ['Fecha de radicado de entrada', U.fmt(r.fechaRadicado)], ['Radicado de entrada en Mindeporte', esc(r.radEntrada)], ['Respuesta al radicado', esc(r.respuesta)],
            ['Radicado contabilidad', esc(r.radContab)], ['Radicado jurídica', esc(r.radJuridica)], ['Profesional responsable', esc(r.profesional)], ['Observaciones', esc(r.observaciones)]]) + '</section></div>' +
        '<aside class="gi-col gi-col--side"><section class="gi-card"><h3 class="gi-card__title">Historial</h3><ol class="gi-timeline">' +
          r.historial.slice().reverse().map(function (h) {
            return '<li><span class="gi-timeline__dot"></span><div><strong>' + (h.de === h.a ? esc(h.a) : (h.de ? esc(h.de) + ' → ' : '') + esc(h.a)) + '</strong>' +
              '<small>' + U.fmt(h.fecha) + ' ' + esc(h.hora) + ' · ' + esc(h.usuario || 'Sistema') + '</small>' + (h.nota ? '<p>' + esc(h.nota) + '</p>' : '') + '</div></li>';
          }).join('') + '</ol></section></aside></div></div>';

    var aVal = d.getElementById('aVal'), aSub = d.getElementById('aSub');
    if (aVal) aVal.addEventListener('click', function () {
      var m = modal({ title: 'Validar registro', sub: r.id, body: '<p class="gi-p">Se confirma que el expediente cumple los requisitos formales. La restricción pasará a <strong>Activa</strong> si su vigencia está corriendo.</p><label class="gi-lbl">Observación (opcional)<textarea class="gi-ta" id="vObs" rows="3"></textarea></label>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button class="naowee-btn naowee-btn--loud" id="vOk">Validar</button>' });
      m.el.querySelector('#vOk').addEventListener('click', function () {
        GI.setEstado(r.id, 'Validado', m.el.querySelector('#vObs').value.trim() || 'Cumple los requisitos formales.');
        m.close(); toast('Registro validado. La restricción quedó ' + D.estadoRestriccion(GI.get(r.id)).toLowerCase() + '.'); viewFicha(view, ctx, id); SUID.render();
      });
    });
    if (aSub) aSub.addEventListener('click', function () {
      var m = modal({ title: 'Devolver por subsanar', sub: r.id, body: '<p class="gi-p">El expediente se devuelve a la inspección de policía. Indica qué falta.</p><label class="gi-lbl gi-lbl--req">Motivo<textarea class="gi-ta" id="sMot" rows="3"></textarea></label><p class="gi-err" id="sErr" hidden>El motivo es obligatorio.</p>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button class="naowee-btn naowee-btn--loud" id="sOk">Devolver</button>' });
      m.el.querySelector('#sOk').addEventListener('click', function () {
        var mot = m.el.querySelector('#sMot').value.trim();
        if (!mot) { m.el.querySelector('#sErr').hidden = false; return; }
        GI.setEstado(r.id, 'Por Subsanar', mot);
        m.close(); toast('Registro devuelto por subsanar.', 'warn'); SUID.render();
      });
    });
  }

  /* ───────── rutas ───────── */
  SUID.views['control-acceso/infractores'] = function (view, ctx) {
    var rest = ctx.rest;
    if (!rest.length) return viewList(view, ctx);
    if (rest[0] === 'nuevo') return w.GIForm.open(view, ctx, null);
    if (rest[0] === 'carga-masiva') return w.GIBulk.open(view, ctx);
    if (rest[1] === 'editar') return w.GIForm.open(view, ctx, rest[0]);
    return viewFicha(view, ctx, rest[0]);
  };

  w.GIUI = { svg: svg, toast: toast, modal: modal, badgeReg: badgeReg, badgeRes: badgeRes, BASE: BASE, PAISES: PAISES, INDICATIVO: INDICATIVO, GEO: GEO, PROFESIONALES: PROFESIONALES };
})(window, document);
