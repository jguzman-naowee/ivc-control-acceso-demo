/* Estados de carga de la demo: esqueletos, tiempos simulados por vista y estado ocupado de los botones. */
(function (w, d) {
  'use strict';
  /* Una sola velocidad: el doble de la base, entre la «normal» (×1) y la «lenta» (×3) que se probaron antes. */
  var BASE = { busqueda: 500, lista: 1000, ficha: 750, form: 700, masiva: 450, solicitudes: 900, ph: 350 };
  var FACTOR = 2, timer = 0;

  function escala(ms) { return Math.round(ms * FACTOR); }

  /* ───── piezas ───── */
  function b(wd, h, st) { return '<i class="sk-b" style="width:' + wd + ';height:' + h + 'px;' + (st || '') + '"></i>'; }
  function pill(wd, h) { return b(wd, h || 40, 'border-radius:999px;flex-shrink:0'); }
  function head(tw, sw, btns) {
    var bt = '';
    for (var i = 0; i < btns; i++) bt += pill(i ? '170px' : '140px', 42);
    return '<header class="sk-head"><div>' + b(tw, 32) + b(sw, 14, 'margin-top:12px') + '</div>' + (btns ? '<div class="sk-row">' + bt + '</div>' : '') + '</header>';
  }
  function back() { return b('150px', 14); }
  function tabla(cols, filas, toolbar) {
    var g = 'grid-template-columns:' + cols.join('fr ') + 'fr;';
    var h = '<div class="sk-bar sk-bar--head" style="' + g + '">' + cols.map(function () { return b('60%', 12); }).join('') + '</div>';
    var r = '';
    for (var i = 0; i < filas; i++) r += '<div class="sk-bar sk-bar--row" style="' + g + '">' + cols.map(function (c, k) {
      return '<div class="sk-cell">' + b((55 + ((i * 7 + k * 13) % 35)) + '%', 14) + (k % 3 === 1 ? b('45%', 11) : '') + '</div>'; }).join('') + '</div>';
    return '<div class="sk-card sk-card--flush">' + (toolbar || '') + h + r + '</div>';
  }
  function sr(t) { return '<span class="sk-sr">' + t + '</span>'; }
  function pagina(nombre, cuerpo) {
    return '<div class="page-inner gi-page sk" role="status" aria-live="polite">' + sr('Cargando ' + nombre + '…') + cuerpo + '</div>';
  }

  /* ───── una por vista ───── */
  var SK = {
    lista: function () {
      var tiles = ''; for (var i = 0; i < 6; i++) tiles += '<i class="sk-b sk-tile"></i>';
      var tb = '<div class="sk-row" style="padding:14px 20px">' + '<div>' + b('180px', 16) + b('110px', 11, 'margin-top:8px') + '</div>' + pill('34%', 42) + '<div class="sk-row">' + pill('190px', 42) + pill('210px', 42) + '</div></div>';
      return pagina('Gestión', head('330px', '470px', 2) +
        '<div class="sk-grid2"><div class="sk-card">' + b('110px', 18) + b('230px', 12) + '<div class="sk-tiles">' + tiles + '</div></div>' +
        '<div class="sk-card"><div class="sk-row">' + b('210px', 18) + pill('150px', 40) + '</div>' + b('260px', 12) + b('100%', 210, 'margin-top:8px') +
        '<div class="sk-row sk-row--gap">' + pill('110px', 34) + pill('150px', 34) + '</div>' + b('100%', 44, 'margin-top:6px') + '</div></div>' +
        tabla([1.1, 1.6, 2.3, 1.5, 1.1, 1, 1, .7], 6, tb));
    },
    busqueda: function () {
      var rows = '';
      for (var i = 0; i < 7; i++) rows += '<div class="sk-bar sk-bar--row" style="grid-template-columns:2.2fr 3fr 1.6fr 24px;min-height:62px"><div class="sk-cell">' + b((50 + (i * 9) % 30) + '%', 15) + b('30%', 11) + '</div><div class="sk-cell"><div class="sk-row sk-row--gap" style="margin:0">' + b('54px', 18, 'border-radius:4px') + b('42%', 13) + '</div>' + b('26%', 11) + '</div><div class="sk-cell">' + pill('72px', 20) + b('50%', 11) + '</div>' + b('14px', 14) + '</div>';
      return pagina('Búsqueda', head('340px', '400px', 0) +
        '<div class="sk-card"><div class="sk-row">' + pill('100%', 48) + b('24px', 24, 'border-radius:50%;flex-shrink:0') + pill('130px', 44) + '</div><div class="sk-row" style="justify-content:flex-end;gap:10px">' + b('150px', 12) + pill('200px', 38) + '</div></div>' +
        '<div class="sk-card sk-card--flush"><div class="sk-row" style="padding:20px">' + b('110px', 18) + b('130px', 12) + '</div>' + rows + '</div>');
    },
    solicitudes: function () {
      var chips = ''; [96, 108, 118, 118, 140, 120].forEach(function (x) { chips += pill(x + 'px', 42); });
      var tb = '<div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px"><div class="sk-row sk-row--gap" style="flex-wrap:wrap;margin:0">' + chips + pill('190px', 42) + '</div>' + pill('360px', 44) + '</div>';
      var g = 'grid-template-columns:1.3fr 2.2fr 2fr 2.6fr 1fr', rows = '';
      for (var i = 0; i < 7; i++) rows += '<div class="sk-bar sk-bar--row" style="' + g + ';min-height:74px"><div class="sk-cell">' + b('70%', 14) + b('55%', 11) + '</div><div class="sk-row sk-row--gap" style="margin:0">' + b('36px', 36, 'border-radius:50%;flex-shrink:0') + '<div class="sk-cell" style="flex:1">' + b('70%', 14) + pill('90px', 18) + '</div></div><div class="sk-cell">' + b('72%', 14) + b('40%', 11) + '</div><div class="sk-cell">' + b('80%', 13) + b('60%', 11) + '</div>' + pill('70px', 22) + '</div>';
      return pagina('Solicitudes', head('340px', '720px', 0) +
        '<div class="sk-card sk-card--flush">' + tb + '<div class="sk-bar sk-bar--head" style="' + g + '">' + [1, 2, 3, 4, 5].map(function () { return b('55%', 12); }).join('') + '</div>' + rows + '</div>');
    },
    ficha: function () {
      function kv(n) { var s = ''; for (var i = 0; i < n; i++) s += '<div>' + b('40%', 11) + b((60 + i * 7 % 30) + '%', 15, 'margin-top:8px') + '</div>'; return '<div class="sk-card">' + b('130px', 18) + '<div class="sk-cols" style="margin-top:6px">' + s + '</div></div>'; }
      var states = '<div class="sk-card" style="flex-direction:row;justify-content:space-between;gap:24px">' + [1, 2, 3, 4].map(function () { return '<div style="flex:1">' + b('60%', 11) + b('45%', 22, 'margin-top:10px') + '</div>'; }).join('') + '</div>';
      var tl = '<div class="sk-card">' + b('90px', 18);
      for (var i = 0; i < 3; i++) tl += '<div class="sk-tl">' + b('12px', 12, 'border-radius:50%;margin-top:3px;flex-shrink:0') + '<div style="flex:1">' + b('70%', 14) + b('55%', 11, 'margin-top:8px') + '</div></div>';
      tl += '</div>';
      return pagina('la ficha', back() + head('360px', '300px', 2) + states + b('100%', 46, 'border-radius:8px') +
        '<div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start"><div style="display:flex;flex-direction:column;gap:16px">' + kv(8) + kv(6) + kv(4) + '</div>' + tl + '</div>');
    },
    form: function () {
      function sec(n) { var f = ''; for (var i = 0; i < n; i++) f += '<div>' + b('55%', 12) + b('100%', 42, 'margin-top:8px') + '</div>'; return '<div class="sk-card"><div class="sk-row sk-row--gap" style="margin:0 0 6px">' + b('30px', 30, 'border-radius:8px') + b('280px', 18) + '</div><div class="sk-fields">' + f + '</div></div>'; }
      var steps = ''; for (var i = 0; i < 6; i++) steps += pill('100%', 42);
      return pagina('el formulario', back() + head('280px', '620px', 0) +
        '<div class="sk-layout"><div style="display:flex;flex-direction:column;gap:6px">' + steps + '</div><div style="display:flex;flex-direction:column;gap:18px">' + sec(9) + sec(6) + sec(6) + '</div></div>');
    },
    masiva: function () {
      return pagina('la carga masiva', back() + head('360px', '700px', 0) +
        '<div class="sk-card">' + b('110px', 18) + b('70%', 13) + pill('220px', 42) + '</div>' +
        '<div class="sk-card">' + b('190px', 18) + b('100%', 190, 'border-radius:12px;margin-top:6px') + '</div>');
    },
    ph: function () {
      return pagina('la sección', b('240px', 32) + b('460px', 14, 'margin-top:4px') + pill('210px', 42));
    }
  };

  function kind(match, ctx) {
    if (!match) return 'ph';
    if (match === 'control-acceso/consulta') return 'busqueda';
    if (match === 'control-acceso/solicitudes') return 'solicitudes';
    var a = ctx.rest[0];
    if (!a) return 'lista';
    if (a === 'nuevo' || ctx.rest[1] === 'editar') return 'form';
    if (a === 'carga-masiva') return 'masiva';
    return 'ficha';
  }

  /* ───── barra y ciclo de carga ───── */
  var prog = null;
  function barra() {
    if (prog) return prog;
    prog = d.createElement('div'); prog.className = 'sk-progress'; prog.setAttribute('aria-hidden', 'true'); prog.innerHTML = '<i></i>';
    d.querySelector('.main').appendChild(prog);
    return prog;
  }
  /* Loader de una zona: ocupa el lugar de los resultados mientras se busca el dato. */
  var FR = {
    resultados: function () {
      var rows = '';
      for (var i = 0; i < 4; i++) rows += '<div class="sk-bar sk-bar--row" style="grid-template-columns:2.4fr 1fr 2fr 24px;min-height:64px"><div class="sk-cell">' + b((52 + (i * 11) % 30) + '%', 15) + b('28%', 11) + '</div>' + b('50%', 13) + '<div class="sk-cell">' + pill('76px', 20) + b('46%', 11) + '</div>' + b('14px', 14) + '</div>';
      return '<div class="sk" role="status" aria-live="polite">' + sr('Consultando…') + b('240px', 14, 'margin-bottom:12px') + '<div class="sk-card sk-card--flush">' + rows + '</div></div>';
    },
    persona: function () {
      var med = ''; for (var i = 0; i < 2; i++) med += '<div class="sk-bar sk-bar--row" style="grid-template-columns:repeat(6,1fr);min-height:78px">' + [1, 2, 3, 4, 5, 6].map(function () { return '<div class="sk-cell">' + b('50%', 11) + b('76%', 15) + '</div>'; }).join('') + '</div>';
      return '<div class="sk" role="status" aria-live="polite">' + sr('Consultando…') + '<div class="sk-card sk-card--flush"><div class="sk-row" style="padding:16px 20px;align-items:center">' +
        '<div class="sk-row sk-row--gap" style="margin:0;gap:18px"><div class="sk-row sk-row--gap" style="margin:0;gap:10px">' + b('84px', 105, 'border-radius:10px;flex-shrink:0') + b('84px', 105, 'border-radius:10px;flex-shrink:0') + '</div><div class="sk-cell" style="gap:10px">' + b('240px', 20) + b('170px', 13) + '</div></div>' +
        '<div class="sk-cell" style="align-items:flex-end;gap:10px">' + pill('84px', 24) + b('190px', 13) + '</div></div>' + med + '</div></div>';
    }
  };

  w.SUID.load = {
    fragmento: function (kind) { return FR[kind](); },
    delay: function (match, ctx) { return escala(BASE[kind(match, ctx)]); },
    crumbs: function (match, ctx) {
      var I = { label: 'Inicio', href: '#/' }, A = { label: 'Control de acceso' }, B = '#/control-acceso/infractores', G = { label: 'Gestión', href: B };
      if (!match) return [I, { label: 'En construcción' }];
      if (match === 'control-acceso/consulta') return [I, A, { label: 'Búsqueda' }];
      if (match === 'control-acceso/solicitudes') return [I, A, { label: 'Solicitudes' }];
      var a = ctx.rest[0];
      if (!a) return [I, A, { label: 'Gestión' }];
      if (a === 'nuevo') return [I, A, G, { label: 'Registrar infractor' }];
      if (a === 'carga-masiva') return [I, A, G, { label: 'Carga masiva' }];
      if (ctx.rest[1] === 'editar') return [I, A, G, { label: 'Editar ' + a }];
      return [I, A, G, { label: a }];
    },
    begin: function (view, match, ctx, ms) {
      view.innerHTML = SK[kind(match, ctx)]();
      view.setAttribute('aria-busy', 'true');
      var p = barra(); p.classList.remove('is-done', 'is-on');
      void p.offsetWidth;
      p.style.setProperty('--sk-ms', ms + 'ms'); p.classList.add('is-on');
    },
    end: function (view) {
      view.removeAttribute('aria-busy');
      var p = barra(); p.classList.remove('is-on'); p.classList.add('is-done');
      clearTimeout(timer); timer = setTimeout(function () { p.classList.remove('is-done'); }, 450);
    }
  };

  /* Botón ocupado: deshabilita, muestra el giro y el texto del trabajo, y ejecuta `fn` al terminar. */
  w.SUID.busy = function (btn, texto, fn, base) {
    var ms = escala(base || 700);
    if (!ms || !btn) { fn(); return; }
    var html = btn.innerHTML;
    btn.disabled = true; btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="sk-spin" aria-hidden="true"></span>' + texto;
    setTimeout(function () {
      btn.disabled = false; btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); btn.innerHTML = html;
      fn();
    }, ms);
  };
  w.SUID.pausa = function (base) { return escala(base); };
})(window, document);
