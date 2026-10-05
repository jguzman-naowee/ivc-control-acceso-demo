/* Consulta de infractores: ¿esta persona tiene una medida vigente y hasta cuándo? Menores solo por documento completo. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, C = GI.cat, UI = w.GIUI, esc = SUID.esc;
  var BASE = UI.BASE, PAGINA = 5, PAG_REC = 15;
  var st = { q: '', cq: '', abiertos: {}, page: 1, sel: '', rec: 1, f: { est: '', tipo: '', ciu: '' } }; /* q: lo escrito; cq: lo consultado; abiertos: menores abiertos con motivo; sel: persona elegida */
  var MOTIVOS = ['Verificar una medida vigente antes de permitir el ingreso', 'Requerimiento de una autoridad', 'Trámite de un recurso o una solicitud de la persona', 'Auditoría interna'];
  var CASOS = [{ t: 'Ramírez', q: 'Ramírez' }, { t: '71.894.447', q: '71.894.447' }, { t: 'Menor', q: '1020200003' }];
  var CORTA = ['Armas u objetos peligrosos', 'Estupefacientes', 'Violencia contra la fuerza pública', 'Invasión del terreno de juego', 'No atender a logística', 'Bebidas alcohólicas', 'Agresión física', 'Agresión verbal', 'Daño a infraestructura'];

  function abrev(t) { var m = /\(([^)]+)\)/.exec(t || ''); return m ? m[1] : (t || ''); }
  function dias(n) { return GI.fmtDias ? GI.fmtDias(n) : n + ' días'; }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }
  function sinTildes(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function keyOf(p) { return p.tipo + ':' + p.numId; }
  /* Miles con punto, acumulando desde la derecha; solo si lo escrito es un número (un nombre no se toca). */
  function miles(v) { return /^[\d.\s]*$/.test(v) ? digitos(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : v; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }

  /* Agrupa los registros de la base por persona (tipo + número de documento). */
  function personas() {
    var map = {}, out = [];
    GI.all().forEach(function (r) {
      var key = abrev(r.tipoId) + ':' + r.numId, p = map[key];
      if (!p) { p = map[key] = { tipo: abrev(r.tipoId), numId: r.numId, texto: GI.fmtDoc(r.tipoId, r.numId), nombre: D.nombreCompleto(r), ciudad: r.ciudad || '', menor: false, nombres: r.nombres || '', apellidos: r.apellidos || '', medidas: [] }; out.push(p); }
      if (D.esMenor(r)) p.menor = true;
      var res = D.estadoRestriccion(r), fin = D.finVigencia(r), i0 = r.origen[0];
      p.medidas.push({ id: r.id, acto: r.numActo, art: (/Art\. \d+/.exec(C.origen[i0]) || [''])[0], corta: CORTA[i0] || '', full: r.origen.map(function (i) { return C.origen[i].replace(/^(\d+\.|[a-c]\) )/, ''); }).join('\n'),
        autoridad: 'Inspección de Policía de ' + (r.ciudadHechos || r.ciudad), ini: r.fechaEjecutoria ? U.addDays(r.fechaEjecutoria, 1) : '', fin: fin, meses: +r.meses || 0, dias: D.diasRestantes(r), href: BASE + '/' + r.id, reg: r.fechaRegistro,
        estado: res === 'Activa' ? 'Vigente' : res === 'Cumplida' ? 'Cumplida' : 'En validación', enTramite: res === 'Inactiva' });
    });
    out.forEach(function (p) { p.res = resumen(p); });
    return out;
  }

  /* Resumen de la persona: si hay una vigente manda la que termina más tarde. */
  function resumen(p) {
    function ult(es) { return p.medidas.filter(function (m) { return m.estado === es; }).sort(function (a, b) { return a.fin < b.fin ? 1 : -1; })[0]; }
    var v = ult('Vigente'), c = ult('Cumplida');
    if (v) return { estado: 'Vigente', rank: 0, fin: v.fin, dias: v.dias, m: v };
    if (c) return { estado: 'Cumplida', rank: 2, fin: c.fin, dias: null, m: c };
    return { estado: 'En validación', rank: 1, fin: '', dias: null, m: p.medidas[0] };
  }
  /* Urgencia: restricciones activas que vencen pronto primero; después en validación y las cumplidas más recientes. */
  function porUrgencia(a, b) {
    var x = a.res, y = b.res;
    if (x.rank !== y.rank) return x.rank - y.rank;
    if (x.rank === 0) return x.dias - y.dias;
    if (x.rank === 2) return x.fin < y.fin ? 1 : x.fin > y.fin ? -1 : 0;
    return a.nombre < b.nombre ? -1 : 1;
  }

  function badge(cls, t) { return '<span class="naowee-badge naowee-badge--' + cls + ' naowee-badge--quiet">' + esc(t) + '</span>'; }
  function estadoBadge(e) { return badge(e === 'Vigente' ? 'negative' : e === 'Cumplida' ? 'positive' : 'neutral', e); }
  function tag(t) { return '<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet">' + esc(t) + '</span>'; }
  function vigencia(r) { return r.estado === 'Vigente' ? dias(r.dias) : r.estado === 'Cumplida' ? 'Terminó el ' + U.fmt(r.fin) : 'Aún sin efecto'; }
  function enmascarar(p) { return p.tipo + ' ••••' + String(p.numId).slice(-4); }
  function cerrado(p) { return p.menor && !st.abiertos[keyOf(p)]; }
  /* Título de tarjeta en dos líneas fijas: apellidos arriba, nombres abajo. */
  function lineas(p) { var c = cerrado(p); return '<span>' + esc(c ? 'Persona' : p.apellidos) + '</span><span>' + esc(c ? 'menor de edad' : p.nombres) + '</span>'; }
  function quien(p) { return p.menor && !st.abiertos[keyOf(p)] ? 'Persona menor de edad' : p.nombre; }

  /* Filtros de apoyo bajo el buscador: acotan Recientes y la búsqueda por nombre; un documento completo los ignora. */
  function filtra(p) { return (!st.f.est || p.res.estado === st.f.est) && (!st.f.tipo || p.tipo === st.f.tipo) && (!st.f.ciu || p.ciudad === st.f.ciu); }
  function buscar(q) {
    var t = q.trim();
    if (!t) return { modo: 'vacio', res: [] };
    if (/[<>{}[\]\\|^~`$%*=]/.test(t)) return { modo: 'invalido', res: [] };
    var dig = digitos(t), soloNum = /^[\d.\s]+$/.test(t) || /^(cc|ce|ti|pa|ppt|pep|rumv)[\s:.-]*\d/i.test(t);
    var todas = personas();
    if (soloNum) {
      if (dig.length < 6) return { modo: 'corto', res: [] };
      return { modo: 'doc', res: todas.filter(function (p) { return p.numId === dig; }) };
    }
    var nt = sinTildes(t).split(/\s+/).filter(Boolean);
    if (sinTildes(t).replace(/\s/g, '').length < 3) return { modo: 'corto', res: [] };
    var hit = todas.filter(function (p) { var n = sinTildes(p.nombre); return nt.every(function (x) { return n.indexOf(x) >= 0; }); });
    return { modo: 'nombre', res: hit.filter(function (p) { return !p.menor; }).filter(filtra).sort(porUrgencia), ocultos: hit.filter(function (p) { return p.menor; }).length };
  }

  /* Modelo del expediente (caso medida): lo que el componente compacto pinta; el menor sin abrir llega reservado. */
  function modeloMedida(p, bloq) {
    var r = p.res, mm = r.m, key = keyOf(p), ab = st.abiertos[key], reg = GI.get(mm.id), vig = r.estado === 'Vigente', cum = r.estado === 'Cumplida', pct = null;
    if (vig && mm.ini && mm.fin) { var tot = (U.parse(mm.fin) - U.parse(mm.ini)) / 86400000; pct = tot > 0 ? Math.max(0, Math.min(100, Math.round(100 - mm.dias * 100 / tot))) : 100; }
    var ev = reg && reg.local ? esc(GI.titulo(reg.local + ' vs. ' + reg.visitante)) : '';
    var m = { caso: 'medida', id: mm.id, nombre: quien(p), menor: p.menor, reservado: bloq, doc: p.tipo + ' ' + p.texto, docDigitos: String(p.numId),
      sub: p.tipo + ' ' + p.texto + (p.ciudad && !bloq ? ' · ' + p.ciudad : '') + (bloq ? '' : ' · ' + plural(p.medidas.length, 'medida', 'medidas')), badges: bloq ? [{ t: 'Menor de edad', tono: 'neu' }] : [], /* abierto: el componente ya rotula al menor */
      estado: { tono: vig ? 'neg' : cum ? 'ok' : 'cau', titulo: vig ? 'Vigente · bloquea en todo el país' : r.estado, progreso: vig && !bloq ? pct : undefined, desde: vig && !bloq && mm.ini ? 'Desde ' + U.fmt(mm.ini) + (mm.meses ? ' · ' + mm.meses + ' meses' : '') : undefined,
        lineas: bloq ? [] : [vig ? 'Hasta el <b>' + U.fmt(r.fin) + '</b> · <b>' + esc(dias(r.dias).toLowerCase()) + '</b>' : cum ? 'Terminó el <b>' + U.fmt(r.fin) + '</b>' : '<b>Aún sin efecto</b>'] },
      resumenTitulo: '', resumen: [], movimientos: [], acciones: '' };
    if (bloq) {
      m.acciones = '<button type="button" class="naowee-btn naowee-btn--loud" data-open>Abrir con motivo</button>';
      m.aviso = { tono: 'warn', html: '<strong>Menor de edad · reserva reforzada.</strong> El nombre y el detalle de la medida solo se abren con un motivo, y la apertura queda auditada.' };
      return m;
    }
    m.resumen = [{ k: 'Conducta', v: tag(mm.art || '—') + ' ' + esc(mm.corta || 'Sin conducta registrada') }, { k: 'Acto', v: esc(mm.acto || '—') }]
      .concat(ev ? [{ k: 'Evento', v: ev }, { k: 'Fecha', v: U.fmt(reg.fechaHechos) }].concat(reg.ciudadHechos ? [{ k: 'Lugar', v: esc(GI.titulo(reg.ciudadHechos)) }] : []) : [{ k: 'Autoridad', v: esc(mm.autoridad) }], [{ k: 'Tiempo', v: mm.meses ? mm.meses + ' meses' : '—' }]);
    if (reg) m.movimientos = (reg.historial || []).slice().reverse().map(function (x) {
      return { t: x.de === x.a ? x.a : (x.de ? x.de + ' → ' : '') + x.a, por: x.usuario || 'Sistema', nota: x.nota || '', fecha: U.fmt(x.fecha) + ' ' + x.hora };
    });
    m.persona = { t: 'Persona', kv: [{ k: 'Documento', v: esc(m.doc) }, { k: 'Ciudad', v: esc(p.ciudad || '—') }] };
    m.secciones = [{ t: 'Medida ' + mm.id, kv: m.resumen }];
    m.acciones = '<a class="naowee-btn naowee-btn--loud" href="' + mm.href + '">Ampliar expediente</a>';
    if (p.menor && ab) m.aviso = { tono: 'warn', html: '<strong>Menor de edad · datos abiertos con motivo.</strong> Apertura auditada · ' + esc(ab.motivo) + ' · ' + esc(SUID.user.name) + ' · ' + U.fmt(U.now().fecha) + ' ' + U.now().hora };
    return m;
  }

  /* Expediente de la persona en el panel derecho (DC-060): sobre la lista y el buscador, que no se reemplazan. Cerrar = la X del panel. */
  function esqueleto() {
    function b(w2, h) { return '<span class="sk-b" style="display:block;width:' + w2 + ';height:' + h + 'px;margin-top:12px"></span>'; }
    return '<div class="sk" role="status" aria-live="polite"><span class="sk-sr">Consultando…</span>' + b('64%', 20) + b('100%', 80) + b('100%', 120) + b('100%', 120) + '</div>';
  }
  function panelPersona(p, origen, cargando) {
    var key = keyOf(p), bloq = p.menor && !st.abiertos[key], o, c;
    if (cargando) o = { tag: p.menor ? badge('neutral', 'Menor de edad') : '', titulo: bloq ? 'Persona menor de edad' : quien(p), sub: p.tipo + ' ' + p.texto, cuerpo: esqueleto(), acciones: '', nota: '' };
    else { c = modeloMedida(p, bloq); o = GI.expediente.compacto(c); }
    var propio = o.onPintar;
    o.id = key; o.origen = origen;
    o.onPintar = function (el) {
      if (propio) propio(el);
      var ab = el.querySelector('[data-open]'); if (ab) ab.addEventListener('click', function () { pedir(p); });
    };
    o.onCerrar = function (m) { if (m !== 'api') { st.sel = ''; clearTimeout(tp); } }; /* 'api' = repintado propio, no cierre del usuario */
    GI.panel.abrir(o);
  }
  var tp = 0, pedir = null; /* tp: temporizador del loader del panel; pedir: modal de motivo (vive dentro de open) */

  /* Tabla de personas: encabezado con total, filas clicables y paginador (GI.pager se arma en paint). */
  var pgCfg = null;
  function tabla(cabs, filas) {
    return '<div class="gt-wrap"><table class="gt-table"><thead><tr>' + cabs.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + filas + '</tbody></table></div>';
  }
  function docPersona(p) { return esc(p.menor && !st.abiertos[keyOf(p)] ? enmascarar(p) : p.tipo + ' ' + p.texto); }
  function filaPersona(p, k) {
    var r = p.res;
    return '<tr tabindex="0" data-id="' + esc(k) + '" data-k="sel"><td><strong>' + esc(quien(p)) + '</strong><small>' + docPersona(p) + '</small></td>' +
      '<td>' + plural(p.medidas.length, 'medida', 'medidas') + '</td>' +
      '<td>' + estadoBadge(r.estado) + '<small>' + esc(r.estado === 'Vigente' ? dias(r.dias) + ' · hasta ' + U.fmt(r.fin) : vigencia(r)) + '</small></td></tr>';
  }
  function listaHtml(b) {
    var n = b.res.length, pg = Math.min(Math.max(st.page, 1), Math.ceil(n / PAGINA)), ini = (pg - 1) * PAGINA;
    st.page = pg; pgCfg = { k: 'res', total: n, page: pg, size: PAGINA, label: 'Paginación de resultados' };
    return GI.tablaHead({ id: 'gcRes', titulo: 'Resultados', total: n, fuera: true }) + '<section class="gt-card gc-lista" aria-labelledby="gcResT">' +
      '<p class="gc-count" tabindex="-1">' + plural(n, 'persona encontrada', 'personas encontradas') + ' · de mayor a menor urgencia' + (b.ocultos ? ' · ' + b.ocultos + (b.ocultos === 1 ? ' menor no se lista' : ' menores no se listan') + ' por nombre' : '') + '</p>' +
      tabla(['Persona', 'Medidas', 'Estado'], b.res.slice(ini, ini + PAGINA).map(function (p) { return filaPersona(p, keyOf(p)); }).join('')) +
      '<nav data-pag></nav></section>';
  }

  /* Recientes: las 30 personas más urgentes, en rejilla de 15 por página (3 filas de 5). */
  function agregada(p) { return p.medidas.map(function (m) { return m.reg || ''; }).sort().pop(); }
  function recientesHtml() {
    var todos = personas().filter(filtra).sort(porUrgencia).slice(0, 30), pg = Math.min(Math.max(st.rec, 1), Math.max(1, Math.ceil(todos.length / PAG_REC))), ini = (pg - 1) * PAG_REC;
    st.rec = pg; pgCfg = { k: 'rec', total: todos.length, page: pg, size: PAG_REC, label: 'Paginación de recientes' };
    return '<div class="gc-headrow">' + GI.tablaHead({ id: 'gcRec', titulo: 'Recientes', total: todos.length, fuera: true }) +
      '<a class="naowee-btn naowee-btn--mute gc-btn" href="' + BASE + '">Ver todos</a></div>' +
      '<section class="gt-card gc-lista" aria-labelledby="gcRecT">' + (todos.length ? '' : '<p class="gc-count">Ninguna persona coincide con los filtros.</p>') + '<div class="gc-grid">' +
      todos.slice(ini, ini + PAG_REC).map(function (p) {
        var r = p.res, ag = agregada(p);
        return '<article class="gc-persona" tabindex="0" data-id="' + esc(keyOf(p)) + '" data-k="sel"><div class="gc-persona__foto">' + w.GIBio.foto(p.numId, { menor: p.menor, sin: r.estado === 'En validación' || !p.menor && +String(p.numId).slice(-1) % 4 === 0 }) + '</div>' + estadoBadge(r.estado) +
          '<strong' + (cerrado(p) ? '' : ' title="' + esc(p.nombre) + '"') + '>' + lineas(p) + '</strong><small>' + docPersona(p) + '</small>' +
          '<span class="gc-persona__add">' + (ag ? 'Agregado el ' + U.fmt(ag) : 'Sin fecha de registro') + '</span></article>';
      }).join('') + '</div><nav data-pag></nav></section>';
  }
  var INFO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg>';

  function vacio(titulo, texto, extra, cls) {
    return '<div class="gc-empty' + (cls ? ' ' + cls : '') + '"' + (cls ? ' role="alert"' : '') + '><strong>' + titulo + '</strong>' + texto + (extra || '') + '</div>';
  }

  /* El expediente vive solo en Gestión: una ruta con parámetro lleva a la ficha de esa persona o, si no existe, a la bandeja. */
  SUID.views['control-acceso/consulta'] = function (view, ctx) {
    var a = ctx.rest && ctx.rest[0];
    if (!a) return open(view, ctx);
    var k = decodeURIComponent(a), p = personas().filter(function (x) { return keyOf(x) === k; })[0];
    location.hash = p ? p.res.m.href : GI.get(k) ? BASE + '/' + k : BASE.replace('infractores', 'consulta');
  };
  var RESET = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>';
  function opts(arr, todas) { return [{ v: '', n: todas, av: '', tag: '' }].concat(arr.map(function (x) { return { v: x, n: x, av: '', tag: '' }; })); }
  function open(view, ctx) {
    st.q = st.cq;
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Búsqueda' }];
    view.innerHTML = '<div class="page-inner gi-page gc-page">' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">Consulta de infractores</h1>' +
      '<p class="page-subtitle">Verifica si una persona tiene una medida vigente y hasta cuándo.</p></div>' +
      '<button type="button" class="gt-info gc-info" id="gcInfo" aria-label="Cómo buscar" aria-describedby="gcTip" aria-expanded="false">' + INFO + '</button></header>' +
      '<div class="gc-veil" id="gcVeil" aria-hidden="true"></div><section class="gc-card"><div class="gc-card__hd">' + UI.svg('search').replace('<svg', '<svg width="40" height="40"') + '<div class="gc-card__tx"><h2 class="gc-card__t">Búsqueda de infractores</h2>' +
      '<p class="gc-card__s">Escribe el documento completo (mínimo 6 dígitos) o al menos tres letras del nombre.</p></div></div><form class="gc-form" id="gcForm" role="search">' +
      '<div class="gc-field">' + UI.svg('search') + '<input id="gcQ" type="search" autocomplete="off" aria-label="Documento completo o nombre" placeholder="Documento o nombre" value="' + esc(miles(st.cq)) + '">' +
      '<div class="gc-try"><div class="gc-try__list" id="gcTryList" role="group" aria-label="Casos de ejemplo" hidden>' +
      CASOS.map(function (c) { return '<button type="button" class="gc-case" data-q="' + esc(c.q) + '"><span>' + esc(c.t) + '</span></button>'; }).join('') + '</div>' +
      '<button type="button" class="gc-try__btn" id="gcTryBtn" aria-expanded="false" aria-controls="gcTryList" aria-label="Probar con un caso de ejemplo" title="Casos de ejemplo">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div></div>' +
      '<div class="gc-fh" id="gcFEst"></div><div class="gc-fh" id="gcFTipo"></div><div class="gc-fh" id="gcFCiu"></div>' +
      '<button type="submit" class="naowee-btn naowee-btn--loud gc-btn gc-btn--q" id="gcGo">Consultar</button>' +
      '<button type="button" class="gs-reset gc-reset" id="gcFReset" aria-label="Reiniciar filtros" title="Reiniciar filtros">' + RESET + '</button></form>' +
      '<div class="gt-tip" role="tooltip" id="gcTip" hidden><strong>Cómo buscar</strong><p>Por documento, escríbelo completo (mínimo 6 dígitos).</p><p>Por nombre, escribe al menos tres letras.</p>' +
      '<p>Los menores de edad no aparecen al buscar por nombre: solo se consultan por documento completo y con un motivo.</p></div>' +
      '</section>' +
            '<div id="gcOut" class="gc-out" aria-live="polite"></div></div>';
    var inp = d.getElementById('gcQ'), out = d.getElementById('gcOut'), form = d.getElementById('gcForm'), go = d.getElementById('gcGo'), tbtn = d.getElementById('gcTryBtn'), tlist = d.getElementById('gcTryList');

    var veil = d.getElementById('gcVeil'), vcard = veil.nextElementSibling, vsc = view.closest('.main-scroll');
    function velo() {
      if (!d.getElementById('gcVeil')) return vsc && vsc.removeEventListener('scroll', velo), w.removeEventListener('resize', velo);
      var sr = vsc.getBoundingClientRect(), cr = vcard.getBoundingClientRect(), pr = veil.parentNode.getBoundingClientRect();
      veil.style.setProperty('--gc-vx', (sr.left - pr.left) + 'px');
      veil.style.setProperty('--gc-vw', vsc.clientWidth + 'px');
      veil.style.setProperty('--gc-vh', (cr.bottom - sr.top) + 'px');
      veil.classList.toggle('is-stuck', vsc.scrollTop > 0 && cr.top - sr.top <= 17);
    }
    if (vsc) { vsc.addEventListener('scroll', velo, { passive: true }); w.addEventListener('resize', velo); velo(); }

    var pend = Object.assign({}, st.f); /* los filtros se aplican al pulsar Consultar */
    function filtros() {
      var all = personas(), ciu = all.map(function (p) { return p.ciudad; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).sort(function (a, b) { return a.localeCompare(b, 'es'); }),
        tipos = all.map(function (p) { return p.tipo; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).sort();
      function pick(host, id, label, pre, k, items) {
        GI.selectGrafico({ host: d.getElementById(host), id: id, label: label, prefijo: pre, value: pend[k], items: items, onPick: function (v) { pend[k] = v; } });
      }
      pick('gcFEst', 'gcSEst', 'Filtrar por estado de la medida', 'Estado', 'est', opts(['Vigente', 'Cumplida', 'En validación'], 'Todos'));
      pick('gcFTipo', 'gcSTipo', 'Filtrar por tipo de documento', 'Tipo', 'tipo', opts(tipos, 'Todos'));
      pick('gcFCiu', 'gcSCiu', 'Filtrar por ciudad', 'Ciudad', 'ciu', opts(ciu, 'Todas'));
    }
    d.getElementById('gcFReset').addEventListener('click', function () { pend = { est: '', tipo: '', ciu: '' }; st.f = Object.assign({}, pend); st.rec = 1; st.page = 1; filtros(); paint(false); });
    function paint(enfoque) {
      var b, html = '', det = null;
      pgCfg = null;
      try { b = buscar(st.cq); } catch (e) { b = { modo: 'error', res: [] }; }
      if (b.modo === 'vacio') html = recientesHtml();
      else if (b.modo === 'error') html = vacio('No pudimos completar la consulta', 'Hubo un problema al leer la información. Intenta de nuevo.', '<button type="button" class="naowee-btn naowee-btn--loud gc-btn" data-retry>Reintentar</button>', 'gc-empty--error');
      else if (b.modo === 'invalido') html = vacio('Hay caracteres que no se pueden buscar', 'Usa solo letras, números, puntos y guiones.', '', 'gc-empty--error');
      else if (b.modo === 'corto') html = vacio('Falta información para buscar', 'El documento debe ir completo (mínimo 6 dígitos) y el nombre, con al menos tres letras.');
      else if (!b.res.length) html = vacio('Sin medidas registradas', (b.modo === 'doc' ? 'No hay medidas para ese documento.' : 'No hay coincidencias por nombre.') +
        (b.ocultos ? ' Hay ' + b.ocultos + (b.ocultos === 1 ? ' registro reservado' : ' registros reservados') + ' de menores: consúltalos por documento completo.' : ''));
      else {
        html = listaHtml(b);
        if (b.ocultos) html += '<p class="gc-count">Hay ' + b.ocultos + (b.ocultos === 1 ? ' registro reservado' : ' registros reservados') + ' de menores: consúltalos por documento completo.</p>';
      }
      if (st.sel) det = personas().filter(function (p) { return keyOf(p) === st.sel; })[0] || null;
      out.innerHTML = html;
      if (pgCfg) { var c = pgCfg; c.onPage = function (p) { if (c.k === 'rec') st.rec = p; else st.page = p; paint(false); var k = out.querySelector('.gt-pag [aria-current]'); if (k) k.focus(); }; ligaPag(); }
      if (det) { clearTimeout(tp); panelPersona(det); GI.panel.sincronizar(); }
      else { st.sel = ''; if (GI.panel.abierto()) GI.panel.cerrar('api'); }
      var el = enfoque && !det && out.querySelector('.gc-count'); if (el) el.focus();
      var rt = out.querySelector('[data-retry]');
      if (rt) rt.addEventListener('click', function () { paint(true); });
    }

    filtros();
    /* El paginador se vuelve a armar tras repintar o restaurar el HTML guardado (los eventos no sobreviven a innerHTML). */
    function ligaPag() { var nav = out.querySelector('[data-pag]'); if (nav && pgCfg) GI.pager(nav, pgCfg); }
    /* Elegir una fila abre el panel derecho con su loader de 1 s; la lista y el buscador quedan debajo (DC-061). */
    GI.filasClicables(out, function (id, tr) {
      var p = personas().filter(function (x) { return keyOf(x) === id; })[0]; if (!p) return;
      clearTimeout(tp); st.sel = id; panelPersona(p, tr, true); GI.panel.sincronizar();
      tp = setTimeout(function () { if (st.sel === id && out.isConnected) { panelPersona(p); GI.panel.sincronizar(); } }, ESPERA);
    });

    /* La consulta tarda 1 s fijo: el loader ocupa el lugar de los resultados (tabla o ficha). Sin datos válidos responde al instante. */
    var ESPERA = 1000, tm = 0, salvado = '', prev = null;
    /* Estado previo a la consulta: si se cancela al escribir, el HTML restaurado y el estado vuelven juntos. */
    function snap() { if (!tm) prev = { cq: st.cq, page: st.page, sel: st.sel }; }
    function ocupado(si) {
      form.setAttribute('aria-busy', String(si)); form.classList.toggle('is-busy', si);
      go.textContent = si ? 'Consultando…' : 'Consultar';
    }
    function detener() {
      if (!tm) return;
      clearTimeout(tm); tm = 0; ocupado(false); out.removeAttribute('aria-busy'); out.innerHTML = salvado; ligaPag();
    }
    function cargar(forma, fin) {
      clearTimeout(tm);
      if (!tm) salvado = out.innerHTML;
      ocupado(true); out.setAttribute('aria-busy', 'true');
      out.innerHTML = SUID.load.fragmento(forma);
      tm = setTimeout(function () {
        tm = 0; if (!out.isConnected) return;
        ocupado(false); out.removeAttribute('aria-busy'); fin();
      }, ESPERA);
    }
    function consultar(q, enfoque) {
      snap();
      clearTimeout(tp); if (GI.panel.abierto()) GI.panel.cerrar('api');
      inp.value = miles(q); st.q = st.cq = q; st.page = 1; st.sel = '';
      var b; try { b = buscar(q); } catch (e) { b = { modo: 'error', res: [] }; }
      if (b.modo === 'corto' || b.modo === 'invalido') { detener(); paint(enfoque); return; }
      if (out.contains(d.activeElement)) inp.focus({ preventScroll: true }); /* el reciente pulsado desaparece mientras se consulta */
      cargar('resultados', function () { if (b.res.length === 1) st.sel = keyOf(b.res[0]); paint(enfoque); });
    }

    /* Tooltip de «Cómo buscar» (DC-298): mismo patrón del ⓘ de los insights; hover/foco lo muestran, el clic lo fija y Esc lo cierra. */
    var ibtn = d.getElementById('gcInfo'), itip = d.getElementById('gcTip');
    function infoOff() { itip.hidden = true; ibtn.setAttribute('aria-expanded', 'false'); ibtn.removeAttribute('data-pin'); }
    function infoOn() {
      itip.hidden = false; ibtn.setAttribute('aria-expanded', 'true');
      var r = ibtn.getBoundingClientRect(), tw = itip.offsetWidth, th = itip.offsetHeight, top = r.bottom + 4;
      if (top + th > w.innerHeight - 8) top = Math.max(8, r.top - th - 4);
      itip.style.left = Math.max(8, Math.min(r.right - tw, w.innerWidth - tw - 8)) + 'px'; itip.style.top = top + 'px';
    }
    ibtn.addEventListener('mouseenter', infoOn);
    ibtn.addEventListener('mouseleave', function () { if (!ibtn.hasAttribute('data-pin')) infoOff(); });
    ibtn.addEventListener('focus', infoOn);
    ibtn.addEventListener('blur', function () { if (!ibtn.hasAttribute('data-pin')) infoOff(); });
    ibtn.addEventListener('click', function (e) { e.stopPropagation(); if (ibtn.hasAttribute('data-pin')) infoOff(); else { infoOn(); ibtn.setAttribute('data-pin', '1'); } });
    d.addEventListener('keydown', function esc1(e) {
      if (!d.getElementById('gcInfo')) return d.removeEventListener('keydown', esc1);
      if (e.key === 'Escape' && !itip.hidden) { infoOff(); ibtn.focus(); }
    });
    d.addEventListener('click', function fuera1(e) {
      if (!d.getElementById('gcInfo')) return d.removeEventListener('click', fuera1);
      if (!itip.hidden && !e.target.closest('#gcTip')) infoOff();
    });
    w.addEventListener('resize', infoOff);

    function pedirMotivo(p) {
      var mot = '';
      var m = UI.modal({ title: 'Abrir datos de un menor', sub: p.tipo + ' ' + p.texto,
        body: '<p class="gi-p">Estos datos tienen reserva reforzada. Indica para qué los necesitas; la apertura queda registrada con tu usuario, la fecha y la hora.</p>' +
          '<div class="gs-field"><span class="gs-field__l gs-field__l--req" id="gcMotL">Motivo (puedes elegir varios)</span>' +
          '<div class="gc-mchips" id="gcMot" role="group" aria-labelledby="gcMotL">' + MOTIVOS.map(function (x) { return '<button type="button" class="gc-mchip" aria-pressed="false">' + esc(x) + '</button>'; }).join('') + '</div></div>' +
          '<p class="gi-err" id="gcErr" hidden>Selecciona al menos un motivo para continuar.</p>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button class="naowee-btn naowee-btn--loud" id="gcOk">Abrir datos</button>' });
      m.el.querySelector('#gcMot').addEventListener('click', function (e) {
        var b = e.target.closest('.gc-mchip'); if (!b) return;
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
        mot = [].map.call(m.el.querySelectorAll('.gc-mchip[aria-pressed="true"]'), function (x) { return x.textContent; }).join(' · ');
        if (mot) m.el.querySelector('#gcErr').hidden = true;
      });
      m.el.querySelector('#gcOk').addEventListener('click', function () {
        if (!mot) { m.el.querySelector('#gcErr').hidden = false; return; }
        st.abiertos[keyOf(p)] = { motivo: mot };
        m.close(); UI.toast('Apertura registrada en la auditoría.'); paint(true);
      });
    }
    pedir = pedirMotivo;

    /* Casos de ejemplo: «+» dentro del input; al abrir salen a su izquierda como badges negros. */
    function ejemplos(abrir) {
      tlist.hidden = !abrir; tbtn.setAttribute('aria-expanded', String(abrir)); tbtn.classList.toggle('is-open', abrir);
    }
    tbtn.addEventListener('click', function () { ejemplos(tlist.hidden); });
    d.getElementById('gcForm').addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !tlist.hidden) { e.preventDefault(); ejemplos(false); tbtn.focus(); }
    });
    tlist.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (b) { ejemplos(false); consultar(b.getAttribute('data-q'), false); inp.focus(); }
    });
    d.addEventListener('click', function fuera(e) {
      if (!d.getElementById('gcTryBtn')) return d.removeEventListener('click', fuera);
      if (!tlist.hidden && !e.target.closest('.gc-try')) ejemplos(false);
    });

    d.getElementById('gcForm').addEventListener('submit', function (e) { e.preventDefault(); st.f = Object.assign({}, pend); st.rec = 1; st.page = 1; ejemplos(false); consultar(inp.value, true); });
    /* Escribir no consulta: cancela la que corre y, con el campo vacío, vuelve a Recientes. */
    inp.addEventListener('input', function () {
      var pos = inp.selectionStart, antes = digitos(inp.value.slice(0, pos == null ? 0 : pos)).length, f = miles(inp.value);
      if (f !== inp.value) {
        inp.value = f;
        if (pos != null && d.activeElement === inp) { var k = 0, n = 0; while (k < f.length && n < antes) { if (/\d/.test(f[k])) n++; k++; } inp.setSelectionRange(k, k); }
      }
      st.q = inp.value;
      if (tm && prev) { st.cq = prev.cq; st.page = prev.page; st.sel = prev.sel; }
      detener();
      if (!st.q.trim() && st.cq) { st.cq = ''; st.page = 1; st.sel = ''; paint(false); }
    });
    paint(false);
  }

})(window, document);
