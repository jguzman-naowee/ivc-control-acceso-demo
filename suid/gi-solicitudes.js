/* Solicitudes de control: reportes de entidades deportivas e inspecciones. Un reporte nunca bloquea por sí solo. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, UI = w.GIUI, esc = SUID.esc;
  var KEY = 'suid.gs.v3';
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
      { id: 'R-2026-0391', estado: 'derivo', medida: 'MC-2026-0412', tipo: 'Club de fútbol', origen: 'Independiente Medellín', iso: '2026-08-03', fecha: '3 ago 2026 · 13:35', nombre: 'Fabio Nelson Gaviria Londoño', doc: 'CC 70.325.114',
        evento: 'Medellín vs. Junior · 1 ago 2026 · Estadio Atanasio Girardot', hechos: '1 ago 2026', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Agresión física (art. 98, a)'], evid: '1 foto · 1 video',
        descripcion: 'Agredió a otro aficionado en la tribuna Sur al terminar el partido.',
        hist: [h('3 ago 2026', 'Enviado por la entidad', 'Independiente Medellín · Seguridad', 'azul'), h('4 ago 2026', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('11 ago 2026', 'La autoridad abrió procedimiento', 'Carolina Vélez Ortiz', 'amarillo'), h('15 sep 2026', 'Derivó en la medida MC-2026-0412', 'Carolina Vélez Ortiz', 'rojo')] },
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
      { id: 'R-2026-0435', estado: 'enviado', tipo: 'Inspección de Policía', origen: 'Inspección de Policía 14 de Medellín', iso: '2026-09-29', fecha: '29 sep 2026 · 10:12', nombre: 'Julián Andrés Posada', doc: 'CC 71.894.4471',
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
      { id: 'R-2025-0288', estado: 'derivo', medida: 'MC-2025-0831', tipo: 'Club de fútbol', origen: 'Atlético Nacional', iso: '2025-10-20', fecha: '20 oct 2025', nombre: 'Julián Andrés Posada', doc: 'CC 71.894.4471',
        evento: 'Nacional vs. Medellín · 19 oct 2025 · Estadio Atanasio Girardot', hechos: '19 oct 2025', autoridad: 'Inspección de Policía 14 de Medellín', conductas: ['Agresión física (art. 98, a)'], evid: '2 fotos · 1 video',
        descripcion: 'Agredió a otro aficionado en la tribuna Oriental Baja durante el segundo tiempo.',
        hist: [h('20 oct 2025', 'Enviado por la entidad', 'Atlético Nacional · Jefe de logística', 'azul'), h('21 oct 2025', 'Recibido por el IVC', 'Carolina Vélez Ortiz'), h('28 oct 2025', 'La autoridad abrió procedimiento', 'Carolina Vélez Ortiz', 'amarillo'), h('4 dic 2025', 'Derivó en la medida MC-2025-0831', 'Carolina Vélez Ortiz', 'rojo')] },
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
  function evento(r) { var p = r.evento.split(' · '); return esc(p[0]) + ' <span class="gs-evf">· ' + esc(p[1] || r.hechos) + '</span>'; }
  function persona(r) { return r.menor ? '<strong>Menor de edad</strong><small>' + esc(r.iniciales) + ' · ' + esc(r.doc) + '</small>' : '<strong>' + esc(r.nombre) + '</strong><small>' + esc(r.doc) + '</small>'; }

  /* Selector gráfico reutilizable: listbox con avatar, nombre y tag; flechas, Inicio/Fin, Enter y Esc.
     o = { host, id, label, items: [{ v, n, t?, av?, tag? }], value?, onPick(v) }; av/tag = HTML propio ('' = nada). */
  GI.selectGrafico = function (o) {
    var host = o.host, bid = o.id || 'gsSel', items = o.items;
    var cur = Math.max(0, items.map(function (x) { return x.v; }).indexOf(o.value || '')), act = cur, abierto = false;
    var TODOS = '<span class="gi-av gi-av--all" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/></svg></span>';
    function cara(x) { return (x.av !== undefined ? x.av : x.v ? GI.origenAvatar(x.n) : TODOS) + '<span class="gs-opt__t"><strong>' + esc(x.n) + '</strong>' + (x.tag !== undefined ? x.tag : x.t ? GI.origenTag(x.t) : '') + '</span>'; }
    host.innerHTML = '<button type="button" class="gs-pick__btn" id="' + bid + '" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + bid + 'Lb"></button>' +
      '<ul class="gs-pick__list" id="' + bid + 'Lb" role="listbox" tabindex="-1" aria-label="' + esc(o.label) + '" hidden>' + items.map(function (x, i) { return '<li role="option" id="' + bid + 'Opt' + i + '" data-i="' + i + '">' + cara(x) + '</li>'; }).join('') + '</ul>';
    var btn = host.querySelector('button'), lb = host.querySelector('ul'), ops = lb.querySelectorAll('[role=option]');
    function pinta() {
      btn.innerHTML = '<span class="gs-pick__lbl">' + esc(o.label) + '</span>' + cara(items[cur]) + '<span class="gs-pick__car" aria-hidden="true"></span>';
      ops.forEach(function (op, i) { op.setAttribute('aria-selected', i === cur); op.classList.toggle('is-act', abierto && i === act); });
      if (abierto) { lb.setAttribute('aria-activedescendant', bid + 'Opt' + act); ops[act].scrollIntoView({ block: 'nearest' }); }
    }
    function abrir(v) { abierto = v; lb.hidden = !v; btn.setAttribute('aria-expanded', v); if (v) { act = cur; lb.focus(); } pinta(); }
    function elegir(i) { cur = i; abrir(false); btn.focus(); o.onPick(items[i].v); }
    btn.addEventListener('click', function () { abrir(!abierto); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(true); } });
    lb.addEventListener('click', function (e) { var op = e.target.closest('[role=option]'); if (op) elegir(+op.getAttribute('data-i')); });
    lb.addEventListener('keydown', function (e) {
      var k = e.key, n = items.length;
      if (k === 'ArrowDown') act = (act + 1) % n; else if (k === 'ArrowUp') act = (act + n - 1) % n; else if (k === 'Home') act = 0; else if (k === 'End') act = n - 1;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); return elegir(act); }
      else if (k === 'Escape') { e.preventDefault(); abrir(false); return btn.focus(); }
      else if (k === 'Tab') return abrir(false);
      else return;
      e.preventDefault(); pinta();
    });
    d.addEventListener('click', function f(e) { if (!d.body.contains(host)) return d.removeEventListener('click', f); if (abierto && e.target.isConnected && !host.contains(e.target)) abrir(false); });
    pinta();
    return { get: function () { return items[cur].v; } };
  };
  function pickOrigen(host, orig, onPick) {
    GI.selectGrafico({ host: host, id: 'gsOri', label: 'Origen', value: filt.ori, onPick: onPick,
      items: [{ v: '', n: 'Todos los orígenes' }].concat(orig.map(function (r) { return { v: r.origen, n: r.origen, t: r.tipo }; })) });
  }

  function open(view, ctx) {
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Solicitudes' }];
    var all = load();
    var orig = all.filter(function (r, i, a) { return a.map(function (x) { return x.origen; }).indexOf(r.origen) === i; }).sort(function (a, b) { return a.origen.localeCompare(b.origen, 'es'); });
    view.innerHTML = '<div class="page-inner gi-page">' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">Solicitudes de control</h1>' +
      '<p class="page-subtitle">Reportes que llegan de las entidades deportivas y de las inspecciones. Un reporte nunca bloquea por sí solo: solo la medida lo hace.</p></div></header>' +
      '<section class="naowee-table-card"><div class="gs-bar"><div class="gs-chips" id="gsChips" role="group" aria-label="Filtrar por estado"></div>' +
      '<div class="gs-pick" id="gsPick"></div>' +
      '<div class="gs-find"><div class="gi-search gs-search">' + UI.svg('search') + '<input id="gsQ" type="search" aria-label="Buscar solicitud" placeholder="Buscar solicitud" value="' + esc(filt.q) + '"></div></div></div>' +
      '<div class="gi-table-wrap"><table class="gi-table"><thead><tr><th>Radicado</th><th>Origen</th><th>Persona</th><th>Evento y conducta</th><th>Estado</th></tr></thead><tbody id="gsBody"></tbody></table></div>' +
      '<nav class="gs-pag" id="gsPag" aria-label="Paginación" hidden></nav></section></div>';

    function paint() {
      var rows = load(), cnt = { '': rows.length };
      ESTADOS.forEach(function (e) { cnt[e[0]] = rows.filter(function (r) { return r.estado === e[0]; }).length; });
      d.getElementById('gsChips').innerHTML = [['', 'Todas']].concat(ESTADOS).map(function (e) {
        return '<button type="button" class="gi-qchip" data-k="' + e[0] + '" aria-pressed="' + (filt.est === e[0]) + '">' + e[1] + ' <b>' + cnt[e[0]] + '</b></button>';
      }).join('');
      var q = filt.q.trim().toLowerCase();
      var list = rows.filter(function (r) {
        return (!filt.est || r.estado === filt.est) && (!filt.ori || r.origen === filt.ori) &&
          (!q || (r.id + ' ' + (r.menor ? r.iniciales : r.nombre) + ' ' + r.doc + ' ' + r.origen + ' ' + r.tipo + ' ' + r.conductas.join(' ')).toLowerCase().indexOf(q) >= 0);
      });
      list.sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : a.id < b.id ? 1 : -1; });
      var pages = Math.max(1, Math.ceil(list.length / PAGE)); filt.pag = Math.min(Math.max(1, filt.pag), pages);
      var ini = (filt.pag - 1) * PAGE, vis = list.slice(ini, ini + PAGE);
      d.getElementById('gsBody').innerHTML = list.length ? vis.map(function (r) {
        return '<tr class="gs-row" tabindex="0" data-id="' + r.id + '"><td><strong>' + esc(r.id) + '</strong><small>' + esc(r.fecha) + '</small></td>' +
          '<td>' + origen(r) + '</td><td>' + persona(r) + '</td>' +
          '<td>' + evento(r) + '<small>' + esc(r.conductas.join('; ')) + '</small></td><td>' + badge(r.estado) + '</td></tr>';
      }).join('') : '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-secondary)">No hay solicitudes con esos filtros.</td></tr>';
      d.querySelectorAll('#gsChips [data-k]').forEach(function (b) { b.addEventListener('click', function () { filt.est = b.getAttribute('data-k'); filt.pag = 1; paint(); }); });
      pager(list.length, pages, ini, vis.length);
    }
    /* Paginador: Anterior, números (con puntos si son muchos) y Siguiente; la página actual lleva aria-current. */
    function pager(total, pages, ini, n) {
      var nav = d.getElementById('gsPag'); nav.hidden = !total; if (!total) return;
      var nums = [], i;
      for (i = 1; i <= pages; i++) if (pages <= 7 || i === 1 || i === pages || Math.abs(i - filt.pag) <= 1) nums.push(i); else if (nums[nums.length - 1] !== 0) nums.push(0);
      nav.innerHTML = '<p class="gs-pag__n" aria-live="polite">' + (ini + 1) + '–' + (ini + n) + ' de ' + total + '</p><div class="gs-pag__b">' +
        '<button type="button" class="gs-pg gs-pg--t" data-p="' + (filt.pag - 1) + '"' + (filt.pag === 1 ? ' disabled' : '') + '>Anterior</button>' +
        nums.map(function (k) { return k ? '<button type="button" class="gs-pg" data-p="' + k + '" aria-label="Página ' + k + '"' + (k === filt.pag ? ' aria-current="page"' : '') + '>' + k + '</button>' : '<span class="gs-pg__gap" aria-hidden="true">…</span>'; }).join('') +
        '<button type="button" class="gs-pg gs-pg--t" data-p="' + (filt.pag + 1) + '"' + (filt.pag === pages ? ' disabled' : '') + '>Siguiente</button></div>';
    }
    d.getElementById('gsPag').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b || b.disabled) return;
      filt.pag = +b.getAttribute('data-p'); paint();
      var k = d.querySelector('#gsPag [aria-current]'); if (k) k.focus();
      var sc = d.querySelector('.main-scroll'), card = d.querySelector('.gs-bar').parentNode;
      if (sc) { var dy = card.getBoundingClientRect().top - sc.getBoundingClientRect().top; if (dy < 0) sc.scrollTop += dy; }
    });
    d.getElementById('gsQ').addEventListener('input', function (e) { filt.q = e.target.value; filt.pag = 1; paint(); });
    pickOrigen(d.getElementById('gsPick'), orig, function (v) { filt.ori = v; filt.pag = 1; paint(); });
    /* La barra se fija arriba al hacer scroll; al pegarse gana sombra (en angosto se fija solo el buscador). */
    var sc2 = d.querySelector('.main-scroll'), bar = d.querySelector('.gs-bar'), find = d.querySelector('.gs-find');
    function pega() {
      if (!d.body.contains(bar)) return sc2.removeEventListener('scroll', pega);
      var el = getComputedStyle(bar).position === 'sticky' ? bar : find, top = sc2.getBoundingClientRect().top;
      var pegado = el.getBoundingClientRect().top <= top + 1 && sc2.scrollTop > 0;
      bar.classList.toggle('is-stuck', pegado && el === bar); find.classList.toggle('is-stuck', pegado && el === find);
    }
    /* En angosto el buscador sale de la barra para poder fijarse solo; en ancho vuelve a ella. */
    var mq = w.matchMedia('(max-width: 700px)');
    function acomoda() { if (!d.body.contains(bar)) return mq.removeListener(acomoda); if (mq.matches) bar.parentNode.insertBefore(find, bar.nextSibling); else bar.appendChild(find); pega(); }
    mq.addListener(acomoda); acomoda();
    if (sc2) { sc2.addEventListener('scroll', pega, { passive: true }); w.addEventListener('resize', pega); }
    function abrir(tr) { if (tr) detalle(tr.getAttribute('data-id'), paint); }
    d.getElementById('gsBody').addEventListener('click', function (e) { abrir(e.target.closest('tr[data-id]')); });
    d.getElementById('gsBody').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(e.target.closest('tr[data-id]')); } });
    paint();
  }

  function detalle(id, repaint) {
    var r = load().filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var flow = '<p class="gs-flow" aria-label="Flujo de la solicitud">' + ESTADOS.slice(0, 4).map(function (e) { return '<span class="' + (r.estado === e[0] ? 'is-on' : '') + '">' + e[1] + '</span>'; }).join('<span aria-hidden="true">›</span>') + '<span aria-hidden="true">·</span><span class="' + (r.estado === 'archivado' ? 'is-on' : '') + '">Archivado</span></p>';
    var body = flow +
      (r.menor ? '<p class="gs-note"><strong>Reserva reforzada.</strong> La persona es menor de edad: no se muestra su nombre.</p>' : '') +
      (r.estado === 'archivado' ? '<p class="gs-note"><strong>Archivada: ' + esc(r.motivoArchivo) + '.</strong> ' + esc(r.notaArchivo || '') + '</p>' : '') +
      (r.estado === 'derivo' ? '<p class="gs-note">Derivó en la medida <strong>' + (GI.get(r.medida) ? '<a href="' + UI.BASE + '/' + esc(r.medida) + '" data-x>' + esc(r.medida) + '</a>' : esc(r.medida)) + '</strong>.' + (GI.get(r.medida) ? ' Abre su ficha en Gestión.' : '') + '</p>' : '') +
      '<dl class="gs-det"><div><dt>Persona</dt><dd>' + (r.menor ? 'Menor de edad · ' + esc(r.iniciales) : esc(r.nombre)) + '</dd></div><div><dt>Documento</dt><dd>' + esc(r.doc) + '</dd></div>' +
      '<div><dt>Origen</dt><dd>' + origen(r) + '</dd></div><div><dt>Autoridad competente</dt><dd>' + esc(r.autoridad) + '</dd></div>' +
      '<div class="gs-wide"><dt>Evento</dt><dd>' + esc(r.evento) + '</dd></div><div class="gs-wide"><dt>Conductas</dt><dd>' + esc(r.conductas.join('; ')) + '</dd></div>' +
      '<div class="gs-wide"><dt>Relato</dt><dd>' + esc(r.descripcion) + '</dd></div><div><dt>Evidencia</dt><dd>' + esc(r.evid) + '</dd></div></dl>' +
      '<div class="gs-act" id="gsAct" hidden></div><h3 class="gs-sub">Historial</h3><ol class="gi-timeline">' + r.hist.slice().reverse().map(function (x) {
        return '<li><span class="gi-timeline__dot"></span><div><strong>' + esc(x.texto) + '</strong><small>' + esc(x.fecha) + ' · ' + esc(x.quien) + '</small></div></li>'; }).join('') + '</ol>' +
      '<div class="gs-act" id="gsAct" hidden></div>';
    var btns = '<button class="naowee-btn naowee-btn--mute" data-x>Cerrar</button>';
    if (r.estado === 'enviado') btns += '<button class="naowee-btn naowee-btn--loud" id="gsRec">Marcar como recibida</button>';
    if (r.estado === 'recibido') btns += '<button class="naowee-btn naowee-btn--mute" id="gsArc">Archivar con motivo</button><button class="naowee-btn naowee-btn--loud" id="gsTra">Pasar a en trámite</button>';
    if (r.estado === 'tramite') btns += '<button class="naowee-btn naowee-btn--mute" id="gsArc">Archivar con motivo</button><button class="naowee-btn naowee-btn--loud" id="gsEnl">Enlazar a medida</button>';
    var m = UI.modal({ title: r.id, sub: label(r.estado) + ' · ' + r.fecha, body: body, footer: btns, width: 640 });
    m.el.classList.add('gs-modal');
    var act = m.el.querySelector('#gsAct');

    function mover(a, texto, cambios, toast) {
      var f = stamp();
      Object.assign(r, cambios, { estado: a });
      r.hist.push(h(f, texto, USER, a === 'derivo' ? 'rojo' : a === 'tramite' ? 'amarillo' : 'gris'));
      save(); m.close(); UI.toast(toast); repaint();
    }
    function on(sel, fn) { var b = m.el.querySelector(sel); if (b) b.addEventListener('click', fn); }
    on('#gsRec', function () { mover('recibido', 'Recibido por el IVC', {}, 'Solicitud ' + r.id + ' marcada como recibida.'); });
    on('#gsTra', function () { mover('tramite', 'La autoridad abrió procedimiento', {}, 'Solicitud ' + r.id + ' en trámite.'); });
    on('#gsEnl', function () {
      var mismas = GI.all().filter(function (x) { return D.estadoRestriccion(x) !== 'Inactiva'; });
      var digs = r.doc.replace(/\D/g, '');
      mismas.sort(function (a, b) { return (b.numId === digs) - (a.numId === digs); });
      act.hidden = false; setTimeout(function () { act.scrollIntoView({ block: 'nearest' }); }, 0);
      act.innerHTML = '<label>Medida a enlazar<select id="gsMed"><option value="">Selecciona una medida</option>' + mismas.slice(0, 14).map(function (x) {
        return '<option value="' + x.id + '">' + x.id + ' · ' + (D.esMenor(x) ? 'Menor de edad' : esc(D.nombreCompleto(x))) + (x.numId === digs ? ' (misma persona)' : '') + '</option>'; }).join('') + '</select></label>' +
        '<p class="gi-err" id="gsErr" hidden>Selecciona la medida a enlazar.</p><button class="naowee-btn naowee-btn--loud gs-btn" id="gsEnlOk">Confirmar enlace</button>';
      act.querySelector('#gsEnlOk').addEventListener('click', function () {
        var v = act.querySelector('#gsMed').value;
        if (!v) { act.querySelector('#gsErr').hidden = false; return; }
        mover('derivo', 'Derivó en la medida ' + v, { medida: v }, 'Solicitud enlazada a la medida ' + v + '.');
      });
    });
    on('#gsArc', function () {
      act.hidden = false; setTimeout(function () { act.scrollIntoView({ block: 'nearest' }); }, 0);
      act.innerHTML = '<label>Motivo del archivo<select id="gsMot"><option value="">Selecciona un motivo</option>' + MOTIVOS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
        '<label>Nota (opcional)<textarea id="gsNota" rows="2"></textarea></label><p class="gi-err" id="gsErr" hidden>Selecciona un motivo para archivar.</p>' +
        '<button class="naowee-btn naowee-btn--loud gs-btn" id="gsArcOk">Archivar solicitud</button>';
      act.querySelector('#gsArcOk').addEventListener('click', function () {
        var v = act.querySelector('#gsMot').value;
        if (!v) { act.querySelector('#gsErr').hidden = false; return; }
        mover('archivado', 'Archivado · ' + v.charAt(0).toLowerCase() + v.slice(1), { motivoArchivo: v, notaArchivo: act.querySelector('#gsNota').value.trim() }, 'Solicitud archivada.');
      });
    });
  }

  SUID.views['control-acceso/solicitudes'] = open;
  /* La ficha de Gestión consulta aquí qué solicitudes derivaron en su medida. */
  w.GS = { porMedida: function (id) { return load().filter(function (x) { return x.medida === id; }); } };
})(window, document);
