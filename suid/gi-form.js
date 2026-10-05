/* Registro / edición de infractor: 55 campos en 6 bloques (Fuente 2). Interacción dinámica: DC-250, DC-251, DC-252. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, C = GI.cat, UI = w.GIUI, esc = SUID.esc;
  var st, editId, view, ctxRef;
  var lastDep = {}, auto = {}, touched = {}, evs = [], pcache = {}, cur = 'start', visited = {};
  var SECS = ['ctrl', 'inf', 'rep', 'hec', 'san', 'int'];
  var TITLES = { ctrl: 'Control del registro', inf: 'Infractor', rep: 'Representante o tutor', hec: 'Hechos y conducta', san: 'Sobre la sanción', int: 'Gestión interna' };
  var HINTS = { ctrl: 'La fecha de registro la genera el sistema.', inf: 'Identificación, residencia y contacto.', rep: 'Solo si el infractor es menor de edad.', hec: 'Fecha, evento deportivo y conductas.', san: 'Acto administrativo, ejecutoria y meses de sanción.', int: 'Radicado y profesional responsable.' };
  var NEXT = '<svg class="gi-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  /* Ayuda en lenguaje natural bajo los campos que se pre-llenan; se ocultan al editarlos. */
  var AH = { fechaRadicado: 'Usamos la fecha de hoy.', radEntrada: 'Tomamos el siguiente radicado disponible; cámbialo si es otro.', profesional: 'Te asignamos como responsable; puedes elegir a otra persona.', meses: 'Tomamos el mínimo del rango de la conducta; ajústalo según el acto.', descripcion: 'Partimos del texto base de la conducta; completa con los hechos.' };
  var CHECK = '<svg class="gf-ck" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function blankPerson() {
    return { tipoId: '', numId: '', nombres: '', apellidos: '', pais: 'Colombia', depto: '', ciudad: '', rural: 'No', viaRural: '', infoRural: '', dirLibre: '', dirPrev: '',
      a: { via: '', n1: '', l1: '', b1: '', l2: '', s1: '', n2: '', l3: '', b2: '', l4: '', n3: '', s2: '', adicOn: false, adic: '', indic: '' },
      indicativo: '+57', telefono: '', correo: '', fechaNac: '', sexo: '' };
  }
  function blankFlat() {
    return { fechaHechos: '', competicion: '', otraCompeticion: '', otraTexto: '', local: '', visitante: '', localTxt: '', visitTxt: '', ciudadHechos: '', origen: [], agravantes: [], descripcion: '',
      fechaActo: '', numActo: '', fechaEjecutoria: '', meses: '', valor: '', fechaRadicado: U.today(), radEntrada: '', respuesta: '', radContab: '', radJuridica: '', profesional: '', observaciones: '' };
  }
  function personFromRec(p) {
    var o = blankPerson();
    ['tipoId', 'numId', 'nombres', 'apellidos', 'pais', 'depto', 'ciudad', 'indicativo', 'telefono', 'correo', 'fechaNac', 'sexo'].forEach(function (k) { o[k] = p[k] || o[k]; });
    o.rural = p.rural === true ? 'Sí' : 'No';
    o.dirPrev = p.dir || '';
    if (p.pais && p.pais !== 'Colombia') o.dirLibre = p.dir || '';
    return o;
  }
  function GEO() { return UI.GEO; }
  function codeOf(t) { var m = String(t).match(/\(([^)]+)\)$/); return m ? m[1] : t; }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ───────── helpers de marcado ───────── */
  function get(path) { var p = path.split('.'); return p.length === 2 ? st[p[0]][p[1]] : p.length === 3 ? st[p[0]][p[1]][p[2]] : st.f[path]; }
  function set(path, v) { var p = path.split('.'); if (p.length === 2) st[p[0]][p[1]] = v; else if (p.length === 3) st[p[0]][p[1]][p[2]] = v; else st.f[path] = v; }
  function fld(n, label, inner, o) {
    o = o || {};
    if (o.calc) return '<div class="gi-f gf-ro gi-c' + (o.c || 6) + (o.cls ? ' ' + o.cls : '') + '"><span class="gi-lbl"><span class="gi-n">' + n + '</span>' + label + '</span>' + inner + '</div>';
    var tag = '';
    return '<div class="gi-f gi-c' + (o.c || 6) + (o.cls ? ' ' + o.cls : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + (o.req && o.err ? ' data-req="' + o.err + '"' : '') + '><label class="gi-lbl' + (o.req ? ' gi-lbl--req' : '') + '"><span class="gi-n">' + n + '</span>' + label + tag + '</label>' + inner +
      (o.help ? '<p class="gi-help"' + (o.helpId ? ' id="' + o.helpId + '"' : '') + '>' + o.help + '</p>' : '') + (o.tag && AH[o.tag] ? '<p class="gi-help gf-ah" data-ah="' + o.tag + '" hidden></p>' : '') + '<p class="gi-ferr" data-err="' + (o.err || '') + '"></p></div>';
  }
  function inp(path, o) {
    o = o || {};
    return '<input class="gi-in" data-p="' + path + '" type="' + (o.type || 'text') + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + (o.attr ? ' ' + o.attr : '') + ' value="' + esc(get(path) || '') + '">';
  }
  function sel(path, opts, ph, o) {
    o = o || {};
    var cur = get(path);
    return '<select class="gi-in gi-sel" data-p="' + path + '"' + (o.dis ? ' disabled' : '') + '><option value="">' + esc(ph || 'Seleccionar') + '</option>' +
      opts.map(function (x) { var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
  }
  /* Selección única como radiogroup nativo: flechas y Tab funcionan sin código extra. */
  function seg(path, opts, aria) {
    return '<div class="gf-seg" role="radiogroup" aria-label="' + esc(aria) + '" data-sg="' + path + '">' + opts.map(function (x) {
      return '<label class="gf-opt"><input type="radio" class="gf-sr" name="' + path + '" value="' + esc(x[0]) + '"><span' + (x[2] ? ' title="' + esc(x[2]) + '"' : '') + '>' + esc(x[1]) + '</span></label>';
    }).join('') + '</div>';
  }
  function sw(path, label, o) {
    o = o || {};
    return '<div class="gi-f gi-c' + (o.c || 12) + ' gf-swf' + (o.cls ? ' ' + o.cls : '') + '"><button type="button" class="gf-sw" role="switch" aria-checked="false" data-sw="' + path + '"' + (o.help ? ' aria-describedby="' + o.help[0] + '"' : '') + '><i class="gf-sw__trk" aria-hidden="true"><i></i></i><b>' + label + '</b><em>No</em></button>' +
      (o.help ? '<p class="gi-help" id="' + o.help[0] + '">' + o.help[1] + '</p>' : '') + '</div>';
  }
  function chips(path, opts) {
    var cur = get(path) || [];
    return '<div class="gi-chips gf-checks" data-multi="' + path + '">' + opts.map(function (o, i) {
      return '<label class="gi-chip"><input type="checkbox" value="' + i + '"' + (cur.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
    }).join('') + '</div>';
  }
  function section(id, letter, title, sub, body, extra) {
    return '<section class="gi-sec" id="sec-' + id + '"' + (extra || '') + '><header class="gi-sec__head"><span class="gi-sec__tag">' + letter + '</span><div class="gf-sec__txt"><p class="gf-kicker" data-kicker="' + id + '"></p><h2 tabindex="-1">' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      '<div class="gf-sec__st"><span class="gf-count" data-count="' + id + '" hidden></span><span class="gf-done" data-done="' + id + '" hidden>' + CHECK + 'Completado</span></div></header><div class="gi-grid12">' + body + '</div></section>';
  }

  function personHtml(k, n0) {
    var num = function (i) { return String(n0 + i); }, h = '', R = k === 'r', AD = R ? ' gf-addr-r' : '';
    h += fld(num(0), 'Tipo de identificación', seg(k + '.tipoId', C.tiposId.map(function (t) { return [t, codeOf(t), t]; }), 'Tipo de identificación') + '<p class="gi-help" data-tiponame="' + k + '">Elige el tipo de documento.</p>', { c: 12, req: 1, err: k + '.tipoId' });
    h += fld(num(1), 'Número de identificación', inp(k + '.numId', { max: 20, ph: 'Solo números para CC, CE y TI' }), { c: 4, req: 1, err: k + '.numId' });
    h += fld(num(2), 'Nombre(s)', inp(k + '.nombres', { max: 60 }), { c: 4, req: 1, err: k + '.nombres' });
    h += fld(num(3), 'Apellido(s)', inp(k + '.apellidos', { max: 60 }), { c: 4, req: 1, err: k + '.apellidos' });
    if (R) h += sw('ui.mismaDir', 'Vive en la misma dirección del infractor', { help: ['gfMisma', 'Si lo activas, se copian país, municipio y dirección del infractor y se ocultan estos campos.'] });
    h += fld(num(4), 'País de residencia', '<div class="gf-pais">' + seg(k + '.paisSel', [['co', 'Colombia'], ['otro', 'Otro país']], 'País de residencia') + sel(k + '.pais', UI.PAISES.filter(function (x) { return x !== 'Colombia'; }), 'Elige el país') + '</div>', { c: 4, req: 1, err: k + '.pais', cls: AD });
    h += fld(num(5), 'Departamento de residencia', sel(k + '.depto', Object.keys(GEO()), 'Departamento'), { c: 4, req: 1, err: k + '.depto', cls: 'js-dep-' + k + AD, tag: k + '.depto' });
    h += fld(num(6), 'Ciudad o municipio de residencia', '<input class="gi-in" data-p="' + k + '.ciudad" list="dl-' + k + '-ciudad" autocomplete="off" placeholder="Escribe para buscar" maxlength="60" value="' + esc(get(k + '.ciudad')) + '"><datalist id="dl-' + k + '-ciudad"></datalist>', { c: 4, req: 1, err: k + '.ciudad', cls: AD });
    h += fld(num(7), '¿Es zona rural?', seg(k + '.rural', [['No', 'No'], ['Sí', 'Sí']], '¿Es zona rural?'), { c: 12, req: 1, err: k + '.rural', cls: 'js-co-' + k + AD });
    h += '<div class="gi-sub gi-c12 js-rural-' + k + AD + '"><div class="gi-grid12">' +
      fld(num(7) + '.1', 'Tipo de vía', sel(k + '.viaRural', C.viaRural.map(function (x) { return x[0]; }), 'Seleccionar'), { c: 4, req: 1, err: k + '.viaRural' }) +
      fld(num(7) + '.2', 'Información adicional', inp(k + '.infoRural', { max: 80 }), { c: 8, err: k + '.infoRural' }) + '</div></div>';
    var L = function (path) { return sel(path, C.letra, '—'); };
    var B = function (path) { return sel(path, ['Bis'], '—'); };
    var S = function (path) { return sel(path, C.sentido.map(function (x) { return x; }), '—'); };
    h += '<div class="gi-sub gi-c12 js-urbana-' + k + AD + '"><p class="gi-sub__t">Dirección de residencia</p><div class="gi-grid12 gi-addr">' +
      fld('1', 'Vía principal', seg(k + '.a.via', C.viaUrbana.map(function (x) { return [x[0], x[0]]; }), 'Vía principal'), { c: 12, req: 1, err: k + '.a.via' }) +
      fld('2', 'Número', inp(k + '.a.n1', { max: 3, attr: 'inputmode="numeric"' }), { c: 2, req: 1, err: k + '.a.n1' }) +
      fld('3', 'Letra', L(k + '.a.l1'), { c: 1 }) + fld('4', 'Bis', B(k + '.a.b1'), { c: 1 }) + fld('5', 'Letra', L(k + '.a.l2'), { c: 1 }) + fld('6', 'Sentido', S(k + '.a.s1'), { c: 2 }) +
      '<div class="gi-c4 gf-sp"></div><div class="gi-c1 gf-sp"></div>' +
      '<div class="gi-f gi-c1 gi-fixed"><label class="gi-lbl">#</label><div class="gi-in gi-in--fixed">#</div></div>' +
      fld('8', 'Número', inp(k + '.a.n2', { max: 3, attr: 'inputmode="numeric"' }), { c: 2, req: 1, err: k + '.a.n2' }) +
      fld('9', 'Letra', L(k + '.a.l3'), { c: 1 }) + fld('10', 'Bis', B(k + '.a.b2'), { c: 1 }) + fld('11', 'Letra', L(k + '.a.l4'), { c: 1 }) +
      '<div class="gi-f gi-c1 gi-fixed"><label class="gi-lbl">-</label><div class="gi-in gi-in--fixed">-</div></div>' +
      fld('13', 'Número', inp(k + '.a.n3', { max: 3, attr: 'inputmode="numeric"' }), { c: 2, req: 1, err: k + '.a.n3' }) + fld('14', 'Sentido', S(k + '.a.s2'), { c: 2 }) +
      '<div class="gi-c1 gf-sp"></div>' +
      sw(k + '.a.adicOn', 'Agregar indicación adicional (apartamento, bloque, interior…)', {}) +
      '<div class="gi-c12 js-adic-' + k + '"><div class="gi-grid12">' +
      fld('15', 'Información adicional', sel(k + '.a.adic', C.infoAdicional.map(function (x) { return x[0]; }), 'Seleccionar'), { c: 6 }) +
      fld('16', 'Indicación', inp(k + '.a.indic', { max: 40 }), { c: 6 }) +
      '</div></div></div></div>';
    h += '<div class="gi-sub gi-c12 js-libre-' + k + AD + '">' + fld(num(8) + 'L', 'Dirección de residencia', inp(k + '.dirLibre', { max: 160 }), { c: 12, req: 1, err: k + '.dirLibre' }) + '</div>';
    h += fld(num(8), 'Dirección consolidada', '<strong class="gf-val" data-dircons="' + k + '" title="Se arma con los datos de arriba y las abreviaturas de la vía.">—</strong>', { c: 12, calc: 1, cls: AD });
    h += fld(num(9), 'Indicativo del país', '<strong class="gf-val" data-indic="' + k + '">+57</strong>', { c: 2, calc: 1 });
    h += fld(num(10), 'Número de teléfono', inp(k + '.telefono', { max: 10, attr: 'inputmode="numeric"', ph: 'Máximo 10 dígitos' }), { c: 4, err: k + '.telefono' });
    h += fld(num(11), 'Correo electrónico', inp(k + '.correo', { type: 'email', max: 100, ph: 'correo@ejemplo.com' }), { c: 6, err: k + '.correo' });
    h += fld(num(12), 'Fecha de nacimiento', inp(k + '.fechaNac', { type: 'date', attr: 'max="' + U.today() + '"' }), { c: 4, req: 1, err: k + '.fechaNac' });
    h += fld(num(13), 'Edad', '<strong class="gf-val" data-edad="' + k + '">—</strong>', { c: 2, calc: 1 });
    h += fld(num(14), 'Sexo', seg(k + '.sexo', C.sexo.map(function (x) { return [x, x]; }), 'Sexo'), { c: 6, req: 1, err: k + '.sexo' });
    if (k === 'i') h += sw('menor', '¿Es menor de edad?', { help: ['menorHelp', 'Se calcula con la fecha de nacimiento y la de los hechos.'], cls: 'gf-menor' });
    return h;
  }

  function build() {
    var f = '', PROF = UI.PROFESIONALES;
    f += section('ctrl', 'A', 'Control del registro', 'Lo genera el sistema; no hay nada que completar aquí.', fld('1', 'Fecha de registro', '<strong class="gf-val">' + U.fmt(editId ? GI.get(editId).fechaRegistro : U.today()) + '</strong>', { c: 4, calc: 1 }));
    f += section('inf', 'B', 'Identificación y contacto del infractor', '', personHtml('i', 2));
    f += section('rep', 'C', 'Identificación y contacto del representante o tutor', 'Aplica cuando el infractor es menor de edad (Ley 1098 de 2006).', personHtml('r', 18), ' hidden');
    f += section('hec', 'D', 'Hechos y conducta', '',
      fld('33', 'Fecha de los hechos', inp('fechaHechos', { type: 'date', attr: 'max="' + U.addDays(U.today(), -1) + '"' }) + '<div class="gf-evs" id="gfEvents" hidden></div>', { c: 12, req: 1, err: 'fechaHechos', help: 'No puede ser hoy ni futura, y debe ser anterior a la fecha del acto.' }) +
      fld('34', 'Competición', seg('competicion', C.competicion.map(function (x) { return [x, x]; }), 'Competición'), { c: 12, req: 1, err: 'competicion' }) +
      '<div class="gi-f gi-c12 js-otra" data-req="otraCompeticion"><label class="gi-lbl gi-lbl--req"><span class="gi-n">34.1</span>Otra competición</label>' + seg('otraCompeticion', C.otraCompeticion.map(function (x) { return [x, x]; }), 'Otra competición') + '<p class="gi-ferr" data-err="otraCompeticion"></p></div>' +
      '<div class="gi-f gi-c12 js-otra-txt" data-req="otraTexto"><label class="gi-lbl gi-lbl--req">Nombre de la competición</label>' + inp('otraTexto', { max: 80 }) + '<p class="gi-ferr" data-err="otraTexto"></p></div>' +
      fld('35', 'Evento deportivo · equipo local', '<span data-slot="local"></span>', { c: 6, req: 1, err: 'local', help: 'El listado depende de la competición.' }) +
      fld('36', 'Evento deportivo · equipo visitante', '<span data-slot="visitante"></span>', { c: 6, req: 1, err: 'visitante' }) +
      '<div class="gi-f gi-c6 js-localtxt" data-req="localTxt"><label class="gi-lbl gi-lbl--req">Equipo local (manual)</label>' + inp('localTxt', { max: 80 }) + '<p class="gi-ferr" data-err="localTxt"></p></div>' +
      '<div class="gi-f gi-c6 js-visittxt" data-req="visitTxt"><label class="gi-lbl gi-lbl--req">Equipo visitante (manual)</label>' + inp('visitTxt', { max: 80 }) + '<p class="gi-ferr" data-err="visitTxt"></p></div>' +
      fld('37', 'Ciudad de los hechos', '<input class="gi-in" data-p="ciudadHechos" list="dlCiudades" autocomplete="off" value="' + esc(st.f.ciudadHechos) + '" placeholder="Escribe para buscar"><datalist id="dlCiudades">' + Object.keys(GEO()).reduce(function (a, k) { return a.concat(GEO()[k]); }, []).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>', { c: 6, req: 1, err: 'ciudadHechos' }) +
      '<div class="gi-c6 gf-sp"></div>' +
      fld('38', 'Origen de la obligación (Ley 1453 de 2011)', '<input class="gi-in gf-filter" type="search" id="gfFilter" placeholder="Buscar conducta: arma, estupefacientes, agresión…" aria-label="Buscar en las conductas">' + chips('origen', C.origen) + '<p class="gi-help" id="gfOrigenCnt">Ninguna conducta seleccionada.</p>', { c: 12, req: 1, err: 'origen', help: 'Se elige una o varias conductas. Es obligatorio al menos una.' }) +
      sw('ui.agrOn', '¿Hay agravantes?', { help: ['gfAgrHelp', 'Opcional. Actívalo solo si aplica alguno de los agravantes del catálogo.'] }) +
      '<div class="gi-f gi-c12 js-agr"><label class="gi-lbl"><span class="gi-n">39</span>Agravantes de las conductas</label>' + chips('agravantes', C.agravantes) + '<p class="gi-ferr" data-err="agravantes"></p></div>' +
      fld('40', 'Descripción breve de la conducta', '<textarea class="gi-in gi-ta" data-p="descripcion" rows="3" maxlength="600">' + esc(st.f.descripcion) + '</textarea><div class="gf-ta-row"><button type="button" class="naowee-btn naowee-btn--quiet naowee-btn--small gf-base" data-base hidden>Usar texto base de la conducta</button><span class="gi-help" id="descCnt">0 de 600</span></div>', { c: 12, req: 1, err: 'descripcion', tag: 'descripcion' }));
    f += section('san', 'E', TITLES.san, '',
      fld('41', 'Fecha del acto administrativo', inp('fechaActo', { type: 'date', attr: 'max="' + U.today() + '"' }), { c: 4, req: 1, err: 'fechaActo' }) +
      fld('42', 'No. del acto administrativo', inp('numActo', { max: 20, ph: 'Alfanumérico, máx. 20' }), { c: 4, req: 1, err: 'numActo' }) +
      fld('43', 'Fecha de la constancia de ejecutoria', inp('fechaEjecutoria', { type: 'date', attr: 'max="' + U.today() + '"' }), { c: 4, req: 1, err: 'fechaEjecutoria' }) +
      fld('44', 'Tiempo de sanción en meses', '<div class="gf-meses">' + seg('meses', [6, 12, 24, 36, 48, 60].map(function (m) { return [String(m), m + ' meses']; }), 'Meses de sanción') + '<input class="gi-in gf-mesesin" data-p="meses" inputmode="numeric" maxlength="3" placeholder="Otro" aria-label="Meses de sanción, otro valor" value="' + esc(st.f.meses) + '"></div>', { c: 12, req: 1, err: 'meses', tag: 'meses', helpId: 'mesesHelp', help: 'Mínimo 6 meses.' }) +
      '<div class="gi-c12 gf-vig" id="vigLive"><div class="gf-vig__c"><div class="gf-vig__k"><span class="gi-n">45</span>Fin de vigencia de la prohibición de ingreso</div><strong class="gf-val" id="finVig" aria-live="polite" title="Día siguiente a la ejecutoria más los meses.">—</strong></div>' +
      '<div class="gf-vig__c"><div class="gf-vig__k">Estado según las fechas</div><div id="vigEst" aria-live="polite">—</div><span class="gf-val gf-val--sub" id="vigDias">Falta la ejecutoria o los meses.</span></div>' +
      '<div class="gf-vig__c"><div class="gf-vig__k"><span class="gi-n">47</span>Estado de la restricción</div><div id="estRes" title="Inactiva mientras el registro esté Recibido o Por Subsanar; Activa al Validarse; Cumplida un día después del fin de vigencia."></div></div></div>' +
      sw('ui.multaOn', '¿La sanción incluye multa?', { help: ['gfMultaHelp', 'Su cobro no se gestiona aquí.'] }) +
      fld('46', 'Valor de la sanción', '<div class="gf-money gi-money"><span>$</span><input class="gi-in" data-p="valor" inputmode="numeric" value="' + esc(st.f.valor) + '"></div>', { c: 4, err: 'valor', cls: 'js-multa', help: 'Multa en pesos.' }));
    f += section('int', 'F', 'Gestión interna', '',
      fld('48', 'Fecha de radicado de entrada', inp('fechaRadicado', { type: 'date', attr: 'max="' + U.today() + '"' }), { c: 4, req: 1, err: 'fechaRadicado', tag: 'fechaRadicado' }) +
      fld('49', 'Radicado de entrada en Mindeporte', inp('radEntrada', { max: 40, ph: 'Según GESDOC' }), { c: 4, req: 1, err: 'radEntrada', tag: 'radEntrada' }) +
      fld('50', 'Respuesta al radicado', inp('respuesta', { max: 40, ph: 'Según GESDOC' }), { c: 4 }) +
      fld('51', 'Radicado contabilidad', inp('radContab', { max: 40, ph: 'Según GESDOC' }), { c: 4 }) +
      fld('52', 'Radicado jurídica', inp('radJuridica', { max: 40, ph: 'Según GESDOC' }), { c: 4 }) +
      '<div class="gi-c4 gf-sp"></div>' +
      fld('53', 'Profesional responsable del IVC', seg('profSel', PROF.map(function (p) { return [p, p]; }).concat([['__otro', 'Otro…']]), 'Profesional responsable') + '<input class="gi-in js-prof-txt" data-p="profesional" maxlength="80" placeholder="Nombre del profesional" aria-label="Nombre del profesional" value="' + esc(st.f.profesional) + '">', { c: 8, req: 1, err: 'profesional', tag: 'profesional' }) +
      fld('54', 'Estado de registro y seguimiento', '<div id="estReg" title="Lo mueve el profesional desde la ficha: Validado o Por Subsanar."></div>', { c: 4, calc: 1 }) +
      fld('55', 'Observaciones del procedimiento del IVC', '<textarea class="gi-in gi-ta" data-p="observaciones" rows="3">' + esc(st.f.observaciones) + '</textarea>', { c: 12 }));

    var back = editId ? UI.BASE + '/' + editId : UI.BASE;
    view.innerHTML = '<div class="page-inner gi-page gi-form">' +
      '<a class="gi-back" href="' + back + '">' + UI.svg('back') + ' Volver</a>' +
      '<header class="gi-head"><div class="page-title-block"><h1 class="page-title">' + (editId ? 'Editar registro ' + editId : 'Registrar infractores') + '</h1>' +
      '<p class="page-subtitle">' + (editId ? 'Actualiza los datos de la decisión en firme registrada.' : 'Registra decisiones en firme una por una o con la carga masiva.') + '</p></div>' +
      (editId ? '' : '<div class="gi-head__actions"><a class="naowee-btn naowee-btn--loud" href="' + UI.BASE + '/carga-masiva">' + UI.svg('upload') + ' Carga masiva</a></div>') + '</header>' +
      '<div class="gi-banner gi-banner--danger" id="errSum" hidden></div>' +
      '<div class="gi-layout"><nav class="gi-steps" aria-label="Bloques del formulario">' +
      '<div class="gf-total"><div class="gf-total__pct"><strong id="gfPct">0 %</strong><span>completo</span></div>' +
      '<div class="gf-bar" id="gfTotBar" role="progressbar" aria-label="Avance total del formulario" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 % completo"><i></i></div>' +
      '<small id="gfTotCnt">0 de 0 campos obligatorios</small></div>' +
      SECS.map(function (id, i) {
        return '<a href="#" data-go="' + id + '" class="gi-step" id="go-' + id + '"><span>' + 'ABCDEF'[i] + '</span><div><b>' + TITLES[id] + '</b>' +
          '<div class="gf-srow" data-srow="' + id + '"><div class="gf-bar" data-sbar="' + id + '" role="progressbar" aria-label="' + TITLES[id] + ': campos obligatorios completados" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><i></i></div>' +
          '<small class="gf-badge" data-scount="' + id + '" aria-hidden="true">—</small></div></div>' + CHECK + '</a>';
      }).join('') + '</nav><form class="gi-formcol" id="giForm" novalidate>' + (editId ? '' : startHtml()) + f + '</form></div>' +
      '<div class="gi-bar" id="gfBar"><div class="gi-bar__inner"><span class="gi-bar__hint"><span class="gf-hintlong">Los campos con <b class="gi-star">*</b> son obligatorios.</span></span><div>' +
      '<a class="naowee-btn naowee-btn--mute gf-cancel" href="' + back + '">Cancelar</a>' +
      (editId ? '' : '<button type="button" class="naowee-btn naowee-btn--loud" id="gfStart">Comenzar</button>') +
      '<button type="button" class="naowee-btn naowee-btn--mute" id="gfBack">' + UI.svg('back') + ' Atrás</button>' +
      '<button type="button" class="naowee-btn naowee-btn--loud" id="gfNext">Siguiente ' + NEXT + '</button>' +
      '<button type="button" class="naowee-btn naowee-btn--loud" id="giSave" hidden>' + (editId ? 'Guardar cambios' : 'Guardar registro') + '</button></div></div></div></div>';
    labelControls();
  }
  /* Solo el alta lo trae: al editar los datos ya existen y se abre directo en el primer bloque. */
  function startHtml() {
    var rows = SECS.map(function (id, i) {
      var cnt = id === 'ctrl' ? '<small class="gf-badge">Automático</small>' : id === 'rep' ? '<small class="gf-badge">Si aplica</small>' : '<small class="gf-badge" data-startcnt="' + id + '"></small>';
      return '<li><span class="gi-sec__tag">' + 'ABCDEF'[i] + '</span><div><b>' + TITLES[id] + '</b><span>' + HINTS[id] + '</span></div>' + cnt + '</li>';
    }).join('');
    return '<section class="gi-sec gf-start" id="sec-start" aria-label="Registro individual">' +
      '<ol class="gf-start__list">' + rows + '</ol>' +
      '</section>';
  }
  /* Une cada control con su etiqueta para lectores de pantalla. */
  function labelControls() {
    var n = 0;
    view.querySelectorAll('.gi-f').forEach(function (fe) {
      var lb = fe.querySelector(':scope > label.gi-lbl'); if (!lb) return;
      lb.id = lb.id || 'gfl' + (++n);
      var ctl = fe.querySelector('input.gi-in:not([aria-label]), select.gi-in, textarea.gi-in');
      if (ctl && !ctl.closest('.gf-meses')) { ctl.setAttribute('aria-labelledby', lb.id); if (fe.hasAttribute('data-req')) ctl.setAttribute('aria-required', 'true'); }
      fe.querySelectorAll('.gf-seg:not([aria-labelledby])').forEach(function (g) { if (fe.hasAttribute('data-req')) g.setAttribute('aria-required', 'true'); });
    });
  }

  /* ───────── comportamiento ───────── */
  function fillSel(slot, opts, path, ph, dis) {
    var el = view.querySelector('[data-slot="' + path + '"]');
    if (!el) return;
    el.innerHTML = sel(path, opts, ph, { dis: dis });
  }
  function put(el, html) { if (el && el.innerHTML !== html) el.innerHTML = html; }
  function txt(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function consolidate(k) {
    var p = st[k], a = p.a;
    if (p.pais !== 'Colombia') return p.dirLibre.trim();
    if (p.rural === 'Sí') {
      var ab = (C.viaRural.filter(function (x) { return x[0] === p.viaRural; })[0] || [])[1] || '';
      return (ab + ' ' + p.infoRural).trim();
    }
    var abU = (C.viaUrbana.filter(function (x) { return x[0] === a.via; })[0] || [])[1] || '';
    if (!abU && !a.n1 && !a.n2 && !a.n3) return p.dirPrev || '';
    var s = abU + ' ' + a.n1 + a.l1 + (a.b1 ? ' ' + a.b1.toUpperCase() : '') + (a.l2 ? ' ' + a.l2 : '') + (a.s1 ? ' ' + a.s1 : '') + ' # ' + a.n2 + a.l3 + (a.b2 ? ' ' + a.b2.toUpperCase() : '') + (a.l4 ? ' ' + a.l4 : '') + ' - ' + a.n3 + (a.s2 ? ' ' + a.s2 : '');
    if (a.adicOn && a.adic) { var ab2 = (C.infoAdicional.filter(function (x) { return x[0] === a.adic; })[0] || [])[1] || ''; s += ' ' + ab2 + ' ' + a.indic; }
    return s.replace(/\s+/g, ' ').trim();
  }
  function menorNow() { return D.esMenor({ fechaNac: st.i.fechaNac, fechaHechos: st.f.fechaHechos }); }
  /* Si las fechas dicen menor, no se puede apagar a mano: la reserva reforzada no es opcional. */
  function menorEff() { return menorNow() === true || st.ui.menorOn; }

  /* Valores de las dos "opciones" que no son un campo directo del estado. */
  function segVal(path) {
    var m = path.match(/^([ir])\.paisSel$/);
    if (m) return st.ui.paisOtro[m[1]] ? 'otro' : 'co';
    if (path === 'profSel') return st.ui.profOtro ? '__otro' : st.f.profesional;
    return get(path);
  }
  function segSet(path, v) {
    var m = path.match(/^([ir])\.paisSel$/);
    if (m) {
      var k = m[1];
      st.ui.paisOtro[k] = v === 'otro';
      st[k].pais = v === 'co' ? 'Colombia' : ''; st[k].depto = ''; st[k].ciudad = '';
      return;
    }
    if (path === 'profSel') {
      if (v === '__otro') { st.ui.profOtro = true; st.f.profesional = ''; } else { st.ui.profOtro = false; st.f.profesional = v; }
      return;
    }
    set(path, v);
    if (/\.tipoId$/.test(path)) { var kk = path[0]; if (/CC|CE|TI/.test(v)) st[kk].numId = st[kk].numId.replace(/\D/g, ''); }
  }
  function mark(p) { touched[p] = true; delete auto[p]; clearErr(p); }
  function clearErr(p) {
    var slot = view.querySelector('[data-err="' + p + '"]');
    if (!slot || !slot.textContent) return;
    slot.textContent = '';
    slot.parentNode.querySelectorAll('.is-invalid').forEach(function (e) { e.classList.remove('is-invalid'); });
  }
  function inferDepto(k) {
    var p = st[k]; if (p.pais !== 'Colombia') return;
    var c = norm(p.ciudad.trim()); if (!c) return;
    var G = GEO(), hit = Object.keys(G).filter(function (dep) { return G[dep].some(function (x) { return norm(x) === c; }); });
    if (!hit.length || hit.indexOf(p.depto) >= 0) return;
    p.depto = hit[0];
  }
  function canonCiudad(k) {
    var p = st[k], c = norm(p.ciudad.trim()), G = GEO();
    Object.keys(G).forEach(function (dep) { G[dep].forEach(function (x) { if (norm(x) === c && (!p.depto || p.depto === dep)) p.ciudad = x; }); });
  }
  function copyAddr() {
    var s = st.i, t = st.r;
    ['pais', 'depto', 'ciudad', 'rural', 'viaRural', 'infoRural', 'dirLibre'].forEach(function (k) { t[k] = s[k]; });
    t.a = JSON.parse(JSON.stringify(s.a)); st.ui.paisOtro.r = st.ui.paisOtro.i;
  }

  /* Eventos ya cargados: salen de los registros existentes más una agenda de ejemplo. */
  function buildEvents() {
    var m = {}, out = [];
    function add(e) {
      var eq = C.equipos[e.competicion];
      if (!e.fecha || !eq || eq.indexOf(e.local) < 0 || eq.indexOf(e.visitante) < 0) return;
      var k = e.fecha + '|' + e.local + '|' + e.visitante;
      if (!m[k]) { m[k] = 1; out.push(e); }
    }
    GI.all().forEach(function (r) { add({ fecha: r.fechaHechos, competicion: r.competicion || 'Liga', local: r.local, visitante: r.visitante, ciudad: r.ciudadHechos || '' }); });
    [[-2, 'Liga', 'JUNIOR F.C.', 'MILLONARIOS F.C.', 'Barranquilla'], [-9, 'Copa', 'AMÉRICA DE CALI', 'DEPORTIVO PASTO', 'Cali'], [-9, 'Liga', 'ATLÉTICO NACIONAL', 'INDEPENDIENTE MEDELLÍN', 'Medellín'], [-16, 'Torneo', 'ATLÉTICO BUCARAMANGA', 'CÚCUTA DEPOTIVO', 'Bucaramanga']].forEach(function (x) {
      add({ fecha: U.addDays(U.today(), x[0]), competicion: x[1], local: x[2], visitante: x[3], ciudad: x[4] });
    });
    return out;
  }
  function evLabel(e) { return e.competicion + ' · ' + e.local + ' vs ' + e.visitante + (e.ciudad ? ' · ' + e.ciudad : ''); }
  function matches() { var h = st.f.fechaHechos; return h ? evs.filter(function (e) { return e.fecha === h; }) : []; }
  function renderEvents() {
    var box = view.querySelector('#gfEvents'), ms = matches(), h;
    if (!ms.length || lastDep.evNo) h = '';
    else if (lastDep.evDone != null && ms.indexOf(evs[lastDep.evDone]) >= 0) h = lastDep.evAsk ? '<b>Según la fecha, parece ser el partido ' + esc(evLabel(evs[lastDep.evDone])) + ': ¿es ese?</b> <button type="button" class="gf-evbtn" data-evans="si">Sí</button><button type="button" class="gf-evbtn" data-evans="no">No</button>' : '';
    else h = '<b>' + (ms.length === 1 ? 'Según la fecha, puede ser este partido:' : 'Según la fecha, puede ser uno de estos partidos:') + '</b> ' + ms.map(function (e) { return '<button type="button" class="gf-evbtn" data-ev="' + evs.indexOf(e) + '">' + esc(evLabel(e)) + '</button>'; }).join('');
    put(box, h); box.hidden = !h;
  }
  function applyEvent(i, ask) {
    var e = evs[i], f = st.f;
    f.competicion = e.competicion; f.local = ''; f.visitante = ''; lastDep.comp = null; sync();
    f.local = e.local; f.visitante = e.visitante; f.ciudadHechos = e.ciudad || f.ciudadHechos;
    lastDep.evDone = i; lastDep.evAsk = !!ask; sync(); renderEvents();
  }
  function nextRad() {
    var y = U.today().slice(0, 4), max = 0;
    GI.all().forEach(function (r) { var m = String(r.radEntrada || '').match(/^GESDOC-(\d{4})-(\d+)$/); if (m && m[1] === y) max = Math.max(max, +m[2]); });
    var n = String(max + 1); while (n.length < 6) n = '0' + n;
    return 'GESDOC-' + y + '-' + n;
  }
  function baseText() {
    var o = st.f.origen[0]; if (o == null) return '';
    var t = C.origen[o].replace(/^[^-]*-\s*/, '');
    return 'Se registra la conducta: ' + t.charAt(0).toLowerCase() + t.slice(1).replace(/\.$/, '') + '.';
  }

  /* DC-251: solo cuentan los obligatorios visibles; una sección oculta por un switch no suma. */
  function filled(path) {
    if (path === 'origen') return st.f.origen.length > 0;
    var v = get(path); if (v == null) return false;
    v = String(v).trim(); if (!v) return false;
    if (/\.ciudad$/.test(path)) { var p = st[path[0]]; if (p.pais === 'Colombia' && p.depto && (GEO()[p.depto] || []).indexOf(v) < 0) return false; }
    if (path === 'meses') return +v >= 6;
    return true;
  }
  function setBar(bar, dn, t, label) {
    bar.setAttribute('aria-valuemax', t); bar.setAttribute('aria-valuenow', dn); bar.setAttribute('aria-valuetext', label);
    bar.firstChild.style.width = (t ? Math.round(dn * 100 / t) : 0) + '%';
    bar.classList.toggle('is-full', t > 0 && dn === t);
  }
  /* Los bloques inactivos van en display:none, así que "visible" se decide por [hidden], no por layout. */
  function shown(el, sec) { for (; el && el !== sec; el = el.parentNode) if (el.hidden) return false; return true; }
  function progress() {
    var tot = 0, done = 0, q = function (s) { return view.querySelector(s); };
    SECS.forEach(function (id) {
      var sec = q('#sec-' + id), t = 0, dn = 0;
      if (!sec.hidden) sec.querySelectorAll('[data-req]').forEach(function (el) { if (!shown(el, sec)) return; t++; if (filled(el.getAttribute('data-req'))) dn++; });
      tot += t; done += dn;
      var bad = false; if (!sec.hidden) sec.querySelectorAll('.gi-ferr:not(:empty)').forEach(function (e) { if (shown(e, sec)) bad = true; });
      q('#go-' + id).classList.toggle('has-err', bad);
      if (pcache[id] === t + '/' + dn) return;
      pcache[id] = t + '/' + dn;
      var full = t > 0 && dn === t, label = t ? dn + ' de ' + t + ' campos' : 'Sin campos obligatorios';
      var bd = q('[data-scount="' + id + '"]'); txt(bd, dn + '/' + t); bd.title = label;
      q('[data-srow="' + id + '"]').hidden = !t; setBar(q('[data-sbar="' + id + '"]'), dn, t, label);
      txt(q('[data-startcnt="' + id + '"]'), t + (t === 1 ? ' campo' : ' campos'));
      q('#go-' + id).classList.toggle('is-done', full);
      var c = q('[data-count="' + id + '"]'); txt(c, label); c.hidden = full || !t;
      q('[data-done="' + id + '"]').hidden = !full;
    });
    var pct = tot ? Math.floor(done * 100 / tot) : 0;
    if (done === tot && tot) pct = 100;
    txt(q('#gfPct'), pct + ' %'); txt(q('#gfTotCnt'), done + ' de ' + tot + ' campos obligatorios'); txt(q('[data-startsum]'), String(tot));
    setBar(q('#gfTotBar'), pct, 100, pct + ' % completo');
  }

  function syncSegs() {
    view.querySelectorAll('[data-sg]').forEach(function (g) {
      var v = segVal(g.getAttribute('data-sg')); v = v == null ? '' : String(v);
      g.querySelectorAll('input').forEach(function (r) { var on = r.value === v; if (r.checked !== on) r.checked = on; });
    });
  }
  function setSw(b, on) {
    var s = on ? 'true' : 'false';
    if (b.getAttribute('aria-checked') !== s) { b.setAttribute('aria-checked', s); b.querySelector('em').textContent = on ? 'Sí' : 'No'; }
  }
  function refreshInputs() {
    view.querySelectorAll('[data-p]').forEach(function (el) {
      if (el === d.activeElement) return;
      var v = get(el.getAttribute('data-p')); v = v == null ? '' : String(v);
      if (el.value !== v) el.value = v;
    });
  }
  function updateHelp() {
    view.querySelectorAll('[data-ah]').forEach(function (el) {
      var k = el.getAttribute('data-ah'), on = !!auto[k]; el.hidden = !on; if (on) txt(el, AH[k]);
    });
  }

  function sync() {
    var q = function (s) { return view.querySelector(s); }, f = st.f;
    /* Evento ya cargado que coincide con la fecha de los hechos. */
    if (lastDep.fh !== f.fechaHechos) {
      lastDep.fh = f.fechaHechos; lastDep.evDone = null; lastDep.evNo = false;
      var ms = matches();
      if (!editId && ms.length === 1 && !f.competicion && !f.local && !f.visitante && !f.ciudadHechos) applyEvent(evs.indexOf(ms[0]), true);
      else renderEvents();
    }
    if (st.ui.mismaDir) copyAddr();
    ['i', 'r'].forEach(function (k) {
      var p = st[k], co = p.pais === 'Colombia', hide = k === 'r' && st.ui.mismaDir;
      var dk = p.depto + '|' + p.pais;
      if (lastDep[k + 'dl'] !== dk) {
        var cities = co && p.depto ? GEO()[p.depto] || [] : co ? Object.keys(GEO()).reduce(function (a, x) { return a.concat(GEO()[x]); }, []) : [];
        put(q('#dl-' + k + '-ciudad'), cities.map(function (c) { return '<option value="' + esc(c) + '">'; }).join(''));
        lastDep[k + 'dl'] = dk;
      }
      q('[data-p="' + k + '.pais"]').hidden = !st.ui.paisOtro[k];
      q('.js-dep-' + k).hidden = hide || !co;
      q('.js-co-' + k).hidden = hide || !co;
      var rural = co && p.rural === 'Sí', urbana = co && p.rural === 'No';
      q('.js-rural-' + k).hidden = hide || !rural; q('.js-urbana-' + k).hidden = hide || !urbana; q('.js-libre-' + k).hidden = hide || co;
      q('.js-adic-' + k).hidden = !p.a.adicOn;
      if (k === 'r') view.querySelectorAll('#sec-rep .gf-addr-r.gi-f').forEach(function (e) { e.hidden = hide || ((e.classList.contains('js-dep-r') || e.classList.contains('js-co-r')) && !co); });
      txt(q('[data-dircons="' + k + '"]'), consolidate(k) || '—');
      txt(q('[data-indic="' + k + '"]'), p.indicativo = UI.INDICATIVO[p.pais] || '+');
      var ed = p.fechaNac ? U.ageAt(p.fechaNac, f.fechaHechos || U.today()) : null;
      txt(q('[data-edad="' + k + '"]'), ed == null ? '—' : ed + ' años');
      var tn = C.tiposId.indexOf(p.tipoId) >= 0 ? p.tipoId : 'Elige el tipo de documento.';
      txt(q('[data-tiponame="' + k + '"]'), tn);
    });
    q('.js-adic-r').hidden = !st.r.a.adicOn;
    var mc = menorNow(), m = menorEff();
    var mb = q('[data-sw="menor"]'); setSw(mb, m);
    mb.setAttribute('aria-disabled', mc === true ? 'true' : 'false');
    var yrs = st.i.fechaNac ? U.ageAt(st.i.fechaNac, f.fechaHechos || U.today()) : null;
    txt(q('#menorHelp'), mc === true ? 'Tiene ' + yrs + ' años a la fecha ' + (f.fechaHechos ? 'de los hechos' : 'de hoy (provisional)') + '. Se pide representante y no se puede apagar.' :
      mc === false && m ? 'Activado a mano: se pedirá representante o tutor.' : mc === false ? 'Es mayor de edad. Puedes activarlo a mano si hace falta un representante.' :
      m ? 'Activado a mano: se pedirá representante o tutor.' : 'Se calcula al ingresar la fecha de nacimiento.');
    q('#sec-rep').hidden = !m; q('#go-rep').hidden = !m;
    if (lastDep.rep !== m) { lastDep.rep = m; if (cur === 'rep' && !m) cur = 'inf'; applyStep(); }

    /* competición y equipos */
    var comp = f.competicion, otra = comp === 'Otro';
    q('.js-otra').hidden = !otra;
    q('.js-otra-txt').hidden = !(otra && f.otraCompeticion === 'Otro');
    var eq = comp && !otra ? C.equipos[comp] : (otra ? C.equipos['Liga'] : []);
    if (lastDep.comp !== comp) {
      f.local = ''; f.visitante = '';
      var base = (eq || []).slice(); if (otra) base.push('Otro');
      fillSel(null, base, 'local', comp ? 'Seleccionar equipo' : 'Elige primero la competición', !comp);
      fillSel(null, base, 'visitante', comp ? 'Seleccionar equipo' : 'Elige primero la competición', !comp);
      lastDep.comp = comp;
    }
    q('.js-localtxt').hidden = !(otra && f.local === 'Otro');
    q('.js-visittxt').hidden = !(otra && f.visitante === 'Otro');
    q('.js-agr').hidden = !st.ui.agrOn; q('.js-multa').hidden = !st.ui.multaOn;
    q('.js-prof-txt').hidden = !st.ui.profOtro;

    /* conductas: contador y sugerencia de meses a partir del rango */
    txt(q('#gfOrigenCnt'), f.origen.length ? f.origen.length + (f.origen.length === 1 ? ' conducta seleccionada.' : ' conductas seleccionadas.') : 'Ninguna conducta seleccionada.');
    var ok = f.origen.join(',');
    if (lastDep.og !== ok) {
      lastDep.og = ok;
      if (!editId && !touched.meses) {
        var lows = f.origen.map(function (i) { return U.rangoMeses(C.rangoOrigen[i]); }).filter(Boolean).map(function (r) { return r[0]; });
        var sug = lows.length ? String(Math.max.apply(null, lows)) : '';
        if (sug) { f.meses = sug; auto.meses = 1; } else if (auto.meses) { f.meses = ''; delete auto.meses; }
      }
    }
    var bt = q('[data-base]'); bt.hidden = !(f.origen.length && !f.descripcion.trim());
    txt(q('#descCnt'), f.descripcion.length + ' de 600');

    /* sanción: fin de vigencia y estado, en vivo */
    var rec = { fechaEjecutoria: f.fechaEjecutoria, meses: +f.meses || 0 }, fin = D.finVigencia(rec);
    txt(q('#finVig'), fin ? U.fmt(fin) : '—');
    var dias = fin ? D.diasRestantes(rec) : null;
    put(q('#vigEst'), fin ? '<span class="naowee-badge naowee-badge--' + (dias < 0 ? 'positive' : 'negative') + ' naowee-badge--quiet">' + (dias < 0 ? 'Cumplida' : 'Vigente') + '</span>' : '—');
    txt(q('#vigDias'), fin ? (dias < 0 ? 'Terminó hace ' + (-dias) + (dias === -1 ? ' día.' : ' días.') : dias === 0 ? 'Vence hoy.' : 'Faltan ' + dias + (dias === 1 ? ' día.' : ' días.')) : 'Falta la ejecutoria o los meses.');
    var ranges = [];
    f.origen.forEach(function (i) { ranges.push(C.rangoOrigen[i].replace(/^No contempla.*reincidencia: /, 'Reincidencia: ')); });
    if (f.agravantes.length) ranges.push('12 – 72 meses');
    put(q('#mesesHelp'), 'Mínimo 6 meses.' + (ranges.length ? ' Rango de referencia: ' + esc(ranges.filter(function (x, i, a) { return a.indexOf(x) === i; }).join(' · ')) + '.' : ''));
    var tmp = { estadoRegistro: editId ? GI.get(editId).estadoRegistro : 'Recibido', fechaEjecutoria: f.fechaEjecutoria, meses: +f.meses || 0 };
    put(q('#estRes'), UI.badgeRes(D.estadoRestriccion(tmp)));
    put(q('#estReg'), UI.badgeReg(tmp.estadoRegistro));

    syncSegs();
    view.querySelectorAll('[data-sw]').forEach(function (b) { var p = b.getAttribute('data-sw'); if (p !== 'menor') setSw(b, !!get(p)); });
    refreshInputs(); updateHelp(); progress();
  }

  /* ───────── validación y guardado ───────── */
  function toRec() {
    var f = st.f;
    function person(p) {
      return { tipoId: p.tipoId, numId: p.numId, nombres: p.nombres.trim(), apellidos: p.apellidos.trim(), pais: p.pais, depto: p.depto, ciudad: p.ciudad, rural: p.rural === 'Sí',
        dir: consolidate(p === st.i ? 'i' : 'r'), indicativo: p.indicativo, telefono: p.telefono, correo: p.correo, fechaNac: p.fechaNac, sexo: p.sexo };
    }
    var rec = Object.assign({}, person(st.i), {
      fechaHechos: f.fechaHechos, competicion: f.competicion,
      otraCompeticion: f.competicion === 'Otro' ? (f.otraCompeticion === 'Otro' ? f.otraTexto : f.otraCompeticion) : '',
      local: f.local === 'Otro' ? f.localTxt : f.local, visitante: f.visitante === 'Otro' ? f.visitTxt : f.visitante,
      ciudadHechos: f.ciudadHechos, origen: f.origen.slice().sort(), agravantes: f.agravantes.slice().sort(), descripcion: f.descripcion.trim(),
      fechaActo: f.fechaActo, numActo: f.numActo.trim(), fechaEjecutoria: f.fechaEjecutoria, meses: +f.meses, valor: +String(f.valor).replace(/\D/g, '') || 0,
      fechaRadicado: f.fechaRadicado, radEntrada: f.radEntrada, respuesta: f.respuesta, radContab: f.radContab, radJuridica: f.radJuridica, profesional: f.profesional.trim(), observaciones: f.observaciones,
      rep: menorEff() ? person(st.r) : null
    });
    return rec;
  }
  function validate() {
    var errs = [], f = st.f, today = U.today();
    function req(path, label, cond) { if (!cond) errs.push([path, label + ' es obligatorio.']); }
    function person(k, tag) {
      var p = st[k], co = p.pais === 'Colombia';
      req(k + '.tipoId', tag + ': tipo de identificación', p.tipoId); req(k + '.numId', tag + ': número de identificación', p.numId);
      req(k + '.nombres', tag + ': nombre(s)', p.nombres.trim()); req(k + '.apellidos', tag + ': apellido(s)', p.apellidos.trim());
      req(k + '.pais', tag + ': país', p.pais);
      if (co) { req(k + '.depto', tag + ': departamento', p.depto); req(k + '.ciudad', tag + ': ciudad', p.ciudad); req(k + '.rural', tag + ': zona rural', p.rural);
        if (p.depto && p.ciudad && (GEO()[p.depto] || []).indexOf(p.ciudad) < 0) errs.push([k + '.ciudad', tag + ': elige un municipio de la lista de ' + p.depto + '.']);
        if (p.rural === 'Sí') req(k + '.viaRural', tag + ': tipo de vía', p.viaRural);
        if (p.rural === 'No') { req(k + '.a.via', tag + ': vía principal', p.a.via); req(k + '.a.n1', tag + ': número de la vía', p.a.n1); req(k + '.a.n2', tag + ': número', p.a.n2); req(k + '.a.n3', tag + ': número', p.a.n3); } }
      else { req(k + '.ciudad', tag + ': ciudad', p.ciudad); req(k + '.dirLibre', tag + ': dirección', p.dirLibre.trim()); }
      req(k + '.fechaNac', tag + ': fecha de nacimiento', p.fechaNac); req(k + '.sexo', tag + ': sexo', p.sexo);
      if (p.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.correo)) errs.push([k + '.correo', tag + ': el correo no tiene un formato válido.']);
      if (p.telefono && p.telefono.length > 10) errs.push([k + '.telefono', tag + ': el teléfono admite máximo 10 dígitos.']);
      if (p.fechaNac && p.fechaNac > today) errs.push([k + '.fechaNac', tag + ': la fecha de nacimiento no puede ser futura.']);
    }
    person('i', 'Infractor');
    if (menorEff()) person('r', 'Representante');
    req('fechaHechos', 'Fecha de los hechos', f.fechaHechos);
    if (f.fechaHechos && f.fechaHechos >= today) errs.push(['fechaHechos', 'La fecha de los hechos no puede ser hoy ni futura.']);
    if (f.fechaHechos && f.fechaActo && f.fechaHechos >= f.fechaActo) errs.push(['fechaHechos', 'La fecha de los hechos debe ser anterior a la del acto administrativo.']);
    req('competicion', 'Competición', f.competicion);
    if (f.competicion === 'Otro') { req('otraCompeticion', 'Otra competición', f.otraCompeticion); if (f.otraCompeticion === 'Otro') req('otraTexto', 'Nombre de la competición', f.otraTexto.trim()); }
    req('local', 'Equipo local', f.local); req('visitante', 'Equipo visitante', f.visitante);
    if (f.local === 'Otro') req('localTxt', 'Equipo local (manual)', f.localTxt.trim());
    if (f.visitante === 'Otro') req('visitTxt', 'Equipo visitante (manual)', f.visitTxt.trim());
    if (f.local && f.local === f.visitante && f.local !== 'Otro') errs.push(['visitante', 'El equipo visitante no puede ser el mismo que el local.']);
    req('ciudadHechos', 'Ciudad de los hechos', f.ciudadHechos);
    req('origen', 'Origen de la obligación (al menos uno)', f.origen.length > 0);
    req('descripcion', 'Descripción de la conducta', f.descripcion.trim());
    req('fechaActo', 'Fecha del acto administrativo', f.fechaActo); req('numActo', 'Número del acto administrativo', f.numActo.trim());
    req('fechaEjecutoria', 'Fecha de ejecutoria', f.fechaEjecutoria);
    if (f.fechaActo && f.fechaEjecutoria && f.fechaEjecutoria < f.fechaActo) errs.push(['fechaEjecutoria', 'La ejecutoria no puede ser anterior a la fecha del acto.']);
    req('meses', 'Tiempo de sanción', f.meses);
    if (f.meses && +f.meses < 6) errs.push(['meses', 'La sanción debe ser de 6 meses o más.']);
    req('fechaRadicado', 'Fecha de radicado de entrada', f.fechaRadicado); req('radEntrada', 'Radicado de entrada', f.radEntrada.trim()); req('profesional', 'Profesional responsable', f.profesional.trim());
    return errs;
  }
  function secEl(id) { return view.querySelector('#sec-' + id); }
  /* Se lee del DOM (casilla de mensaje) para no mantener un segundo mapa campo→bloque. */
  function secOf(path) { var slot = view.querySelector('[data-err="' + path + '"]'), s = slot && slot.closest('.gi-sec'); return s ? s.id.slice(4) : null; }
  function blockErrors(id) { return validate().filter(function (e) { return secOf(e[0]) === id; }); }
  /* Con root = bloque, los errores de otros bloques se conservan hasta volver a ellos. */
  function showErrors(errs, root) {
    root = root || view;
    root.querySelectorAll('.is-invalid').forEach(function (e) { e.classList.remove('is-invalid'); });
    root.querySelectorAll('.gi-ferr').forEach(function (e) { e.textContent = ''; });
    errs.forEach(function (e) {
      var slot = view.querySelector('[data-err="' + e[0] + '"]');
      if (slot) { slot.textContent = e[1]; var ctl = slot.parentNode.querySelector('.gi-in, .gi-chips, .gf-seg'); if (ctl) ctl.classList.add('is-invalid'); }
    });
    progress();
  }
  function banner(errs) {
    var sum = view.querySelector('#errSum');
    sum.hidden = !errs.length;
    sum.innerHTML = errs.length ? '<strong>No se puede guardar todavía.</strong> Corrige ' + errs.length + ' punto(s):<ul>' + errs.slice(0, 6).map(function (e) { return '<li>' + esc(e[1]) + '</li>'; }).join('') + (errs.length > 6 ? '<li>… y ' + (errs.length - 6) + ' más.</li>' : '') + '</ul>' : '';
  }
  function firstInvalid() {
    var bad = secEl(cur).querySelector('.is-invalid'); if (!bad) return;
    var c = bad.matches('input, select, textarea') ? bad : bad.querySelector('input, select, textarea');
    if (c) c.focus({ preventScroll: true });
    bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  /* ───────── pasos ───────── */
  function steps() { return SECS.filter(function (id) { return !secEl(id).hidden; }); }
  function applyStep() {
    var q = function (s) { return view.querySelector(s); }, list = steps(), start = cur === 'start', i = list.indexOf(cur), s0 = q('#sec-start');
    if (s0) s0.hidden = !start;
    q('.gi-layout').classList.toggle('is-start', start);
    SECS.forEach(function (id) {
      var a = q('#go-' + id), on = id === cur, n = list.indexOf(id);
      secEl(id).classList.toggle('gf-off', !on);
      a.classList.toggle('is-on', on); a.classList.toggle('is-locked', !on && !visited[id]);
      if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      if (on || visited[id]) a.removeAttribute('aria-disabled'); else a.setAttribute('aria-disabled', 'true');
      txt(q('[data-kicker="' + id + '"]'), n >= 0 ? 'Paso ' + (n + 1) + ' de ' + list.length : '');
    });
    var com = q('#gfStart'); if (com) com.hidden = !start;
    q('#gfBack').hidden = start || (i === 0 && !!editId);
    q('#gfNext').hidden = start || i === list.length - 1;
    q('#giSave').hidden = start || i !== list.length - 1;
  }
  function go(id) {
    cur = id; if (id !== 'start') visited[id] = true;
    view.querySelector('#errSum').hidden = true;
    applyStep();
    view.scrollTop = 0;
    var s = secEl(id), h = s && s.querySelector('h2'); if (h) h.focus({ preventScroll: true });
  }
  /* Saltar hacia adelante por el nav no puede dejar atrás un bloque incompleto. */
  function guard(from, to) {
    var list = steps();
    for (var i = from; i < to; i++) {
      var e = blockErrors(list[i]);
      if (!e.length) { showErrors([], secEl(list[i])); continue; }
      if (list[i] !== cur) go(list[i]);
      showErrors(e, secEl(list[i])); firstInvalid();
      return false;
    }
    return true;
  }
  function fail(errs) {
    var at = steps().filter(function (id) { return errs.some(function (e) { return secOf(e[0]) === id; }); })[0] || cur;
    if (at !== cur) go(at);
    showErrors(errs); banner(errs); firstInvalid();
  }
  function save() {
    var errs = validate();
    if (errs.length) return fail(errs);
    var rec = toRec(), dup = GI.duplicado(rec, editId);
    if (dup) return fail([['numActo', 'Ya existe un registro equivalente (' + dup.id + '): misma persona, mismo acto y misma ejecutoria.']]);
    showErrors([]); banner([]);
    /* Los errores de forma se muestran al instante; solo el guardado válido espera. */
    SUID.busy(view.querySelector('#giSave'), editId ? 'Guardando cambios…' : 'Guardando registro…', function () {
      var out;
      if (editId) { out = GI.update(editId, rec, 'Registro actualizado por el profesional.'); UI.toast('Cambios guardados.'); }
      else { out = GI.add(rec); UI.toast('Registro ' + out.id + ' creado en estado Recibido.'); }
      location.hash = UI.BASE.slice(1) + '/' + out.id;
    }, 900);
  }

  /* ───────── eventos ───────── */
  function toggleSw(path) {
    if (path === 'menor') { if (menorNow() === true) return; st.ui.menorOn = !st.ui.menorOn; return; }
    var on = !get(path); set(path, on);
    if (!on) {
      if (path === 'ui.agrOn') st.f.agravantes = [];
      if (path === 'ui.multaOn') { st.f.valor = ''; delete auto.valor; }
      if (/\.a\.adicOn$/.test(path)) { var a = st[path[0]].a; a.adic = ''; a.indic = ''; }
    }
  }
  function bind() {
    var form = view.querySelector('#giForm');
    form.addEventListener('input', function (e) {
      var t = e.target, p = t.getAttribute('data-p');
      if (!p) return;
      var v = t.value;
      if (/\.numId$/.test(p)) { var k = p.split('.')[0]; if (/CC|CE|TI/.test(st[k].tipoId)) v = v.replace(/\D/g, ''); }
      if (/\.telefono$/.test(p) || /\.a\.n[123]$/.test(p) || p === 'meses') v = v.replace(/\D/g, '');
      if (p === 'valor') v = v ? Number(v.replace(/\D/g, '')).toLocaleString('es-CO') : '';
      if (t.value !== v) t.value = v;
      set(p, v); mark(p);
      if (/^[ir]\.ciudad$/.test(p)) inferDepto(p[0]);
      sync();
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox' && t.closest('[data-multi]')) {
        var path = t.closest('[data-multi]').getAttribute('data-multi'), arr = st.f[path].slice(), n = +t.value, i = arr.indexOf(n);
        if (t.checked && i < 0) arr.push(n); if (!t.checked && i >= 0) arr.splice(i, 1);
        st.f[path] = arr; clearErr(path); sync(); return;
      }
      if (t.type === 'radio') {
        var sp = t.closest('[data-sg]').getAttribute('data-sg');
        segSet(sp, t.value); mark(sp); if (sp === 'profSel') mark('profesional');
        if (/\.paisSel$/.test(sp)) mark(sp[0] + '.pais');
        sync(); return;
      }
      var p = t.getAttribute('data-p');
      if (!p) return;
      set(p, t.value); mark(p);
      if (/^[ir]\.pais$/.test(p)) { st[p[0]].depto = ''; st[p[0]].ciudad = ''; }
      if (/^[ir]\.depto$/.test(p)) { var pp = st[p[0]]; if ((GEO()[pp.depto] || []).indexOf(pp.ciudad) < 0) pp.ciudad = ''; }
      if (/^[ir]\.ciudad$/.test(p)) { inferDepto(p[0]); canonCiudad(p[0]); }
      sync();
    });
    form.addEventListener('click', function (e) {
      var s = e.target.closest('[data-sw]'), ev = e.target.closest('[data-ev]'), ans = e.target.closest('[data-evans]'), b = e.target.closest('[data-base]');
      if (s) { if (s.getAttribute('aria-disabled') === 'true') return; toggleSw(s.getAttribute('data-sw')); sync(); }
      if (ev) applyEvent(+ev.getAttribute('data-ev'));
      if (ans) {
        if (ans.getAttribute('data-evans') === 'no') { var f0 = st.f; f0.competicion = ''; f0.local = ''; f0.visitante = ''; f0.ciudadHechos = ''; lastDep.comp = null; lastDep.evDone = null; lastDep.evNo = true; }
        lastDep.evAsk = false; sync(); renderEvents();
        var nx = view.querySelector(ans.getAttribute('data-evans') === 'no' ? '[data-sg="competicion"] input' : '[data-p="ciudadHechos"]'); if (nx) nx.focus();
      }
      if (b) { st.f.descripcion = baseText(); auto.descripcion = 1; clearErr('descripcion'); sync(); var ta = view.querySelector('[data-p="descripcion"]'); ta.focus(); }
    });
    view.querySelector('#gfFilter').addEventListener('input', function (e) {
      var q = norm(e.target.value.trim());
      view.querySelectorAll('[data-multi="origen"] .gi-chip').forEach(function (c) { c.hidden = !!q && norm(c.textContent).indexOf(q) < 0 && !c.querySelector('input').checked; });
    });
    /* Solo se vuelve a bloques ya visitados; ir hacia adelante exige que los de en medio estén completos. */
    view.querySelectorAll('[data-go]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('data-go'), list = steps(), from = list.indexOf(cur), to = list.indexOf(id);
        if (id === cur || !visited[id] || to < 0) return;
        if (to < from || guard(from, to)) go(id);
      });
    });
    var begin = view.querySelector('#gfStart');
    if (begin) begin.addEventListener('click', function () { go(steps()[0]); });
    /* Si el representante apareció detrás del paso actual (la fecha de los hechos hace menor al infractor), se pasa por él primero. */
    view.querySelector('#gfNext').addEventListener('click', function () {
      var list = steps(), i = list.indexOf(cur), behind = list.slice(0, i).filter(function (id) { return !visited[id]; })[0];
      if (guard(i, i + 1)) go(behind || list[i + 1]);
    });
    view.querySelector('#gfBack').addEventListener('click', function () { var list = steps(), i = list.indexOf(cur); go(i > 0 ? list[i - 1] : 'start'); });
    view.querySelector('#giSave').addEventListener('click', save);
  }

  /* «Tramitar» desde Gestión deja {doc, tipo, solicitud}: rellena el infractor y se borra tras usarse. */
  function precarga(p) {
    var pf = null;
    try { pf = JSON.parse(sessionStorage.getItem('suid.gi.prefill') || 'null'); sessionStorage.removeItem('suid.gi.prefill'); } catch (e) { pf = null; }
    if (!pf) return;
    var t = C.tiposId.filter(function (x) { return x === pf.tipo || x.indexOf('(' + pf.tipo + ')') >= 0; })[0];
    if (t) p.tipoId = t;
    if (pf.doc) p.numId = /CC|CE|TI/.test(p.tipoId) ? String(pf.doc).replace(/\D/g, '') : String(pf.doc);
  }

  w.GIForm = {
    open: function (v, ctx, id) {
      view = v; ctxRef = ctx; editId = id; lastDep = {}; auto = {}; touched = {}; pcache = {}; visited = {};
      var rec = id ? GI.get(id) : null;
      if (id && !rec) { location.hash = UI.BASE; return; }
      /* Editar abre en el primer bloque con todo desbloqueado: los datos ya existen. */
      cur = id ? 'ctrl' : 'start';
      if (id) SECS.forEach(function (s) { visited[s] = true; });
      st = { i: blankPerson(), r: blankPerson(), f: blankFlat(), ui: { menorOn: false, mismaDir: false, agrOn: false, multaOn: false, profOtro: false, paisOtro: { i: false, r: false } } };
      evs = buildEvents();
      if (rec) {
        st.i = personFromRec(rec); if (rec.rep) st.r = personFromRec(rec.rep);
        var f = st.f;
        ['fechaHechos', 'competicion', 'ciudadHechos', 'descripcion', 'fechaActo', 'numActo', 'fechaEjecutoria', 'fechaRadicado', 'radEntrada', 'respuesta', 'radContab', 'radJuridica', 'profesional', 'observaciones'].forEach(function (k) { f[k] = rec[k] || ''; });
        f.meses = String(rec.meses || ''); f.valor = rec.valor ? Number(rec.valor).toLocaleString('es-CO') : '';
        f.origen = rec.origen.slice(); f.agravantes = rec.agravantes.slice();
        f.local = rec.local; f.visitante = rec.visitante;
        lastDep.fh = f.fechaHechos;
      } else {
        /* Valores por defecto razonables; se cambian como cualquier campo. */
        var pr = UI.PROFESIONALES.indexOf(GI.USER) >= 0 ? GI.USER : UI.PROFESIONALES[0];
        st.f.profesional = pr; auto.profesional = 1;
        auto.fechaRadicado = 1;
        st.f.radEntrada = nextRad(); auto.radEntrada = 1;
        precarga(st.i);
      }
      var u = st.ui;
      u.paisOtro.i = st.i.pais !== 'Colombia'; u.paisOtro.r = st.r.pais !== 'Colombia';
      u.menorOn = !!(rec && rec.rep); u.agrOn = st.f.agravantes.length > 0; u.multaOn = !!st.f.valor;
      u.profOtro = !!(st.f.profesional && UI.PROFESIONALES.indexOf(st.f.profesional) < 0);
      ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Gestión', href: UI.BASE }, { label: id ? 'Editar ' + id : 'Registrar infractor' }];
      build(); bind();
      if (rec) {
        lastDep.comp = rec.competicion;
        var eq = C.equipos[rec.competicion] || C.equipos['Liga'];
        fillSel(null, eq, 'local', 'Seleccionar equipo'); fillSel(null, eq, 'visitante', 'Seleccionar equipo');
      }
      sync();
    }
  };
})(window, document);
