/* Consulta de infractores: ¿esta persona tiene una medida vigente y hasta cuándo? Menores solo por documento completo. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, C = GI.cat, UI = w.GIUI, esc = SUID.esc;
  var BASE = UI.BASE, PAGINA = 5;
  var st = { q: '', cq: '', abiertos: {}, page: 1, sel: '' }; /* q: lo escrito; cq: lo consultado; abiertos: menores abiertos con motivo; sel: persona elegida */
  var MOTIVOS = ['Verificar una medida vigente antes de permitir el ingreso', 'Requerimiento de una autoridad', 'Trámite de un recurso o una solicitud de la persona', 'Auditoría interna'];
  var CASOS = [{ t: 'Ramírez', q: 'Ramírez' }, { t: '71.894.4471', q: '71.894.4471' }, { t: 'Documento de un menor', q: '1020200003' }];
  var CORTA = ['Armas u objetos peligrosos', 'Estupefacientes', 'Violencia contra la fuerza pública', 'Invasión del terreno de juego', 'No atender a logística', 'Bebidas alcohólicas', 'Agresión física', 'Agresión verbal', 'Daño a infraestructura'];
  var ART = { fisica: ['Art. 98', 6], verbal: ['Art. 98', 7], alcohol: ['Art. 97', 5], armas: ['Art. 97', 0], drogas: ['Art. 97', 1], campo: ['Art. 97', 3], danio: ['Art. 98', 8] };

  /* Personas del SVN que no están en la base del IVC de la demo, para que la consulta sea coherente con ese prototipo.
     [id, resolución, conducta, ejecutoria, meses]; los menores van solo con iniciales. */
  function M(id, res, c, ejec, meses) { return { id: id, acto: 'Resolución ' + res, c: c, ejec: ejec, meses: meses }; }
  var EXTRA = [
    { tipo: 'CC', numId: '718944471', nombre: 'Julián Andrés Posada', ciudad: 'Medellín', medidas: [M('MC-2025-0831', '0457 de 2025', 'fisica', '2025-11-30', 18), M('MC-2025-0214', '0098 de 2025', 'alcohol', '2025-03-02', 6)] },
    { tipo: 'CC', numId: '1045223871', nombre: 'Carlos Eduardo Ramírez Soto', ciudad: 'Barranquilla', medidas: [M('MC-2026-0412', '0612 de 2026', 'fisica', '2026-04-05', 6), M('MC-2025-0377', '0301 de 2025', 'alcohol', '2025-02-10', 6)] },
    { tipo: 'CC', numId: '43871022', nombre: 'Luz Marina Ramírez Gil', ciudad: 'Medellín', medidas: [M('MC-2026-0733', '0733 de 2026', 'alcohol', '2026-08-12', 12)] },
    { tipo: 'CC', numId: '1143267894', nombre: 'Jhon Alexander Ramírez Mora', ciudad: 'Cali', medidas: [M('MC-2026-0188', '0211 de 2026', 'campo', '2026-01-20', 24)] },
    { tipo: 'CC', numId: '52987431', nombre: 'Sandra Milena Ramírez Torres', ciudad: 'Bogotá D.C.', medidas: [M('MC-2025-0902', '0510 de 2025', 'verbal', '2025-09-10', 12)] },
    { tipo: 'CC', numId: '1098765432', nombre: 'Wilmer Ramírez Peña', ciudad: 'Bucaramanga', medidas: [M('MC-2026-0540', '0388 de 2026', 'danio', '2026-05-20', 8)] },
    { tipo: 'CC', numId: '1032456789', nombre: 'Diana Carolina Ramírez Ortega', ciudad: 'Bogotá D.C.', medidas: [M('MC-2025-1104', '0642 de 2025', 'fisica', '2025-12-01', 18), M('MC-2024-0291', '0177 de 2024', 'verbal', '2024-02-15', 6)] },
    { tipo: 'CE', numId: '7050021', nombre: 'Fabián Ramírez Cortés', ciudad: 'Cartagena de Indias', medidas: [M('MC-2026-0661', '0455 de 2026', 'armas', '2026-07-02', 36)] },
    { tipo: 'CC', numId: '1152230981', nombre: 'Natalia Ramírez Duque', ciudad: 'Pereira', medidas: [M('MC-2024-0119', '0093 de 2024', 'drogas', '2024-05-15', 12)] },
    { tipo: 'CC', numId: '79456123', nombre: 'Héctor Ramírez Salgado', ciudad: 'Valledupar', medidas: [M('MC-2026-0245', '0266 de 2026', 'fisica', '2026-03-02', 7)] },
    { tipo: 'CC', numId: '1020987654', nombre: 'Mónica Ramírez Vélez', ciudad: 'Manizales', medidas: [M('MC-2026-0150', '0172 de 2026', 'campo', '2026-02-14', 24), M('MC-2026-0498', '0359 de 2026', 'alcohol', '2026-06-01', 12)] },
    { tipo: 'CC', numId: '88123456', nombre: 'Éver Ramírez Pinto', ciudad: 'Cúcuta', medidas: [M('MC-2025-0988', '0577 de 2025', 'verbal', '2025-11-05', 10)] },
    { tipo: 'TI', numId: '1109876543', nombre: 'S. Ramírez R.', ciudad: 'Cali', menor: true, medidas: [M('MC-2026-0467', '0371 de 2026', 'alcohol', '2026-06-10', 6)] }
  ];

  function abrev(t) { var m = /\(([^)]+)\)/.exec(t || ''); return m ? m[1] : (t || ''); }
  function dias(n) { return GI.fmtDias ? GI.fmtDias(n) : n + ' días'; }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }
  function sinTildes(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function keyOf(p) { return p.tipo + ':' + p.numId; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }

  function medidaDe(m, e) {
    var fin = U.addMonths(U.addDays(m.ejec, 1), +m.meses), hoy = U.today(), a = ART[m.c];
    return { id: m.id, acto: m.acto, art: a[0], corta: CORTA[a[1]], full: C.origen[a[1]].replace(/^(\d+\.|[a-c]\)) /, ''), mas: 0, autoridad: 'Inspección de Policía de ' + e.ciudad,
      ini: U.addDays(m.ejec, 1), fin: fin, estado: hoy > fin ? 'Cumplida' : 'Vigente', dias: Math.round((U.parse(fin) - U.parse(hoy)) / 86400000), href: '', enTramite: false };
  }

  /* Agrupa los registros de la base por persona (tipo + número de documento). */
  function personas() {
    var map = {}, out = [];
    GI.all().forEach(function (r) {
      var key = abrev(r.tipoId) + ':' + r.numId, p = map[key];
      if (!p) { p = map[key] = { tipo: abrev(r.tipoId), numId: r.numId, texto: GI.fmtDoc(r.tipoId, r.numId), nombre: D.nombreCompleto(r), menor: false, medidas: [] }; out.push(p); }
      if (D.esMenor(r)) p.menor = true;
      var res = D.estadoRestriccion(r), fin = D.finVigencia(r), i0 = r.origen[0];
      p.medidas.push({ id: r.id, acto: r.numActo, art: (/Art\. \d+/.exec(C.origen[i0]) || [''])[0], corta: CORTA[i0] || '', full: r.origen.map(function (i) { return C.origen[i].replace(/^(\d+\.|[a-c]\) )/, ''); }).join('\n'),
        mas: r.origen.length - 1, autoridad: 'Inspección de Policía de ' + (r.ciudadHechos || r.ciudad), ini: r.fechaEjecutoria ? U.addDays(r.fechaEjecutoria, 1) : '', fin: fin, dias: D.diasRestantes(r), href: BASE + '/' + r.id,
        estado: res === 'Activa' ? 'Vigente' : res === 'Cumplida' ? 'Cumplida' : 'En validación', enTramite: res === 'Inactiva' });
    });
    EXTRA.forEach(function (e) {
      out.push({ tipo: e.tipo, numId: e.numId, texto: GI.fmtDoc(e.tipo, e.numId), nombre: e.nombre, menor: !!e.menor, medidas: e.medidas.map(function (m) { return medidaDe(m, e); }) });
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
  function quien(p) { return p.menor && !st.abiertos[keyOf(p)] ? 'Persona menor de edad' : p.nombre; }

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
    return { modo: 'nombre', res: hit.filter(function (p) { return !p.menor; }).sort(porUrgencia), ocultos: hit.filter(function (p) { return p.menor; }).length };
  }

  /* Medida compacta: una grilla de seis datos con etiqueta, sin huecos. */
  function celda(l, v) { return '<div class="gc-med__c"><span class="gc-med__l">' + l + '</span><span class="gc-med__v">' + v + '</span></div>'; }
  function medidasHtml(p) {
    return '<div class="gc-meds">' + p.medidas.slice().sort(function (a, b) { return a.fin < b.fin ? 1 : -1; }).map(function (m) {
      var vig = m.fin ? (m.estado === 'Cumplida' ? 'Terminó el ' + U.fmt(m.fin) : 'Hasta el ' + U.fmt(m.fin) + (m.estado === 'Vigente' ? '<br><strong>' + esc(dias(m.dias)) + '</strong>' : '')) : '—';
      return '<div class="gc-med">' +
        celda('Radicado', '<span class="gc-med__id">' + esc(m.id) + '</span>' + (m.href ? '<a href="' + m.href + '">Ver expediente</a>' : '')) +
        celda('Resolución', esc(m.acto || '—')) +
        celda('Artículo', '<span class="gc-med__art" title="' + esc(m.full) + '">' + tag(m.art || '—') + (m.mas > 0 ? tag('+' + m.mas) : '') + '<span>' + esc(m.corta || 'Sin conducta registrada') + '</span></span>') +
        celda('Estado', estadoBadge(m.estado)) +
        celda('Vigencia', vig) +
        celda('Autoridad', esc(m.autoridad)) + '</div>';
    }).join('') + '</div>';
  }

  function detalleHtml(p, i, volver) {
    var r = p.res, key = keyOf(p), back = volver ? '<button type="button" class="gc-back" data-back>' + UI.svg('back') + ' Volver a los resultados</button>' : '';
    if (p.menor && !st.abiertos[key]) {
      return back + '<article class="gc-person"><div class="gc-person__head"><div><h2 class="gc-person__name" tabindex="-1">Persona menor de edad</h2>' +
        '<p class="gc-person__doc">' + esc(p.tipo) + ' ' + esc(p.texto) + ' · datos reservados</p></div>' +
        '<div class="gc-state">' + estadoBadge(r.estado) + '</div></div>' +
        '<div class="gc-lock"><p><strong>Reserva reforzada.</strong> El nombre y el detalle de la medida solo se abren con un motivo, y la apertura queda auditada.</p>' +
        '<button type="button" class="naowee-btn naowee-btn--loud gc-btn" data-open="' + i + '">Abrir con motivo</button></div></article>';
    }
    var aud = p.menor ? '<div class="gc-audit">Apertura auditada · ' + esc(st.abiertos[key].motivo) + ' · ' + esc(SUID.user.name) + ' · ' + U.fmt(U.now().fecha) + ' ' + U.now().hora + '</div>' : '';
    return back + '<article class="gc-person"><div class="gc-person__head"><div><h2 class="gc-person__name" tabindex="-1">' + esc(p.nombre) + (p.menor ? ' ' + badge('neutral', 'Menor de edad') : '') + '</h2>' +
      '<p class="gc-person__doc">' + esc(p.tipo) + ' ' + esc(p.texto) + ' · ' + plural(p.medidas.length, 'medida', 'medidas') + '</p></div>' +
      '<div class="gc-state">' + estadoBadge(r.estado) + '<small>' + (r.estado === 'Vigente' ? 'Vigente hasta el ' + U.fmt(r.fin) + ' · ' + dias(r.dias) : r.estado === 'Cumplida' ? 'Terminó el ' + U.fmt(r.fin) : 'Aún sin efecto') + '</small></div></div>' +
      medidasHtml(p) + aud + '</article>';
  }

  /* Lista de personas: resumen en una fila; el detalle se abre al elegir. */
  function filaPersona(p, k) {
    var r = p.res;
    return '<li><button type="button" class="gc-row" data-sel="' + esc(k) + '"><span class="gc-row__who"><strong>' + esc(p.nombre) + '</strong><small>' + esc(p.tipo) + ' ' + esc(p.texto) + '</small></span>' +
      '<span class="gc-row__n">' + plural(p.medidas.length, 'medida', 'medidas') + '</span>' +
      '<span class="gc-row__st">' + estadoBadge(r.estado) + '<small>' + esc(r.estado === 'Vigente' ? dias(r.dias) + ' · hasta ' + U.fmt(r.fin) : vigencia(r)) + '</small></span>' +
      '<span class="gc-row__go" aria-hidden="true">' + SUID.icons.chevR + '</span></button></li>';
  }
  function listaHtml(b) {
    var n = b.res.length, pags = Math.ceil(n / PAGINA), pg = Math.min(Math.max(st.page, 1), pags), ini = (pg - 1) * PAGINA, fin = Math.min(ini + PAGINA, n);
    st.page = pg;
    return '<p class="gc-count" tabindex="-1">' + plural(n, 'persona encontrada', 'personas encontradas') + ' · de mayor a menor urgencia' + (b.ocultos ? ' · ' + b.ocultos + (b.ocultos === 1 ? ' menor no se lista' : ' menores no se listan') + ' por nombre' : '') + '</p>' +
      '<ul class="gc-people">' + b.res.slice(ini, fin).map(function (p) { return filaPersona(p, keyOf(p)); }).join('') + '</ul>' +
      (pags > 1 ? '<nav class="gc-pager" aria-label="Paginación de resultados"><span class="gc-pager__t">' + (ini + 1) + '–' + fin + ' de ' + n + '</span>' +
        '<button type="button" class="naowee-btn naowee-btn--mute gc-btn" data-pg="-1"' + (pg === 1 ? ' disabled' : '') + '>Anterior</button>' +
        '<button type="button" class="naowee-btn naowee-btn--mute gc-btn" data-pg="1"' + (pg === pags ? ' disabled' : '') + '>Siguiente</button></nav>' : '');
  }

  /* Recientes: llena el alto libre con las personas más urgentes; lo que no cabe se oculta en fit(). */
  function recientesHtml() {
    var ps = personas().sort(porUrgencia).slice(0, 14);
    return '<section class="gc-recent" aria-labelledby="gcRecT"><header class="gc-recent__head"><h2 id="gcRecT">Recientes</h2><span id="gcRecN"></span></header>' +
      '<ul class="gc-recent__list" id="gcRecL">' + ps.map(function (p) {
        var r = p.res, m = r.m;
        return '<li><button type="button" class="gc-rec" data-doc="' + esc(p.numId) + '"><span class="gc-row__who"><strong>' + esc(quien(p)) + '</strong><small>' + esc(p.menor && !st.abiertos[keyOf(p)] ? enmascarar(p) : p.tipo + ' ' + p.texto) + '</small></span>' +
          '<span class="gc-rec__cond">' + tag(m.art || '—') + '<span>' + esc(m.corta) + '</span><small>' + esc(m.id) + '</small></span>' +
          '<span class="gc-row__st">' + estadoBadge(r.estado) + '<small>' + esc(vigencia(r)) + '</small></span>' +
          '<span class="gc-row__go" aria-hidden="true">' + SUID.icons.chevR + '</span></button></li>';
      }).join('') + '</ul></section>';
  }
  function fit() {
    var l = d.getElementById('gcRecL'), n = d.getElementById('gcRecN');
    if (!l) return;
    var items = [].slice.call(l.children), vis = 0;
    items.forEach(function (li) { li.hidden = false; });
    if (w.innerWidth <= 700) { items.forEach(function (li, i) { li.hidden = i >= 6; }); if (n) n.textContent = 'Por urgencia · 6 de ' + items.length; return; } /* en móvil la página corre */
    var tope = l.getBoundingClientRect().bottom;
    items.forEach(function (li) { if (li.getBoundingClientRect().bottom <= tope + 1) vis++; else li.hidden = true; });
    if (n) n.textContent = 'Por urgencia · ' + vis + ' de ' + items.length;
  }

  /* Recorrido de la consulta (DC-300): 5 sistemas, 1,5 s en total; nunca lleva nombres, para no revelar a un menor. */
  function recorrido(b) {
    var n = b.res.length, doc = b.modo === 'doc', hay = n > 0, de = doc ? 'Documento' : 'Nombre';
    var tram = b.res.some(function (p) { return p.medidas.some(function (m) { return m.enTramite; }); });
    var actos = b.res.some(function (p) { return p.medidas.some(function (m) { return m.estado !== 'En validación'; }); });
    function ok(v) { return v ? 'ok' : 'vacio'; }
    if (b.modo === 'error') {
      var f = [['Base de infractores del IVC', 'IVC', 'No se pudo leer la base de medidas', 350], ['Registraduría · ANI', 'ANI', 'Validando la identidad…', 300], ['Reportes de entidades deportivas', 'ENT', 'Revisando solicitudes pendientes…', 250],
        ['Autoridades de policía', 'POL', 'Buscando actos y medidas notificadas…', 350], ['Decisión', 'SUID', 'Armando el resultado…', 250]];
      return { pasos: f.map(function (x, i) { return { n: x[0], sigla: x[1], texto: x[2], baja: 'Documento', sube: i ? '' : 'Error', ms: x[3], r: i ? 'vacio' : 'falla' }; }) };
    }
    return { pasos: [
      { n: 'Base de infractores del IVC', sigla: 'IVC', texto: doc ? 'Buscando el documento en la base de medidas…' : 'Buscando el nombre en la base de medidas…', baja: de, sube: hay ? plural(n, 'registro', 'registros') : 'Sin registros', ms: 350, r: ok(hay) },
      { n: 'Registraduría · ANI', sigla: 'ANI', texto: 'Validando la identidad…', baja: de, sube: hay ? 'Identidad válida' : 'Sin coincidencia', ms: 300, r: ok(hay) },
      { n: 'Reportes de entidades deportivas', sigla: 'ENT', texto: 'Revisando solicitudes pendientes…', baja: de, sube: tram ? 'Solicitud en trámite' : 'Sin pendientes', ms: 250, r: ok(tram) },
      { n: 'Autoridades de policía', sigla: 'POL', texto: 'Buscando actos y medidas notificadas…', baja: de, sube: actos ? 'Medidas notificadas' : 'Sin notificaciones', ms: 350, r: ok(actos) },
      { n: 'Decisión', sigla: 'SUID', texto: 'Armando el resultado…', baja: 'Historial', sube: hay ? 'Resultado listo' : 'No hay medidas', ms: 250, r: ok(hay) }
    ] };
  }

  var INFO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg>';

  function vacio(titulo, texto, extra, cls) {
    return '<div class="gc-empty' + (cls ? ' ' + cls : '') + '"' + (cls ? ' role="alert"' : '') + '><strong>' + titulo + '</strong>' + texto + (extra || '') + '</div>';
  }

  var onResize = null;
  function open(view, ctx) {
    st.q = st.cq;
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Búsqueda' }];
    view.innerHTML = '<div class="page-inner gi-page gc-page">' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">Consulta de infractores</h1>' +
      '<p class="page-subtitle">Verifica si una persona tiene una medida vigente y hasta cuándo.</p></div></header>' +
      '<section class="gc-card"><form class="gc-form" id="gcForm" role="search">' +
      '<div class="gc-field">' + UI.svg('search') + '<input id="gcQ" type="search" autocomplete="off" aria-label="Documento completo o nombre" placeholder="Documento o nombre" value="' + esc(st.cq) + '">' +
      '<div class="gc-try"><div class="gc-try__list" id="gcTryList" role="group" aria-label="Casos de ejemplo" hidden>' +
      CASOS.map(function (c) { return '<button type="button" class="gc-case" data-q="' + esc(c.q) + '"><span>' + esc(c.t) + '</span></button>'; }).join('') + '</div>' +
      '<button type="button" class="gc-try__btn" id="gcTryBtn" aria-expanded="false" aria-controls="gcTryList" aria-label="Probar con un caso de ejemplo" title="Casos de ejemplo">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div></div>' +
      '<button type="button" class="gt-info gc-info" id="gcInfo" aria-label="Cómo buscar" aria-describedby="gcTip" aria-expanded="false">' + INFO + '</button>' +
      '<button type="submit" class="naowee-btn naowee-btn--loud gc-btn gc-btn--q" id="gcGo">Consultar</button></form>' +
      '<div class="gt-tip" role="tooltip" id="gcTip" hidden><strong>Cómo buscar</strong><p>Por documento, escríbelo completo (mínimo 6 dígitos).</p><p>Por nombre, escribe al menos tres letras.</p>' +
      '<p>Los menores de edad no aparecen al buscar por nombre: solo se consultan por documento completo y con un motivo.</p></div>' +
      '<div class="gk-vel" role="group" aria-label="Velocidad de la consulta simulada"><span class="gk-vel__l">Velocidad de la consulta</span><div class="gi-seg">' +
      '<button type="button" class="gi-seg__b" data-vel="real" aria-pressed="' + (GICapa.vel() === 'real') + '">Tiempo real</button>' +
      '<button type="button" class="gi-seg__b" data-vel="slow" aria-pressed="' + (GICapa.vel() === 'slow') + '">Slow motion</button></div></div></section>' +
      '<div id="gcCapa" class="gk-wrap"></div>' +
      '<div id="gcOut" class="gc-out" aria-live="polite"></div></div>';
    var inp = d.getElementById('gcQ'), out = d.getElementById('gcOut'), form = d.getElementById('gcForm'), go = d.getElementById('gcGo'), capa = GICapa.crear(d.getElementById('gcCapa')), tbtn = d.getElementById('gcTryBtn'), tlist = d.getElementById('gcTryList');

    function paint(enfoque) {
      var b, html = '', det = null, vol = false;
      try { b = buscar(st.cq); } catch (e) { b = { modo: 'error', res: [] }; }
      if (b.modo === 'vacio') html = recientesHtml();
      else if (b.modo === 'error') html = vacio('No pudimos completar la consulta', 'Hubo un problema al leer la información. Intenta de nuevo.', '<button type="button" class="naowee-btn naowee-btn--loud gc-btn" data-retry>Reintentar</button>', 'gc-empty--error');
      else if (b.modo === 'invalido') html = vacio('Hay caracteres que no se pueden buscar', 'Usa solo letras, números, puntos y guiones.', '', 'gc-empty--error');
      else if (b.modo === 'corto') html = vacio('Falta información para buscar', 'El documento debe ir completo (mínimo 6 dígitos) y el nombre, con al menos tres letras.');
      else if (!b.res.length) html = vacio('Sin medidas registradas', (b.modo === 'doc' ? 'No hay medidas para ese documento.' : 'No hay coincidencias por nombre.') +
        (b.ocultos ? ' Hay ' + b.ocultos + (b.ocultos === 1 ? ' registro reservado' : ' registros reservados') + ' de menores: consúltalos por documento completo.' : ''));
      else {
        if (b.res.length === 1) det = b.res[0];
        else if (st.sel) { det = b.res.filter(function (p) { return keyOf(p) === st.sel; })[0] || null; vol = !!det; if (!det) st.sel = ''; }
        html = det ? detalleHtml(det, 0, vol) : listaHtml(b);
        if (det && b.ocultos) html += '<p class="gc-count">Hay ' + b.ocultos + (b.ocultos === 1 ? ' registro reservado' : ' registros reservados') + ' de menores: consúltalos por documento completo.</p>';
      }
      out.innerHTML = html;
      view.firstChild.classList.toggle('gc-page--fill', b.modo === 'vacio'); /* en Recientes la página mide el alto libre */
      var cual = enfoque && (det ? '.gc-person__name' : '.gc-count');
      if (cual) { var el = out.querySelector(cual); if (el) el.focus(); }
      var ab = out.querySelector('[data-open]');
      if (ab) ab.addEventListener('click', function () { pedirMotivo(det); });
      var rt = out.querySelector('[data-retry]');
      if (rt) rt.addEventListener('click', function () { paint(true); });
      if (b.modo === 'vacio') fit();
    }

    out.addEventListener('click', function (e) {
      var t = e.target.closest('[data-sel],[data-pg],[data-back],[data-doc]');
      if (!t) return;
      if (t.hasAttribute('data-sel')) { st.sel = t.getAttribute('data-sel'); paint(true); }
      else if (t.hasAttribute('data-pg')) { st.page += +t.getAttribute('data-pg'); paint(true); }
      else if (t.hasAttribute('data-back')) { st.sel = ''; paint(true); }
      else if (t.hasAttribute('data-doc')) { var p = personas().filter(function (x) { return x.numId === t.getAttribute('data-doc'); })[0]; consultar(GI.fmtDoc(p.tipo, p.numId), true); }
    });

    /* La consulta simula 1,5 s (DC-299) mostrando el recorrido (DC-300); sin datos válidos no hay nada que consultar y responde al instante. */
    function ocupado(si) {
      form.setAttribute('aria-busy', String(si)); form.classList.toggle('is-busy', si);
      go.textContent = si ? 'Consultando…' : 'Consultar';
    }
    function detener() { capa.cancelar(); ocupado(false); out.hidden = false; }
    function consultar(q, enfoque) {
      inp.value = st.q = st.cq = q; st.page = 1; st.sel = '';
      var b; try { b = buscar(q); } catch (e) { b = { modo: 'error', res: [] }; }
      if (b.modo === 'vacio' || b.modo === 'corto' || b.modo === 'invalido') { detener(); paint(enfoque); return; }
      if (out.contains(d.activeElement)) inp.focus({ preventScroll: true }); /* el reciente pulsado desaparece mientras se consulta */
      out.hidden = true; ocupado(true); view.firstChild.classList.remove('gc-page--fill');
      capa.correr(recorrido(b), function () {
        if (!out.isConnected) return;
        out.hidden = false; ocupado(false); paint(enfoque);
      });
    }
    form.parentNode.querySelector('.gk-vel').addEventListener('click', function (e) {
      var v = e.target.closest('[data-vel]'); if (!v) return;
      capa.setVel(v.getAttribute('data-vel'));
      [].forEach.call(this.querySelectorAll('[data-vel]'), function (x) { x.setAttribute('aria-pressed', String(x === v)); });
    });

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
      var m = UI.modal({ title: 'Abrir datos de un menor', sub: p.tipo + ' ' + p.texto,
        body: '<p class="gi-p">Estos datos tienen reserva reforzada. Indica para qué los necesitas; la apertura queda registrada con tu usuario, la fecha y la hora.</p>' +
          '<label class="gi-lbl gi-lbl--req">Motivo<select class="gi-in" id="gcMot"><option value="">Selecciona un motivo</option>' + MOTIVOS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
          '<p class="gi-err" id="gcErr" hidden>Selecciona un motivo para continuar.</p>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button class="naowee-btn naowee-btn--loud" id="gcOk">Abrir datos</button>' });
      m.el.querySelector('#gcOk').addEventListener('click', function () {
        var v = m.el.querySelector('#gcMot').value;
        if (!v) { m.el.querySelector('#gcErr').hidden = false; return; }
        st.abiertos[keyOf(p)] = { motivo: v };
        m.close(); UI.toast('Apertura registrada en la auditoría.'); paint(true);
      });
    }

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

    d.getElementById('gcForm').addEventListener('submit', function (e) { e.preventDefault(); ejemplos(false); consultar(inp.value, true); });
    /* Escribir no consulta: cancela la que corre y, con el campo vacío, vuelve a Recientes. */
    inp.addEventListener('input', function () {
      st.q = inp.value; if (capa.activa()) detener();
      if (!st.q.trim() && st.cq) { st.cq = ''; st.page = 1; st.sel = ''; paint(false); }
    });
    if (onResize) w.removeEventListener('resize', onResize);
    onResize = function () { if (d.getElementById('gcRecL')) fit(); };
    w.addEventListener('resize', onResize);
    paint(false);
  }

  SUID.views['control-acceso/consulta'] = open;
})(window, document);
