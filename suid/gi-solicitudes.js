/* Solicitudes de control: reportes de entidades deportivas e inspecciones. Un reporte nunca bloquea por sí solo. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, UI = w.GIUI, esc = SUID.esc;
  var KEY = 'suid.gs.v5';
  var ESTADOS = [['enviado', 'Enviado'], ['recibido', 'Recibido'], ['tramite', 'En trámite'], ['derivo', 'Derivó en medida'], ['archivado', 'Archivado']];
  var BADGE = { enviado: 'informative', recibido: 'neutral', tramite: 'caution', derivo: 'negative', archivado: 'neutral' };
  var MOTIVOS = ['La autoridad no abrió procedimiento', 'No se pudo identificar a la persona', 'Duplicado de otra solicitud', 'Falta de evidencia', 'Otro'];
  var USER = SUID.user.name;
  var PAGE = 8;
  var filt = { q: '', est: '', ori: '', pag: 1 };

  function h(f, t, q, p) { return { fecha: f, texto: t, quien: q, punto: p || 'gris' }; }
  /* Datos ficticios, alineados con los reportes del SVN (R-2026-0418, R-2025-0288...). */
  function seed() {
    return [
      { id: 'R-2026-0441', estado: 'enviado', tipo: 'Club de fútbol', origen: 'Millonarios', iso: '2026-09-30', fecha: '30 sep 2026 · 09:14', nombre: 'Diego Armando Pinzón Mora', doc: 'CC 1.014.220.367',
        evento: 'Millonarios vs. Junior · 28 sep 2026 · Estadio El Campín', hechos: '28 sep 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Ingresar bebidas alcohólicas (art. 97, 6)'], evid: '2 fotos',
        descripcion: 'Ingresó una botella de licor oculta en la Puerta 2 · Occidental.', hist: [h('30 sep 2026', 'Enviado por la entidad', 'Millonarios · Seguridad', 'azul')] },
      { id: 'R-2026-0440', estado: 'enviado', tipo: 'Entidad deportiva', origen: 'Liga de Fútbol de Antioquia', iso: '2026-09-30', fecha: '30 sep 2026 · 07:48', nombre: 'Sandra Milena Zapata Builes', doc: 'CC 32.145.908',
        evento: 'Envigado vs. Pereira · 27 sep 2026 · Estadio Polideportivo Sur', hechos: '27 sep 2026', autoridad: 'Inspección de Policía 3 de Envigado', conductas: ['Agresión verbal (art. 98, b)'], evid: 'Sin evidencia adjunta',
        descripcion: 'Insultó a un integrante de la logística en la fila de la Puerta 1.', hist: [h('30 sep 2026', 'Enviado por la entidad', 'Liga de Fútbol de Antioquia · Seguridad', 'azul')] },
      { id: 'R-2026-0432', estado: 'recibido', tipo: 'Inspección de Policía', origen: 'Inspección de Policía 9 de Bogotá', iso: '2026-09-27', fecha: '27 sep 2026 · 12:40', nombre: 'Camilo Ernesto Rubio Salas', doc: 'CC 1.032.771.045',
        evento: 'Santa Fe vs. Nacional · 25 sep 2026 · Estadio El Campín', hechos: '25 sep 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Invasión del terreno de juego (art. 97, 4)'], evid: '1 video',
        descripcion: 'Ingresó al campo al finalizar el primer tiempo y fue retirado por la policía.', hist: [h('27 sep 2026', 'Enviado por la inspección', 'Inspección de Policía 9 de Bogotá', 'azul'), h('28 sep 2026', 'Recibido por el IVC', 'Natalia Suárez Pineda')] },
      { id: 'R-2026-0428', estado: 'recibido', tipo: 'Mindeporte', origen: 'Mindeporte', iso: '2026-09-18', fecha: '18 sep 2026 · 10:25', nombre: 'Henry Alexander Mosquera Torres', doc: 'CC 79.502.316',
        evento: 'Nacional vs. Santa Fe · 16 sep 2026 · Estadio Atanasio Girardot', hechos: '16 sep 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Armas u objetos peligrosos (art. 97, 1)'], evid: '3 fotos',
        descripcion: 'En la requisa de la Puerta 4 · Oriental se le encontró un objeto contundente.', hist: [h('18 sep 2026', 'Enviado por Mindeporte', 'Mindeporte · Inspección, Vigilancia y Control', 'azul'), h('19 sep 2026', 'Recibido por el IVC', 'Jaime Pardo Ruiz')] },
      { id: 'R-2026-0409', estado: 'tramite', tipo: 'Club de fútbol', origen: 'Millonarios', iso: '2026-08-17', fecha: '17 ago 2026 · 16:10', nombre: 'Jhon Freddy Caicedo Prado', doc: 'CC 1.075.230.918',
        evento: 'Millonarios vs. Medellín · 15 ago 2026 · Estadio El Campín', hechos: '15 ago 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Violencia contra la fuerza pública (art. 97, 3)'], evid: '2 fotos · 1 video',
        descripcion: 'Golpeó a un agente de policía durante el desalojo de la tribuna Sur.',
        hist: [h('17 ago 2026', 'Enviado por la entidad', 'Millonarios · Seguridad', 'azul'), h('18 ago 2026', 'Recibido por el IVC', 'Natalia Suárez Pineda'), h('25 ago 2026', 'La autoridad abrió procedimiento · oficio 2026-E-032977', 'Natalia Suárez Pineda', 'amarillo')] },
      { id: 'R-2026-0391', estado: 'derivo', medida: 'INF-2026-0002', tipo: 'Club de fútbol', origen: 'Independiente Medellín', iso: '2026-08-03', fecha: '3 ago 2026 · 13:35', nombre: 'Fabio Nelson Gaviria Londoño', doc: 'CC 70.325.114',
        evento: 'Medellín vs. Junior · 1 ago 2026 · Estadio Atanasio Girardot', hechos: '1 ago 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Agresión física (art. 98, a)'], evid: '1 foto · 1 video',
        descripcion: 'Agredió a otro aficionado en la tribuna Sur al terminar el partido.',
        hist: [h('3 ago 2026', 'Enviado por la entidad', 'Independiente Medellín · Seguridad', 'azul'), h('4 ago 2026', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('11 ago 2026', 'La autoridad abrió procedimiento', 'Carolina Vélez Ortiz', 'amarillo'), h('15 sep 2026', 'Derivó en la medida INF-2026-0002', 'Carolina Vélez Ortiz', 'rojo')] },
      { id: 'R-2026-0366', estado: 'archivado', motivoArchivo: 'Duplicado de otra solicitud', notaArchivo: 'Ya existe una solicitud con los mismos hechos.', tipo: 'Inspección de Policía', origen: 'Inspección de Policía 3 de Envigado', iso: '2026-07-14', fecha: '14 jul 2026 · 09:05', nombre: 'Leidy Johana Restrepo Vélez', doc: 'CC 1.040.750.226',
        evento: 'Envigado vs. Medellín · 12 jul 2026 · Estadio Polideportivo Sur', hechos: '12 jul 2026', autoridad: 'Inspección de Policía 3 de Envigado', conductas: ['Agresión verbal (art. 98, b)'], evid: 'Sin evidencia adjunta',
        descripcion: 'Insultó a un árbitro desde la tribuna Occidental.',
        hist: [h('14 jul 2026', 'Enviado por la inspección', 'Inspección de Policía 3 de Envigado', 'azul'), h('15 jul 2026', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('20 jul 2026', 'Archivado · duplicado de otra solicitud', 'Carolina Vélez Ortiz')] },
      { id: 'R-2026-0438', estado: 'enviado', tipo: 'Club de fútbol', origen: 'Atlético Nacional', iso: '2026-09-29', fecha: '29 sep 2026 · 08:50', nombre: 'Hernán Darío Quintero Gil', doc: 'CC 98.612.340',
        evento: 'Nacional vs. Once Caldas · 27 sep 2026 · Estadio Atanasio Girardot', hechos: '27 sep 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Derecho de admisión'], evid: '1 foto',
        descripcion: 'Negó el ingreso por derecho de admisión: se negó a retirar una bandera con mensajes ofensivos en la Puerta 3 · Norte.', hist: [h('29 sep 2026', 'Enviado por la entidad', 'Atlético Nacional · Jefe de logística', 'azul')] },
      { id: 'R-2026-0434', estado: 'recibido', tipo: 'Entidad deportiva', origen: 'Liga de Fútbol de Antioquia', iso: '2026-09-28', fecha: '28 sep 2026 · 13:20', nombre: 'Luz Marina Arboleda Henao', doc: 'CC 43.870.215',
        evento: 'Envigado vs. Rionegro · 26 sep 2026 · Estadio Polideportivo Sur', hechos: '26 sep 2026', autoridad: 'Inspección de Policía 3 de Envigado', conductas: ['Derecho de admisión'], evid: 'Sin evidencia adjunta',
        descripcion: 'Negó el ingreso por derecho de admisión: llegó en evidente estado de embriaguez y alteró la fila de acceso de la Puerta 1.', hist: [h('28 sep 2026', 'Enviado por la entidad', 'Liga de Fútbol de Antioquia · Seguridad', 'azul'), h('29 sep 2026', 'Recibido por el IVC', 'Natalia Suárez Pineda')] },
      { id: 'R-2026-0427', estado: 'tramite', tipo: 'Mindeporte', origen: 'Mindeporte', iso: '2026-09-15', fecha: '15 sep 2026 · 11:05', nombre: 'Wilson Fabián Tovar Neira', doc: 'CC 1.020.455.771',
        evento: 'Santa Fe vs. Millonarios · 13 sep 2026 · Estadio El Campín', hechos: '13 sep 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Agresión verbal (art. 98, b)'], evid: '1 video',
        descripcion: 'Insultó de forma reiterada a un juez de línea desde la tribuna Occidental.',
        hist: [h('15 sep 2026', 'Enviado por Mindeporte', 'Mindeporte · Inspección, Vigilancia y Control', 'azul'), h('16 sep 2026', 'Recibido por el IVC', 'Jaime Pardo Ruiz'), h('22 sep 2026', 'La autoridad abrió procedimiento', 'Jaime Pardo Ruiz', 'amarillo')] },
      { id: 'R-2026-0436', estado: 'enviado', tipo: 'Club de fútbol', origen: 'Independiente Medellín', iso: '2026-09-29', fecha: '29 sep 2026 · 21:40', menor: true, nombre: '', iniciales: 'J. A. P. R.', doc: 'TI •••• 7720',
        evento: 'Medellín vs. Nacional · 28 sep 2026 · Estadio Atanasio Girardot', hechos: '28 sep 2026', autoridad: 'Inspección de Policía 5 de Medellín', conductas: ['Ingresar bebidas alcohólicas (art. 97, 6)'], evid: '2 fotos',
        descripcion: 'Ingresó licor en la Puerta 5 · Oriental. La logística lo entregó a su acudiente.', hist: [h('29 sep 2026', 'Enviado por la entidad', 'Independiente Medellín · Seguridad', 'azul')] },
      { id: 'R-2026-0435', estado: 'enviado', tipo: 'Inspección de Policía', origen: 'Inspección de Policía 14 de Medellín', iso: '2026-09-29', fecha: '29 sep 2026 · 10:12', nombre: 'Julián Andrés Posada', doc: 'CC 71.894.447',
        evento: 'Nacional vs. Medellín · 28 sep 2026 · Estadio Atanasio Girardot', hechos: '28 sep 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Incumplimiento de medida vigente (intento de ingreso)'], evid: '1 foto · 1 video',
        descripcion: 'Intentó ingresar por la Puerta 4 · Oriental con una medida vigente; el SVN bloqueó el ingreso.', hist: [h('29 sep 2026', 'Enviado por la inspección', 'Inspección de Policía 14 de Medellín', 'azul')] },
      { id: 'R-2026-0431', estado: 'enviado', tipo: 'Club de fútbol', origen: 'Millonarios', iso: '2026-09-27', fecha: '27 sep 2026 · 19:05', nombre: 'Marco Antonio Bianchi', doc: 'CE 7.040.400',
        evento: 'Millonarios vs. Santa Fe · 26 sep 2026 · Estadio El Campín', hechos: '26 sep 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Invasión del terreno de juego (art. 97, 4)'], evid: '3 fotos',
        descripcion: 'Saltó al campo al minuto 80 y fue retenido por la logística.', hist: [h('27 sep 2026', 'Enviado por la entidad', 'Millonarios · Seguridad', 'azul')] },
      { id: 'R-2026-0422', estado: 'recibido', tipo: 'Inspección de Policía', origen: 'Inspección de Policía 3 de Envigado', iso: '2026-09-24', fecha: '24 sep 2026 · 15:30', nombre: 'Brayan Stiven Ospina Mesa', doc: 'CC 1.036.482.119',
        evento: 'Envigado vs. Nacional · 22 sep 2026 · Estadio Polideportivo Sur', hechos: '22 sep 2026', autoridad: 'Inspección de Policía 3 de Envigado', conductas: ['Agresión verbal (art. 98, b)'], evid: 'Sin evidencia adjunta',
        descripcion: 'Insultó a un árbitro asistente al terminar el partido.', hist: [h('24 sep 2026', 'Enviado por la inspección', 'Inspección de Policía 3 de Envigado', 'azul'), h('25 sep 2026', 'Recibido por el IVC', 'Carolina Vélez Ortiz')] },
      { id: 'R-2026-0418', estado: 'recibido', tipo: 'Club de fútbol', origen: 'Atlético Nacional', iso: '2026-09-22', fecha: '22 sep 2026 · 16:05', nombre: 'Cristian Camilo Bedoya Arias', doc: 'CC 1.001.225.390',
        evento: 'Nacional vs. Junior · 20 sep 2026 · Estadio Atanasio Girardot', hechos: '20 sep 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Agresión verbal (art. 98, b)'], evid: '1 foto',
        descripcion: 'Insultos reiterados a un integrante de la logística en la Puerta 2 · Norte.', hist: [h('22 sep 2026', 'Enviado por la entidad', 'Atlético Nacional · Jefe de logística', 'azul'), h('23 sep 2026', 'Recibido por el IVC', 'Jaime Pardo Ruiz')] },
      { id: 'R-2026-0412', estado: 'tramite', tipo: 'Club de fútbol', origen: 'Independiente Medellín', iso: '2026-08-05', fecha: '5 ago 2026 · 11:30', nombre: 'Andrés Felipe Cardona Ruiz', doc: 'CC 1.017.225.804',
        evento: 'Medellín vs. Millonarios · 3 ago 2026 · Estadio Atanasio Girardot', hechos: '3 ago 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Violencia contra la fuerza pública (art. 97, 3)'], evid: '4 fotos · 1 video',
        descripcion: 'Empujó y golpeó a un patrullero en la salida de la tribuna Occidental. Según la logística, estaba bajo efectos de alcohol.',
        hist: [h('5 ago 2026', 'Enviado por la entidad', 'Independiente Medellín · Seguridad', 'azul'), h('6 ago 2026', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('12 ago 2026', 'La autoridad abrió procedimiento · oficio 2026-E-031778', 'Carolina Vélez Ortiz', 'amarillo')] },
      { id: 'R-2026-0405', estado: 'tramite', tipo: 'Club de fútbol', origen: 'Atlético Nacional', iso: '2026-08-11', fecha: '11 ago 2026 · 09:18', nombre: 'Yeison Darío Montoya Cano', doc: 'CC 1.036.901.558',
        evento: 'Nacional vs. Pereira · 10 ago 2026 · Estadio Atanasio Girardot', hechos: '10 ago 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Armas u objetos peligrosos (art. 97, 1)'], evid: '2 fotos',
        descripcion: 'En la requisa de la Puerta 6 · Sur se le encontró un arma cortopunzante.',
        hist: [h('11 ago 2026', 'Enviado por la entidad', 'Atlético Nacional · Jefe de logística', 'azul'), h('11 ago 2026', 'Recibido por el IVC', 'Jaime Pardo Ruiz'), h('19 ago 2026', 'La autoridad abrió procedimiento · oficio 2026-E-032410', 'Jaime Pardo Ruiz', 'amarillo')] },
      { id: 'R-2025-0288', estado: 'derivo', medida: 'INF-2025-0046', tipo: 'Club de fútbol', origen: 'Atlético Nacional', iso: '2025-10-20', fecha: '20 oct 2025', nombre: 'Julián Andrés Posada', doc: 'CC 71.894.447',
        evento: 'Nacional vs. Medellín · 19 oct 2025 · Estadio Atanasio Girardot', hechos: '19 oct 2025', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Agresión física (art. 98, a)'], evid: '2 fotos · 1 video',
        descripcion: 'Agredió a otro aficionado en la tribuna Oriental Baja durante el segundo tiempo.',
        hist: [h('20 oct 2025', 'Enviado por la entidad', 'Atlético Nacional · Jefe de logística', 'azul'), h('21 oct 2025', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('28 oct 2025', 'La autoridad abrió procedimiento', 'Carolina Vélez Ortiz', 'amarillo'), h('4 dic 2025', 'Derivó en la medida INF-2025-0046', 'Carolina Vélez Ortiz', 'rojo')] },
      { id: 'R-2026-0379', estado: 'archivado', motivoArchivo: 'La autoridad no abrió procedimiento', notaArchivo: 'Oficio de la Inspección de Policía 9 de Bogotá, radicado 2026-E-029904.', tipo: 'Club de fútbol', origen: 'Millonarios', iso: '2026-07-27', fecha: '27 jul 2026 · 14:52', nombre: 'Óscar Iván Rincón Pulido', doc: 'CC 80.556.214',
        evento: 'Millonarios vs. Nacional · 26 jul 2026 · Estadio El Campín', hechos: '26 jul 2026', autoridad: 'Inspección de Policía 9 de Bogotá', conductas: ['Agresión física (art. 98, a)'], evid: 'Sin evidencia adjunta',
        descripcion: 'Riña en la tribuna Norte; el informe no identifica quién inició la agresión.',
        hist: [h('27 jul 2026', 'Enviado por la entidad', 'Millonarios · Seguridad', 'azul'), h('28 jul 2026', 'Recibido por el IVC', 'Natalia Suárez Pineda'), h('2 sep 2026', 'Archivado · la autoridad no abrió procedimiento', 'Natalia Suárez Pineda')] }
    ];
  }
  var data = null;
  function load() {
    if (data) return data;
    try { var raw = localStorage.getItem(KEY); if (raw) { data = JSON.parse(raw); return data; } } catch (e) {}
    data = seed();
    return data;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function stamp() { var n = U.now(); var p = n.fecha.split('-'); return +p[2] + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+p[1] - 1] + ' ' + p[0]; }
  function label(k) { return ESTADOS.filter(function (e) { return e[0] === k; })[0][1]; }
  function badge(k) { return '<span class="naowee-badge naowee-badge--' + BADGE[k] + ' naowee-badge--quiet">' + esc(label(k)) + '</span>'; }
  /* Logo por origen (suid/img/origenes). Sin logo: monograma circular del mismo tamaño. */
  var LOGOS = [[/^inspecci.n de polic/i, 'policia.png'], [/^atl.tico nacional/i, 'nacional.png'], [/^independiente medell/i, 'medellin.png'], [/^mindeporte/i, 'mindeporte.svg']];
  var TIPOS = { 'Club de fútbol': 'informative', 'Entidad deportiva': 'neutral', 'Inspección de Policía': 'caution', 'Mindeporte': 'positive' };
  function logo(n) { var l = LOGOS.filter(function (x) { return x[0].test(n); })[0]; return l ? 'img/origenes/' + l[1] : ''; }
  function mono(n) {
    var p = n.replace(/\b(de|del|la|el|los|las)\b/gi, ' ').split(/\s+/).filter(function (x) { return x && !/^\d+$/.test(x); });
    return (p.length > 1 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
  }
  GI.origenAvatar = function (n) {
    var src = logo(n);
    return '<span class="gi-av' + (src ? '' : ' gi-av--mono') + '" aria-hidden="true">' + (src ? '<img src="' + src + '" alt="" width="36" height="36">' : esc(mono(n))) + '</span>';
  };
  GI.origenTag = function (t) { return '<span class="naowee-badge naowee-badge--' + (TIPOS[t] || 'neutral') + ' naowee-badge--quiet gs-tag">' + esc(t) + '</span>'; };
  function origen(r) { return '<span class="gs-ori">' + GI.origenAvatar(r.origen) + '<span class="gs-ori__t"><strong>' + esc(r.origen) + '</strong>' + GI.origenTag(r.tipo) + '</span></span>'; }
  function evento(r) { var p = GI.titulo(r.evento).split(' · '); return esc(p[0]) + ' <span class="gs-evf">· ' + esc(p[1] || r.hechos) + '</span>'; }
  function persona(r) { return r.menor ? '<strong>Menor de edad</strong><small>' + esc(r.iniciales) + ' · ' + esc(r.doc) + '</small>' : '<strong>' + esc(r.nombre) + '</strong><small>' + esc(r.doc) + '</small>'; }

  function pickOrigen(host, orig, onPick) {
    GI.selectGrafico({ host: host, id: 'gsOri', label: 'Origen', prefijo: 'Origen', value: filt.ori, onPick: onPick,
      items: [{ v: '', n: 'Todos' }].concat(orig.map(function (r) { return { v: r.origen, n: r.origen, t: r.tipo }; })) });
  }

  function open(view, ctx) {
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Solicitudes' }];
    var all = load();
    var orig = all.filter(function (r, i, a) { return a.map(function (x) { return x.origen; }).indexOf(r.origen) === i; }).sort(function (a, b) { return a.origen.localeCompare(b.origen, 'es'); });
    var RESET = '<svg class="gi-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>';
    view.innerHTML = '<div class="page-inner gi-page gs-page">' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">Solicitudes de control</h1>' +
      '<p class="page-subtitle">Reportes que llegan de las entidades deportivas y de las inspecciones. Un reporte nunca bloquea por sí solo: solo la medida lo hace.</p></div>' +
      '<div class="gs-total" role="status" aria-label="Total de solicitudes" title="Total de solicitudes"><span class="gt-count gs-total__n" id="gsTN">' + all.length + '</span></div></header>' +
      '<section class="gt-card gs-card" aria-label="Solicitudes de control">' +
      '<div class="gt-toolbar"><div class="gt-search">' + UI.svg('search') + '<input id="gsQ" type="search" aria-label="Buscar solicitud" placeholder="Buscar solicitud" value="' + esc(filt.q) + '"></div>' +
      '<div id="gsEstH"></div><div id="gsPick"></div>' +
      '<button type="button" class="gs-reset" id="gsReset" aria-label="Reiniciar filtros" title="Reiniciar filtros" disabled>' + RESET + '</button></div>' +
      '<div class="gt-wrap"><table class="gt-table"><thead><tr><th>Origen</th><th>Radicado</th><th>Persona</th><th>Evento y conducta</th><th>Estado</th></tr></thead><tbody id="gsBody"></tbody></table></div>' +
      '<nav id="gsPag"></nav></section></div>';

    GI.stickyHead(d.querySelector('.gs-card .gt-table'));
    function paint() {
      var rows = load(), cnt = { '': rows.length };
      ESTADOS.forEach(function (e) { cnt[e[0]] = rows.filter(function (r) { return r.estado === e[0]; }).length; });
      pickEstado(cnt);
      var q = filt.q.trim().toLowerCase();
      var list = rows.filter(function (r) {
        return (!filt.est || r.estado === filt.est) && (!filt.ori || r.origen === filt.ori) &&
          (!q || (r.id + ' ' + (r.menor ? r.iniciales : r.nombre) + ' ' + r.doc + ' ' + r.origen + ' ' + r.tipo + ' ' + r.conductas.join(' ')).toLowerCase().indexOf(q) >= 0);
      });
      list.sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : a.id < b.id ? 1 : -1; });
      /* El contador de arriba es el total general; el filtrado lo da el paginador. */
      GI.tablaTotal('gsT', rows.length);
      d.getElementById('gsReset').disabled = !(filt.q.trim() || filt.est || filt.ori);
      filt.pag = GI.pager(d.getElementById('gsPag'), { total: list.length, page: filt.pag, size: PAGE, label: 'Paginación de solicitudes', onPage: function (p) { filt.pag = p; paint(); } });
      var ini = (filt.pag - 1) * PAGE, vis = list.slice(ini, ini + PAGE);
      d.getElementById('gsBody').innerHTML = list.length ? vis.map(function (r) {
        return '<tr tabindex="0" data-id="' + r.id + '"><td>' + origen(r) + '</td>' +
          '<td><strong>' + esc(r.id) + '</strong><small>' + esc(r.fecha) + '</small></td><td>' + persona(r) + '</td>' +
          '<td>' + evento(r) + '<small>' + esc(r.conductas.join('; ')) + '</small></td><td>' + badge(r.estado) + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="gt-empty">No hay solicitudes con esos filtros.</td></tr>';
      GI.panel.sincronizar();
    }
    /* Estado con conteo por opción; se rearma solo cuando cambian los conteos (tras mover una solicitud). */
    var estSig = '';
    function pickEstado(cnt) {
      var sig = JSON.stringify(cnt) + '|' + filt.est; if (sig === estSig) return;
      estSig = sig;
      function n(k) { return '<span class="gs-est__n">' + k + '</span>'; }
      GI.selectGrafico({ host: d.getElementById('gsEstH'), id: 'gsEst', label: 'Filtrar por estado', prefijo: 'Estado', value: filt.est,
        onPick: function (v) { filt.est = v; filt.pag = 1; paint(); },
        items: [{ v: '', n: 'Todas', av: '', tag: n(cnt['']) }].concat(ESTADOS.map(function (e) {
          return { v: e[0], n: e[1], av: '<span class="gs-dot gs-dot--' + BADGE[e[0]] + '" aria-hidden="true"></span>', tag: n(cnt[e[0]]) };
        })) });
    }
    d.getElementById('gsQ').addEventListener('input', function (e) { filt.q = e.target.value; filt.pag = 1; paint(); });
    pickOrigen(d.getElementById('gsPick'), orig, function (v) { filt.ori = v; filt.pag = 1; paint(); });
    d.getElementById('gsReset').addEventListener('click', function () {
      filt.q = ''; filt.est = ''; filt.ori = ''; filt.pag = 1; estSig = '';
      var q = d.getElementById('gsQ'); q.value = '';
      pickOrigen(d.getElementById('gsPick'), orig, function (v) { filt.ori = v; filt.pag = 1; paint(); });
      paint(); q.focus();
    });
    GI.filasClicables(d.getElementById('gsBody'), function (id, tr) { detalle(id, paint, tr); });
    paint();
  }

  /* Acciones de estado: las mismas en el panel y en la vista interna; cada botón lleva data-gs. */
  var LISTA = '#/control-acceso/solicitudes';
  function ruta(r) { return LISTA + '/' + encodeURIComponent(r.id); }
  function cerrada(r) { return r.estado === 'archivado' || r.estado === 'derivo'; }
  function bt(a, t, cls) { return '<button type="button" class="naowee-btn naowee-btn--' + (cls || 'mute') + '" data-gs="' + a + '">' + t + '</button>'; }
  function paso(r) {
    return r.estado === 'enviado' ? bt('rec', 'Marcar como recibida', 'quiet') : r.estado === 'recibido' ? bt('tra', 'Pasar a trámite', 'quiet') : r.estado === 'tramite' ? bt('enl', 'Enlazar a medida', 'quiet') : '';
  }
  function accionesPanel(r) { return '<a class="naowee-btn naowee-btn--loud" href="' + ruta(r) + '">Abrir expediente</a>' + (cerrada(r) ? '' : bt('arc', 'Archivar')); }
  function accionesInterno(r) {
    var ficha = r.medida && GI.get(r.medida) ? '<a class="naowee-btn naowee-btn--mute" href="' + UI.BASE + '/' + esc(r.medida) + '">Abrir la ficha en Gestión</a>' : '';
    return ficha + (cerrada(r) ? '' : bt('arc', 'Archivar') + (paso(r) ? paso(r).replace('naowee-btn--quiet', 'naowee-btn--loud') : ''));
  }
  function modelo(r) { return GI.expediente.deSolicitud(r, { acciones: accionesPanel(r), siguiente: cerrada(r) ? '' : '<a class="naowee-btn naowee-btn--loud" href="' + ruta(r) + '">Abrir expediente</a>' }); }
  /* Contenido del panel; se vuelve a pedir tras cada cambio de estado y el panel no se cierra. */
  function compacto(r, repaint) {
    var o = GI.expediente.compacto(modelo(r)), propio = o.onPintar;
    o.onPintar = function (el) { if (propio) propio(el); atar(el, r, function () { if (GI.panel.id() === r.id) GI.panel.actualizar(compacto(r, repaint)); repaint(); }); };
    return o;
  }
  function detalle(id, repaint, origen) {
    var r = load().filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var o = compacto(r, repaint); o.origen = origen;
    GI.panel.abrir(o);
  }

  /* Vista interna de la solicitud: #/control-acceso/solicitudes/<id>. */
  function interno(view, ctx, id) {
    var r = load().filter(function (x) { return x.id === id; })[0];
    if (!r) { location.hash = LISTA; return; }
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Solicitudes', href: LISTA }, { label: r.id }];
    var nombre = r.menor ? 'Menor de edad · ' + r.iniciales : r.nombre;
    view.innerHTML = '<div class="page-inner gi-page gs-page gs-int"><a class="gi-back" href="' + LISTA + '">' + UI.svg('back') + ' Volver</a>' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">' + esc(nombre) + ' ' + badge(r.estado) + '</h1>' +
      '<p class="page-subtitle"><span class="gi-mono">' + esc(r.id) + '</span> · ' + esc(r.doc) + ' · reportado por ' + esc(r.origen) + '</p></div>' +
      '<div class="gi-head__actions">' + accionesInterno(r) + '</div></header>' +
      GI.expediente.interno(modelo(r)) + '</div>';
    atar(view, r, function () { interno(view, ctx, id); });
  }

  /* Ata los botones data-gs de un contenedor; el panel y la vista interna llaman aquí tras cada pintura. */
  function atar(el, r, refrescar) {
    function mover(a, texto, cambios, toast) {
      var f = stamp();
      Object.assign(r, cambios, { estado: a });
      r.hist.push(h(f, texto, USER, a === 'derivo' ? 'rojo' : a === 'tramite' ? 'amarillo' : 'gris'));
      save(); UI.toast(toast); refrescar();
    }
    function on(a, fn) { [].forEach.call(el.querySelectorAll('[data-gs="' + a + '"]'), function (b) { b.addEventListener('click', function () { fn(b); }); }); }
    on('rec', function (b) { SUID.busy(b, 'Guardando…', function () { mover('recibido', 'Recibido por el IVC', {}, 'Solicitud ' + r.id + ' marcada como recibida.'); }, 600); });
    on('tra', function (b) { SUID.busy(b, 'Guardando…', function () { mover('tramite', 'La autoridad abrió procedimiento', {}, 'Solicitud ' + r.id + ' en trámite.'); }, 600); });
    on('enl', function () {
      var digs = r.doc.replace(/\D/g, ''), med = '';
      var mismas = GI.all().filter(function (x) { return D.estadoRestriccion(x) !== 'Inactiva'; }).sort(function (a, b) { return (b.numId === digs) - (a.numId === digs); });
      var m = UI.modal({ title: 'Enlazar a una medida', sub: r.id, body: '<div class="gs-field"><label class="gs-field__l gs-field__l--req">Medida a enlazar</label><div id="gsMedH"></div></div><p class="gi-err" id="gsErr" hidden>Selecciona la medida a enlazar.</p>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button type="button" class="naowee-btn naowee-btn--loud" id="gsEnlOk">Confirmar enlace</button>' });
      GI.selectGrafico({ host: m.el.querySelector('#gsMedH'), id: 'gsMed', label: 'Medida a enlazar', campo: true,
        onPick: function (v) { med = v; if (v) m.el.querySelector('#gsErr').hidden = true; },
        items: [{ v: '', n: 'Selecciona una medida', av: '' }].concat(mismas.slice(0, 14).map(function (x) {
          return { v: x.id, av: '', n: x.id + ' · ' + (D.esMenor(x) ? 'Menor de edad' : D.nombreCompleto(x)) + (x.numId === digs ? ' (misma persona)' : '') };
        })) });
      m.el.querySelector('#gsEnlOk').addEventListener('click', function () {
        if (!med) { m.el.querySelector('#gsErr').hidden = false; return; }
        var v = med;
        SUID.busy(m.el.querySelector('#gsEnlOk'), 'Enlazando…', function () { m.close(); mover('derivo', 'Derivó en la medida ' + v, { medida: v }, 'Solicitud enlazada a la medida ' + v + '.'); }, 700);
      });
    });
    on('arc', function () {
      var mot = '';
      var m = UI.modal({ title: 'Archivar solicitud', sub: r.id, body: '<div class="gs-mform"><div class="gs-field"><label class="gs-field__l gs-field__l--req">Motivo del archivo</label><div id="gsMotH"></div></div>' +
        '<label class="gs-field__l" for="gsNota">Nota (opcional)</label><textarea id="gsNota" rows="2"></textarea><p class="gi-err" id="gsErr" hidden>Selecciona un motivo para archivar.</p></div>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Cancelar</button><button type="button" class="naowee-btn naowee-btn--loud" id="gsArcOk">Archivar solicitud</button>' });
      GI.selectGrafico({ host: m.el.querySelector('#gsMotH'), id: 'gsMot', label: 'Motivo del archivo', campo: true,
        onPick: function (v) { mot = v; if (v) m.el.querySelector('#gsErr').hidden = true; },
        items: [{ v: '', n: 'Selecciona un motivo', av: '' }].concat(MOTIVOS.map(function (x) { return { v: x, n: x, av: '' }; })) });
      m.el.querySelector('#gsArcOk').addEventListener('click', function () {
        if (!mot) { m.el.querySelector('#gsErr').hidden = false; return; }
        var v = mot, nota = m.el.querySelector('#gsNota').value.trim();
        SUID.busy(m.el.querySelector('#gsArcOk'), 'Archivando…', function () { m.close(); mover('archivado', 'Archivado · ' + v.charAt(0).toLowerCase() + v.slice(1), { motivoArchivo: v, notaArchivo: nota }, 'Solicitud archivada.'); }, 700);
      });
    });
  }

  /* La ruta con id abre la vista interna; sin id, la bandeja. */
  SUID.views['control-acceso/solicitudes'] = function (view, ctx) { return ctx.rest[0] ? interno(view, ctx, decodeURIComponent(ctx.rest[0])) : open(view, ctx); };
  /* La ficha de Gestión consulta aquí qué solicitudes derivaron en su medida. */
  w.GS = {
    lista: function () { return load().slice().sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : a.id < b.id ? 1 : -1; }).map(function (x) { return { id: x.id, fecha: x.fecha, origen: x.origen, nombre: x.menor ? (x.iniciales || 'Persona menor de edad') : x.nombre, doc: x.doc, menor: !!x.menor, estado: label(x.estado), medida: x.medida || '' }; }); },
    porMedida: function (id) { return load().filter(function (x) { return x.medida === id; }); },
    enTramite: function () { return load().filter(function (x) { return x.estado === 'tramite'; }).map(function (x) { return { id: x.id, nombre: x.nombre, doc: x.doc, origen: x.origen, menor: !!x.menor, iniciales: x.iniciales || '' }; }); }
  };
})(window, document);
