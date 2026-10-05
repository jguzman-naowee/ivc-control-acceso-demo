/* Gestión de infractores (HU-26.3): modelo, reglas derivadas y datos ficticios del demo. */
(function (w) {
  'use strict';
  /* v3: el seed suma las personas que antes solo existían en Búsqueda. */
  var KEY = 'suid.gi.v3';
  var USER = 'Funcionario IVC';

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function iso(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function parse(s) { if (!s) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(s) { if (!s) return '—'; var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function today() { return iso(new Date()); }
  function now() { var n = new Date(); return { fecha: iso(n), hora: pad(n.getHours()) + ':' + pad(n.getMinutes()) }; }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function addMonths(s, n) {
    var d = parse(s), day = d.getDate();
    d.setMonth(d.getMonth() + n);
    if (d.getDate() !== day) d.setDate(0);
    return iso(d);
  }
  function ageAt(birth, ref) {
    var b = parse(birth), r = parse(ref || today());
    if (!b || !r) return null;
    var a = r.getFullYear() - b.getFullYear();
    if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) a--;
    return a;
  }

  /* El fin de vigencia arranca el día siguiente a la ejecutoria (Decreto 079, art. 6). */
  function finVigencia(r) {
    if (!r.fechaEjecutoria || !r.meses) return '';
    return addMonths(addDays(r.fechaEjecutoria, 1), +r.meses);
  }
  /* Menor de edad se mide a la fecha de los hechos, no a la de hoy. */
  function esMenor(r) {
    if (!r.fechaNac) return null;
    var a = ageAt(r.fechaNac, r.fechaHechos || today());
    return a == null ? null : a < 18;
  }
  /* Inactiva hasta que el registro sea Validado; Cumplida al día siguiente del fin. */
  function estadoRestriccion(r) {
    if (r.estadoRegistro !== 'Validado') return 'Inactiva';
    var fin = finVigencia(r);
    return fin && today() > fin ? 'Cumplida' : 'Activa';
  }
  function diasRestantes(r) {
    var fin = finVigencia(r);
    if (!fin) return null;
    return Math.round((parse(fin) - parse(today())) / 86400000);
  }
  function rangoMeses(txt) {
    var m = String(txt).match(/(\d+)\s*[–-]\s*(\d+)/);
    return m ? [+m[1], +m[2]] : null;
  }
  /* Primera vez que el registro pasa a Validado: ahí la restricción empieza a bloquear. */
  function fechaValidacion(r) {
    var h = (r.historial || []).find(function (x) { return x.a === 'Validado' && x.de !== 'Validado'; });
    return h ? h.fecha : '';
  }
  /* Primer día en que la medida figura Cumplida (solo si estuvo Validada). */
  function fechaCumplida(r) {
    var fin = finVigencia(r);
    return fin && fechaValidacion(r) ? addDays(fin, 1) : '';
  }
  function fechaDecision(r) {
    var h = (r.historial || []).find(function (x) { return x.de === 'Recibido' && x.a !== 'Recibido'; });
    return h ? h.fecha : '';
  }
  function devoluciones(r) {
    return (r.historial || []).filter(function (x) { return x.a === 'Por Subsanar' && x.de !== 'Por Subsanar'; }).map(function (x) { return x.fecha; });
  }
  function nombreCompleto(r) { return (r.nombres + ' ' + r.apellidos).trim(); }

  /* Solo presentación: el dato guardado no cambia. Miles con punto, es-CO. */
  function fmtMiles(s) { return /^\d+$/.test(String(s)) ? String(s).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(s); }
  /* Puntos solo en CC, CE y TI numéricos; pasaporte, PPT y enmascarados quedan como están. */
  function fmtDoc(tipoId, numId) {
    var m = /\((CC|CE|TI)\)\s*$/.exec(tipoId || '') || /^(CC|CE|TI)$/.exec(tipoId || '');
    return m ? fmtMiles(numId) : String(numId == null ? '' : numId);
  }
  /* Texto de la vigencia: Faltan n días, Falta 1 día, Vence hoy, Venció hace n días. */
  function fmtDias(n) {
    if (n == null) return '';
    var a = Math.abs(n), t = fmtMiles(a) + (a === 1 ? ' día' : ' días');
    return n > 0 ? (n === 1 ? 'Falta ' : 'Faltan ') + t : n === 0 ? 'Vence hoy' : 'Venció hace ' + t;
  }


  /* Historia ficticia para el panel (determinista, sin azar): 12 meses de entradas, salidas y reincidentes. */
  var NOM = ['Carlos Andrés', 'María José', 'Juan Camilo', 'Laura Sofía', 'Diego Alejandro', 'Paula Andrea', 'Mateo', 'Valentina', 'Jhon Fredy', 'Ana María', 'Óscar Iván', 'Karen Lorena', 'Felipe', 'Diana Carolina', 'Brayan Stiven', 'Yesica Paola', 'Nicolás', 'Sara Isabel', 'Cristian David', 'Mónica'];
  var APE = ['Gutiérrez', 'Rojas', 'Castaño', 'Ospina', 'Valencia', 'Peña', 'Mora', 'Suárez', 'Navarro', 'Cortés', 'Agudelo', 'Pineda', 'Salazar', 'Vargas', 'Londoño', 'Arias', 'Bermúdez', 'Cano', 'Escobar', 'Franco'];
  var LUG = [['Atlántico', 'Barranquilla'], ['Antioquia', 'Medellín'], ['Valle del Cauca', 'Cali'], ['Bogotá D.C.', 'Bogotá D.C.'], ['Santander', 'Bucaramanga'], ['Bolívar', 'Cartagena de Indias'], ['Risaralda', 'Pereira'], ['Caldas', 'Manizales'], ['Cesar', 'Valledupar'], ['Tolima', 'Ibagué']];
  var PAR = [['JUNIOR F.C.', 'ATLÉTICO NACIONAL'], ['MILLONARIOS F.C.', 'AMÉRICA DE CALI'], ['DEPORTES TOLIMA', 'ATLÉTICO BUCARAMANGA'], ['REAL CARTAGENA', 'ONCE CALDAS'], ['INDEPENDIENTE SANTA FE', 'DEPORTIVO CALI'], ['DEPORTIVO PEREIRA', 'ENVIGADO F.C.']];
  var DESC = ['Intentó ingresar con un objeto peligroso.', 'Poseía sustancias estupefacientes al ingresar.', 'Agredió a un miembro de la fuerza pública.', 'Invadió el terreno de juego.', 'Ocupó una zona no autorizada pese a la logística.', 'Ingresó bebidas alcohólicas.', 'Agresión física a otro asistente.', 'Agresión verbal reiterada.', 'Daño a la infraestructura del estadio.'];
  /* [persona, ejecutoria, meses, origen, opciones]: dev = devuelto a subsanar antes de validar; m = menor; e = estado pendiente. */
  var EXTRA = [
    [1, '2025-04-10', 6, 3], [2, '2024-11-12', 12, 4], [11, '2025-06-03', 6, 3], [3, '2025-06-18', 7, 5], [10, '2025-05-16', 9, 0],
    [12, '2025-07-08', 8, 5], [7, '2024-10-15', 18, 2], [8, '2025-09-20', 8, 5], [5, '2025-08-12', 12, 0], [6, '2024-10-05', 24, 1],
    [4, '2025-10-08', 6, 2], [30, '2025-09-10', 12, 1], [31, '2025-10-28', 12, 0], [13, '2025-10-21', 36, 3, { m: 1 }], [2, '2025-11-06', 12, 0], [9, '2025-11-25', 7, 4], [14, '2025-11-19', 6, 4],
    [1, '2025-12-02', 24, 8], [15, '2025-12-11', 8, 5], [16, '2025-12-17', 40, 6], [17, '2026-01-13', 6, 1], [18, '2026-02-04', 18, 0],
    [0, '2026-02-18', 12, 3], [19, '2026-03-17', 6, 5], [20, '2026-04-08', 12, 2, { dev: 1 }], [21, '2026-05-12', 12, 4, { m: 1 }],
    [3, '2026-06-02', 24, 0], [22, '2026-06-16', 6, 1, { dev: 1 }], [23, '2026-07-01', 36, 0], [24, '2026-07-14', 10, 5, { dev: 1 }],
    [25, '2026-07-24', 12, 3, { m: 1 }], [4, '2026-08-05', 12, 5], [26, '2026-08-19', 18, 0, { dev: 1 }], [27, '2026-09-08', 24, 2],
    [28, '2026-09-03', 12, 5, { e: 'Por Subsanar' }], [29, '2026-09-18', 6, 4, { e: 'Recibido' }]
  ];
  function seedExtra(mk, H) {
    var seq = 9;
    return EXTRA.map(function (x, i) {
      var p = x[0], ej = x[1], o = x[4] || {}, rad = addDays(ej, 3), lag = 2 + ((i * 3) % 5);
      var N = NOM[p % NOM.length], A = APE[(p * 7) % APE.length] + ' ' + APE[(p * 3 + 5) % APE.length], L = LUG[p % LUG.length], pa = PAR[i % PAR.length];
      var persona = p === 0
        ? { tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100009', nombres: 'Sebastián', apellidos: 'Herrera Lozano', fechaNac: '1993-10-19', sexo: 'Hombre', depto: 'Cesar', ciudad: 'Valledupar' }
        : { tipoId: o.m ? 'Tarjeta de Identidad (TI)' : 'Cédula de Ciudadanía (CC)', numId: String(1020300000 + p * 37), nombres: N, apellidos: A,
            fechaNac: o.m ? '2009-0' + (1 + p % 9) + '-1' + (p % 9) : (1980 + p % 20) + '-0' + (1 + p % 9) + '-1' + (p % 9), sexo: p % 2 ? 'Mujer' : 'Hombre', depto: L[0], ciudad: L[1] };
      seq++;
      var id = 'INF-' + rad.slice(0, 4) + '-' + String(seq).padStart(4, '0');
      var hist = [H(rad, '09:' + pad(10 + i), '', 'Recibido', 'Expediente radicado y recibido.')], estado = o.e || 'Validado';
      var devD = o.dev ? addDays(rad, 3) : '';
      if (o.dev) hist.push(H(devD, '11:20', 'Recibido', 'Por Subsanar', 'Falta la constancia de ejecutoria con firma.'));
      if (estado === 'Por Subsanar') { hist = [hist[0], H(addDays(rad, 3), '11:20', 'Recibido', 'Por Subsanar', 'Falta el acto administrativo completo.')]; }
      if (estado === 'Validado') {
        var val = addDays(o.dev ? devD : rad, lag);
        hist.push(H(val, '14:' + pad(10 + i), o.dev ? 'Por Subsanar' : 'Recibido', 'Validado'));
        var r0 = { fechaEjecutoria: ej, meses: x[2] }, fin = finVigencia(r0);
        if (today() > fin) hist.push(H(addDays(fin, 1), '00:05', 'Validado', 'Validado', 'La restricción pasó a Cumplida al terminar su vigencia (automático).'));
      }
      var y = rad.slice(0, 4);
      return mk(Object.assign({ id: id, fechaRegistro: rad, dir: 'KR ' + (10 + p) + ' # ' + (20 + p) + ' - ' + (10 + i), telefono: '30011' + String(20000 + p * 11), correo: '',
        fechaHechos: addDays(ej, -30), local: pa[0], visitante: pa[1], ciudadHechos: persona.ciudad, origen: [x[3]], descripcion: DESC[x[3]],
        fechaActo: addDays(ej, -7), numActo: 'RES-' + pad(100 + i) + '-' + y, fechaEjecutoria: ej, meses: x[2], valor: x[2] * 150000,
        fechaRadicado: rad, radEntrada: 'GESDOC-' + y + '-' + String(20000 + i * 17), radContab: estado === 'Validado' ? 'GESDOC-' + y + '-' + String(20400 + i * 17) : '',
        radJuridica: estado === 'Validado' ? 'GESDOC-' + y + '-' + String(20800 + i * 17) : '', estadoRegistro: estado, historial: hist,
        observaciones: estado === 'Por Subsanar' ? 'Falta el acto administrativo completo. Se devuelve a la inspección de policía.' : '',
        rep: o.m ? { tipoId: 'Cédula de Ciudadanía (CC)', numId: String(1030300000 + p * 41), nombres: 'Representante', apellidos: A.split(' ')[0], pais: 'Colombia', depto: L[0], ciudad: L[1], dir: 'KR 1 # 2 - 3', indicativo: '+57', telefono: '3001190000', correo: '', fechaNac: '1980-01-15', sexo: 'Mujer' } : null
      }, persona));
    });
  }

  /* Personas que el SVN reporta y que Búsqueda también lista: cada medida es un registro de Gestión (INF-…, continúa tras los de arriba). */
  var SVN_P = [
    ['CC', '71894447', 'Julián Andrés', 'Posada', '1991-06-14', 'Hombre', 'Antioquia', 'Medellín'],
    ['CC', '1045223871', 'Carlos Eduardo', 'Ramírez Soto', '1989-02-03', 'Hombre', 'Atlántico', 'Barranquilla'],
    ['CC', '43871022', 'Luz Marina', 'Ramírez Gil', '1978-09-27', 'Mujer', 'Antioquia', 'Medellín'],
    ['CC', '1143267894', 'Jhon Alexander', 'Ramírez Mora', '1996-12-08', 'Hombre', 'Valle del Cauca', 'Cali'],
    ['CC', '52987431', 'Sandra Milena', 'Ramírez Torres', '1984-04-19', 'Mujer', 'Bogotá D.C.', 'Bogotá D.C.'],
    ['CC', '1098765432', 'Wilmer', 'Ramírez Peña', '1995-07-11', 'Hombre', 'Santander', 'Bucaramanga'],
    ['CC', '1032456789', 'Diana Carolina', 'Ramírez Ortega', '1992-10-30', 'Mujer', 'Bogotá D.C.', 'Bogotá D.C.'],
    ['CE', '7050021', 'Fabián', 'Ramírez Cortés', '1987-01-22', 'Hombre', 'Bolívar', 'Cartagena de Indias'],
    ['CC', '1152230981', 'Natalia', 'Ramírez Duque', '1999-05-16', 'Mujer', 'Risaralda', 'Pereira'],
    ['CC', '79456123', 'Héctor', 'Ramírez Salgado', '1981-08-05', 'Hombre', 'Cesar', 'Valledupar'],
    ['CC', '1020987654', 'Mónica', 'Ramírez Vélez', '1990-03-14', 'Mujer', 'Caldas', 'Manizales'],
    ['CC', '88123456', 'Éver', 'Ramírez Pinto', '1985-11-09', 'Hombre', 'Norte de Santander', 'Cúcuta'],
    ['TI', '1109876543', 'S.', 'Ramírez R.', '2010-03-15', 'Hombre', 'Valle del Cauca', 'Cali']
  ];
  /* [persona, ejecutoria, meses, origen]: la última persona es menor (con representante). */
  var SVN = [
    [0, '2025-11-30', 18, 6], [0, '2025-03-02', 6, 5], [1, '2026-04-05', 6, 6], [1, '2025-02-10', 6, 5], [2, '2026-08-12', 12, 5], [3, '2026-01-20', 24, 3],
    [4, '2025-09-10', 12, 7], [5, '2026-05-20', 8, 8], [6, '2025-12-01', 18, 6], [6, '2024-02-15', 6, 7], [7, '2026-07-02', 36, 0], [8, '2024-05-15', 12, 1],
    [9, '2026-03-02', 7, 6], [10, '2026-02-14', 24, 3], [10, '2026-06-01', 12, 5], [11, '2025-11-05', 10, 7], [12, '2026-06-10', 6, 5]
  ];
  function seedSvn(mk, H, seq0) {
    return SVN.map(function (x, i) {
      var q = SVN_P[x[0]], ej = x[1], rad = addDays(ej, 3), menor = x[0] === SVN_P.length - 1, y = rad.slice(0, 4), pa = PAR[i % PAR.length], lag = 2 + (i % 5), fin = finVigencia({ fechaEjecutoria: ej, meses: x[2] });
      var hist = [H(rad, '10:' + pad(10 + i), '', 'Recibido', 'Expediente radicado y recibido.'), H(addDays(rad, lag), '15:' + pad(10 + i), 'Recibido', 'Validado')];
      if (today() > fin) hist.push(H(addDays(fin, 1), '00:05', 'Validado', 'Validado', 'La restricción pasó a Cumplida al terminar su vigencia (automático).'));
      return mk({ id: 'INF-' + y + '-' + String(seq0 + i).padStart(4, '0'), fechaRegistro: rad, tipoId: q[0] === 'CE' ? 'Cédula de Extranjería (CE)' : q[0] === 'TI' ? 'Tarjeta de Identidad (TI)' : 'Cédula de Ciudadanía (CC)', numId: q[1],
        nombres: q[2], apellidos: q[3], fechaNac: q[4], sexo: q[5], depto: q[6], ciudad: q[7], dir: 'KR ' + (20 + i) + ' # ' + (30 + i) + ' - ' + (10 + i), telefono: '30012' + String(30000 + i * 13), correo: '',
        fechaHechos: addDays(ej, -30), local: pa[0], visitante: pa[1], ciudadHechos: q[7], origen: [x[3]], descripcion: DESC[x[3]], fechaActo: addDays(ej, -7), numActo: 'RES-' + pad(200 + i) + '-' + y,
        fechaEjecutoria: ej, meses: x[2], valor: x[2] * 150000, fechaRadicado: rad, radEntrada: 'GESDOC-' + y + '-' + String(30000 + i * 17), radContab: 'GESDOC-' + y + '-' + String(30400 + i * 17),
        radJuridica: 'GESDOC-' + y + '-' + String(30800 + i * 17), estadoRegistro: 'Validado', historial: hist,
        rep: menor ? { tipoId: 'Cédula de Ciudadanía (CC)', numId: '1030300999', nombres: 'Representante', apellidos: 'Ramírez', pais: 'Colombia', depto: q[6], ciudad: q[7], dir: 'KR 1 # 2 - 3', indicativo: '+57', telefono: '3001190001', correo: '', fechaNac: '1982-04-12', sexo: 'Mujer' } : null });
    });
  }

  function seed() {
    var H = function (f, h, de, a, nota) { return { fecha: f, hora: h, usuario: USER, de: de, a: a, nota: nota || '' }; };
    var base = {
      pais: 'Colombia', rural: false, indicativo: '+57', profesional: 'Marcela Ortiz',
      respuesta: '', observaciones: '', competicion: 'Liga', valor: 0, otraCompeticion: '', rep: null,
      agravantes: [], infoAdic: ''
    };
    function mk(o) { return Object.assign({}, base, o); }
    var orig = [
      mk({ id: 'INF-2026-0001', fechaRegistro: '2026-03-12', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100001', nombres: 'Andrés Felipe', apellidos: 'Ramírez Cuesta', depto: 'Atlántico', ciudad: 'Barranquilla', dir: 'KR 45 # 76 - 30 AP 301', telefono: '3001110001', correo: 'a.ramirez@ejemplo.test', fechaNac: '1994-05-08', sexo: 'Hombre', fechaHechos: '2026-02-08', local: 'JUNIOR F.C.', visitante: 'MILLONARIOS F.C.', ciudadHechos: 'Barranquilla', origen: [0], descripcion: 'Intentó ingresar al escenario con un objeto cortopunzante.', fechaActo: '2026-02-26', numActo: 'RES-0148-2026', fechaEjecutoria: '2026-03-10', meses: 24, valor: 4200000, fechaRadicado: '2026-03-12', radEntrada: 'GESDOC-2026-004412', radContab: 'GESDOC-2026-004577', radJuridica: 'GESDOC-2026-004598', estadoRegistro: 'Validado',
        historial: [H('2026-03-12', '09:14', '', 'Recibido', 'Expediente radicado y recibido por el profesional.'), H('2026-03-16', '15:40', 'Recibido', 'Validado', 'Cumple los requisitos formales.')] }),
      mk({ id: 'INF-2026-0002', fechaRegistro: '2026-03-30', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100002', nombres: 'Luisa Fernanda', apellidos: 'Mejía Arango', depto: 'Antioquia', ciudad: 'Medellín', dir: 'CL 33 # 65 - 12', telefono: '3001110002', correo: 'l.mejia@ejemplo.test', fechaNac: '1991-11-21', sexo: 'Mujer', fechaHechos: '2026-03-01', local: 'ATLÉTICO NACIONAL', visitante: 'DEPORTIVO CALI', ciudadHechos: 'Medellín', origen: [6], agravantes: [0], descripcion: 'Agresión física a otro asistente en la tribuna occidental.', fechaActo: '2026-03-20', numActo: 'RES-0171-2026', fechaEjecutoria: '2026-03-28', meses: 48, valor: 6800000, fechaRadicado: '2026-03-30', radEntrada: 'GESDOC-2026-005120', radContab: 'GESDOC-2026-005233', radJuridica: 'GESDOC-2026-005240', estadoRegistro: 'Validado',
        historial: [H('2026-03-30', '10:02', '', 'Recibido'), H('2026-04-02', '11:25', 'Recibido', 'Validado')] }),
      mk({ id: 'INF-2026-0003', fechaRegistro: '2026-04-14', tipoId: 'Tarjeta de Identidad (TI)', numId: '1020200003', nombres: 'Santiago', apellidos: 'Pardo Villegas', depto: 'Valle del Cauca', ciudad: 'Cali', dir: 'KR 8 # 20 - 41', telefono: '3001110003', correo: '', fechaNac: '2010-09-02', sexo: 'Hombre', fechaHechos: '2026-03-22', local: 'AMÉRICA DE CALI', visitante: 'DEPORTES TOLIMA', ciudadHechos: 'Cali', origen: [3], descripcion: 'Invadió el terreno de juego al finalizar el partido.', fechaActo: '2026-04-06', numActo: 'RES-0203-2026', fechaEjecutoria: '2026-04-13', meses: 12, valor: 1900000, fechaRadicado: '2026-04-14', radEntrada: 'GESDOC-2026-006011', radContab: 'GESDOC-2026-006090', radJuridica: 'GESDOC-2026-006101', estadoRegistro: 'Validado',
        rep: { tipoId: 'Cédula de Ciudadanía (CC)', numId: '1030300003', nombres: 'Claudia Patricia', apellidos: 'Villegas Mora', pais: 'Colombia', depto: 'Valle del Cauca', ciudad: 'Cali', dir: 'KR 8 # 20 - 41', indicativo: '+57', telefono: '3001119003', correo: 'c.villegas@ejemplo.test', fechaNac: '1983-02-17', sexo: 'Mujer' },
        historial: [H('2026-04-14', '08:50', '', 'Recibido'), H('2026-04-17', '16:05', 'Recibido', 'Validado', 'Menor de edad: representante legal verificado.')] }),
      mk({ id: 'INF-2026-0004', fechaRegistro: '2026-05-06', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100004', nombres: 'Camilo Esteban', apellidos: 'Duarte Quintero', depto: 'Santander', ciudad: 'Bucaramanga', dir: 'CL 36 # 27 - 55', telefono: '3001110004', correo: 'c.duarte@ejemplo.test', fechaNac: '1988-07-30', sexo: 'Hombre', fechaHechos: '2026-04-19', local: 'ATLÉTICO BUCARAMANGA', visitante: 'ENVIGADO F.C.', ciudadHechos: 'Bucaramanga', origen: [5], descripcion: 'Ingresó bebidas alcohólicas en el estadio.', fechaActo: '2026-04-30', numActo: 'RES-0230-2026', fechaEjecutoria: '2026-05-05', meses: 6, valor: 900000, fechaRadicado: '2026-05-06', radEntrada: 'GESDOC-2026-006930', radContab: 'GESDOC-2026-006988', radJuridica: 'GESDOC-2026-006995', estadoRegistro: 'Validado',
        historial: [H('2026-05-06', '09:30', '', 'Recibido'), H('2026-05-08', '14:12', 'Recibido', 'Validado')] }),
      mk({ id: 'INF-2026-0005', fechaRegistro: '2026-08-18', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100005', nombres: 'Natalia', apellidos: 'Gómez Restrepo', depto: 'Bolívar', ciudad: 'Cartagena de Indias', dir: 'CL 30 # 17 - 08', telefono: '3001110005', correo: 'n.gomez@ejemplo.test', fechaNac: '1997-01-14', sexo: 'Mujer', fechaHechos: '2026-07-26', competicion: 'Copa', local: 'REAL CARTAGENA', visitante: 'DEPORTIVO PASTO', ciudadHechos: 'Cartagena de Indias', origen: [2], descripcion: 'Agredió a un integrante de la logística durante el ingreso.', fechaActo: '2026-08-10', numActo: 'RES-0298-2026', fechaEjecutoria: '2026-08-14', meses: 18, valor: 3300000, fechaRadicado: '2026-08-18', radEntrada: 'GESDOC-2026-009210', radContab: '', radJuridica: '', estadoRegistro: 'Recibido',
        historial: [H('2026-08-18', '10:41', '', 'Recibido', 'Expediente radicado en el Ministerio.')] }),
      mk({ id: 'INF-2026-0006', fechaRegistro: '2026-08-25', tipoId: 'Cédula de Extranjería (CE)', numId: '7040400006', nombres: 'Marco', apellidos: 'Bianchi Torres', depto: 'Cundinamarca', ciudad: 'Bogotá D.C.', dir: 'AC 26 # 59 - 51 ED 2', telefono: '3001110006', correo: 'm.bianchi@ejemplo.test', fechaNac: '1990-12-03', sexo: 'Hombre', fechaHechos: '2026-08-02', local: 'MILLONARIOS F.C.', visitante: 'INDEPENDIENTE SANTA FE', ciudadHechos: 'Bogotá D.C.', origen: [1], descripcion: 'Poseía sustancias estupefacientes al ingresar.', fechaActo: '2026-08-19', numActo: 'RES-0310-2026', fechaEjecutoria: '2026-08-22', meses: 20, valor: 2700000, fechaRadicado: '2026-08-25', radEntrada: 'GESDOC-2026-009440', radContab: '', radJuridica: '', estadoRegistro: 'Por Subsanar',
        observaciones: 'Falta la constancia de ejecutoria con firma. Se devuelve a la inspección de policía.',
        historial: [H('2026-08-25', '11:02', '', 'Recibido'), H('2026-08-28', '09:48', 'Recibido', 'Por Subsanar', 'Falta la constancia de ejecutoria con firma.')] }),
      mk({ id: 'INF-2026-0007', fechaRegistro: '2026-09-02', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100007', nombres: 'Daniela', apellidos: 'Torres Beltrán', depto: 'Risaralda', ciudad: 'Pereira', dir: 'KR 7 # 19 - 24', telefono: '3001110007', correo: 'd.torres@ejemplo.test', fechaNac: '1999-06-25', sexo: 'Mujer', fechaHechos: '2026-08-09', competicion: 'Liga Femenina', local: 'DEPORTIVO PEREIRA', visitante: 'REAL CARTAGENA', ciudadHechos: 'Pereira', origen: [7], descripcion: 'Agresión verbal reiterada contra el cuerpo arbitral.', fechaActo: '2026-08-26', numActo: 'RES-0324-2026', fechaEjecutoria: '2026-08-31', meses: 12, valor: 1500000, fechaRadicado: '2026-09-02', radEntrada: 'GESDOC-2026-009801', radContab: 'GESDOC-2026-009877', radJuridica: 'GESDOC-2026-009880', estadoRegistro: 'Validado',
        historial: [H('2026-09-02', '10:15', '', 'Recibido'), H('2026-09-04', '12:30', 'Recibido', 'Validado')] }),
      mk({ id: 'INF-2026-0008', fechaRegistro: '2026-09-16', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100008', nombres: 'Julián David', apellidos: 'Cardona Ruiz', depto: 'Caldas', ciudad: 'Manizales', dir: 'CL 21 # 23 - 70', telefono: '3001110008', correo: '', fechaNac: '1986-04-11', sexo: 'Hombre', fechaHechos: '2026-08-30', local: 'ONCE CALDAS', visitante: 'DEPORTES QUINDÍO', ciudadHechos: 'Manizales', origen: [8], agravantes: [1], descripcion: 'Daño a la infraestructura del estadio y a vehículos aledaños.', fechaActo: '2026-09-10', numActo: 'RES-0351-2026', fechaEjecutoria: '2026-09-14', meses: 36, valor: 8100000, fechaRadicado: '2026-09-16', radEntrada: 'GESDOC-2026-010302', radContab: '', radJuridica: '', estadoRegistro: 'Recibido',
        historial: [H('2026-09-16', '15:22', '', 'Recibido')] }),
      mk({ id: 'INF-2026-0009', fechaRegistro: '2025-02-10', tipoId: 'Cédula de Ciudadanía (CC)', numId: '1010100009', nombres: 'Sebastián', apellidos: 'Herrera Lozano', depto: 'Cesar', ciudad: 'Valledupar', dir: 'KR 9 # 16 - 33', telefono: '3001110009', correo: 's.herrera@ejemplo.test', fechaNac: '1993-10-19', sexo: 'Hombre', fechaHechos: '2025-01-18', local: 'ALIANZA VALLEDUPAR F.C.', visitante: 'ÁGUILAS DORADAS', ciudadHechos: 'Valledupar', origen: [4], descripcion: 'Desatendió las indicaciones de logística y ocupó una zona no autorizada.', fechaActo: '2025-02-01', numActo: 'RES-0044-2025', fechaEjecutoria: '2025-02-07', meses: 6, valor: 700000, fechaRadicado: '2025-02-10', radEntrada: 'GESDOC-2025-001204', radContab: 'GESDOC-2025-001260', radJuridica: 'GESDOC-2025-001263', estadoRegistro: 'Validado',
        historial: [H('2025-02-10', '09:00', '', 'Recibido'), H('2025-02-13', '10:10', 'Recibido', 'Validado'), H('2025-08-08', '00:05', 'Validado', 'Validado', 'La restricción pasó a Cumplida al terminar su vigencia (automático).')] })
    ];
    /* Lo más reciente primero, como la bandeja cuando se registra uno nuevo. */
    return orig.concat(seedExtra(mk, H), seedSvn(mk, H, 46)).sort(function (a, b) { return a.fechaRegistro < b.fechaRegistro ? 1 : a.fechaRegistro > b.fechaRegistro ? -1 : 0; });
  }


  /* ───────── cifras del panel: todo sale de las reglas de arriba, nada escrito a mano ───────── */
  function enVentana(f, desde, hasta) { return !!f && f > desde && f <= hasta; }
  function diasEntre(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function promedio(v) { return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }

  /* Entra: el día que queda Validada. Sale: el día siguiente al fin de vigencia. */
  /* Valores de demostración (10 a 90), a mano: irregulares, con meses iguales y cruces; al final salen > nuevos (DC-177).
     Del más viejo al más nuevo, más los registros reales; el último mes está en curso. */
  var BASE_NUEVOS = [34, 52, 49, 77, 88, 62, 40, 43, 71, 66, 38, 27];
  var BASE_SALEN = [78, 41, 50, 30, 22, 64, 44, 46, 29, 40, 52, 68];
  function serieMensual(n) {
    var hoy = parse(today()), regs = load(), out = [];
    function acota(v) { return Math.max(10, Math.min(90, v)); }
    for (var i = n - 1; i >= 0; i--) {
      var m = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1), key = m.getFullYear() + '-' + pad(m.getMonth() + 1), k = BASE_NUEVOS.length - 1 - i;
      out.push({
        key: key, anio: m.getFullYear(), mes: m.getMonth(),
        nuevos: acota(BASE_NUEVOS[k] + regs.filter(function (r) { return fechaValidacion(r).slice(0, 7) === key; }).length),
        salen: acota(BASE_SALEN[k] + regs.filter(function (r) { var f = fechaCumplida(r); return f && f <= today() && f.slice(0, 7) === key; }).length)
      });
    }
    return out;
  }
  function insights() {
    var regs = load(), hoy = today(), h90 = addDays(hoy, -90), h180 = addDays(hoy, -180);
    var activas = regs.filter(function (r) { return estadoRestriccion(r) === 'Activa'; });
    var por30 = activas.filter(function (r) { return diasRestantes(r) <= 30; });
    var proxima = por30.slice().sort(function (a, b) { return diasRestantes(a) - diasRestantes(b); })[0] || null;

    var sin = regs.filter(function (r) { return r.estadoRegistro !== 'Validado' && finVigencia(r); }).map(function (r) {
      return { id: r.id, dias: Math.max(0, diasEntre(addDays(r.fechaEjecutoria, 1), hoy)), total: Math.round((parse(finVigencia(r)) - parse(addDays(r.fechaEjecutoria, 1))) / 86400000) };
    });
    var sinMax = sin.slice().sort(function (a, b) { return b.dias - a.dias; })[0] || null;

    function revision(desde, hasta) {
      return promedio(regs.filter(function (r) { return enVentana(fechaDecision(r), desde, hasta); }).map(function (r) { return diasEntre(r.historial[0].fecha, fechaDecision(r)); }));
    }
    var recibidos = regs.filter(function (r) { return r.estadoRegistro === 'Recibido'; }).map(function (r) { return diasEntre(r.historial[0].fecha, hoy); });

    function devueltos(desde, hasta) {
      var n = 0, rec = 0;
      regs.forEach(function (r) { devoluciones(r).forEach(function (f) { if (enVentana(f, desde, hasta)) n++; }); if (enVentana(r.fechaRegistro, desde, hasta)) rec++; });
      return { n: n, recibidos: rec };
    }

    var desde36 = addMonths(hoy, -36), porPersona = {};
    regs.forEach(function (r) { if (r.fechaEjecutoria >= desde36) { var k = r.tipoId + '|' + r.numId; porPersona[k] = (porPersona[k] || 0) + 1; } });
    var personas = Object.keys(porPersona).length, reinc = Object.keys(porPersona).filter(function (k) { return porPersona[k] >= 2; }).length;

    function conductas(desde, hasta) {
      var rs = regs.filter(function (r) { return enVentana(r.fechaRegistro, desde, hasta); }), c = {};
      rs.forEach(function (r) { r.origen.forEach(function (i) { c[i] = (c[i] || 0) + 1; }); });
      return { total: rs.length, c: c };
    }
    var cAct = conductas(h90, hoy), cPrev = conductas(h180, h90);
    var top = Object.keys(cAct.c).sort(function (a, b) { return cAct.c[b] - cAct.c[a] || a - b; })[0];

    return {
      vigentes: activas.length, por30: por30.length, proximaFin: proxima ? finVigencia(proxima) : '', proximaDias: proxima ? diasRestantes(proxima) : null,
      sinValidar: sin.length, sinDiasProm: promedio(sin.map(function (x) { return x.dias; })), sinMax: sinMax,
      revActual: revision(h90, hoy), revPrevio: revision(h180, h90), pendienteViejo: recibidos.length ? Math.max.apply(null, recibidos) : null,
      dev: devueltos(h90, hoy), devPrev: devueltos(h180, h90),
      personas: personas, reincidentes: reinc,
      conducta: top == null ? null : { idx: +top, n: cAct.c[top], total: cAct.total, prevN: cPrev.c[top] || 0, prevTotal: cPrev.total }
    };
  }

  var cache = null;
  function load() {
    if (cache) return cache;
    try { var raw = localStorage.getItem(KEY); if (raw) { cache = JSON.parse(raw); return cache; } } catch (e) {}
    cache = seed();
    persist();
    return cache;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {} }

  function nextId() {
    var n = load().reduce(function (m, r) { return Math.max(m, +r.id.split('-')[2] || 0); }, 0) + 1;
    return 'INF-' + new Date().getFullYear() + '-' + String(n).padStart(4, '0');
  }

  function duplicado(r, exceptId) {
    return load().find(function (x) {
      return x.id !== exceptId && x.tipoId === r.tipoId && x.numId === r.numId &&
        x.numActo === r.numActo && x.fechaEjecutoria === r.fechaEjecutoria;
    }) || null;
  }

  /* Solo al pintar: los datos y las llaves de comparación siguen en su forma original (DC-173). */
  var SIGLAS = /^(?:(?:[A-Z]\.)+|DAF|IVC|SUID|CC|CE|TI|PEP|PPT|RUMV|SAS|SA)$/, CONECT = /^(?:de|del|la|las|los|el|y|e|en|vs\.?)$/i;
  function titulo(s) {
    return String(s == null ? '' : s).split(/(\s+)/).map(function (t, i) {
      if (/[a-záéíóúñü]/.test(t) || !/[A-ZÁÉÍÓÚÑÜ]/.test(t) || SIGLAS.test(t)) return t;
      if (i && CONECT.test(t)) return t.toLowerCase();
      return t.toLowerCase().replace(/(^|[(\-\/])([a-záéíóúñü])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }).join('');
  }

  w.GI = {
    cat: w.GI_CAT, USER: USER, titulo: titulo,
    util: { iso: iso, parse: parse, fmt: fmt, today: today, now: now, addDays: addDays, addMonths: addMonths, ageAt: ageAt, rangoMeses: rangoMeses },
    derive: { fechaValidacion: fechaValidacion, fechaCumplida: fechaCumplida, fechaDecision: fechaDecision, devoluciones: devoluciones, finVigencia: finVigencia, esMenor: esMenor, estadoRestriccion: estadoRestriccion, diasRestantes: diasRestantes, nombreCompleto: nombreCompleto },
    all: function () { return load().slice(); },
    get: function (id) { return load().find(function (r) { return r.id === id; }) || null; },
    duplicado: duplicado,
    fmtMiles: fmtMiles, fmtDoc: fmtDoc, fmtDias: fmtDias,
    stats: { serieMensual: serieMensual, insights: insights },
    /* Cada alta o cambio de estado deja usuario, fecha, hora, estado anterior y nuevo. */
    add: function (r) {
      var n = now();
      r.id = nextId();
      r.fechaRegistro = n.fecha;
      r.estadoRegistro = 'Recibido';
      r.historial = [{ fecha: n.fecha, hora: n.hora, usuario: USER, de: '', a: 'Recibido', nota: 'Registro creado.' }];
      load().unshift(r);
      persist();
      return r;
    },
    update: function (id, patch, nota) {
      var r = this.get(id);
      Object.assign(r, patch);
      var n = now();
      r.historial.push({ fecha: n.fecha, hora: n.hora, usuario: USER, de: r.estadoRegistro, a: r.estadoRegistro, nota: nota || 'Registro actualizado.' });
      persist();
      return r;
    },
    setEstado: function (id, nuevo, nota) {
      var r = this.get(id), n = now();
      r.historial.push({ fecha: n.fecha, hora: n.hora, usuario: USER, de: r.estadoRegistro, a: nuevo, nota: nota || '' });
      r.estadoRegistro = nuevo;
      if (nuevo === 'Por Subsanar' && nota) r.observaciones = nota;
      persist();
      return r;
    },
    reset: function () { cache = seed(); persist(); }
  };
})(window);
