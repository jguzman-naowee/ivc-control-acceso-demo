/* Expediente único en dos densidades: compacto (panel lateral) e interno (vista completa). Casos: medida, gestion, solicitud.
   Contrato en coord/contrato_expediente.md. Los textos de `m` van crudos salvo los marcados HTML (los escapa quien arma `m`). */
(function (w) {
  'use strict';
  var GI = w.GI, U = GI.util, D = GI.derive, C = GI.cat;
  var BASE = '#/control-acceso/infractores', SOLS = '#/control-acceso/solicitudes';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function vacio(v) { return v === '' || v == null ? '—' : v; }

  /* Conducta corta y artículo: los comparten la tabla de Gestión y el resumen del expediente. */
  var CORTA = ['Ingreso o posesión de armas u objetos peligrosos', 'Ingreso o posesión de estupefacientes', 'Violencia contra la fuerza pública', 'Invasión del terreno de juego', 'No atender las recomendaciones de logística', 'Ingreso o consumo de bebidas alcohólicas', 'Agresión física', 'Agresión verbal', 'Daño a infraestructura', 'Derecho de admisión'];
  function artDe(i) { return (/Art\. (\d+)/.exec(C.origen[i]) || [0, 'Admisión'])[0]; }

  /* ───────── piezas ───────── */
  function bd(b) { return '<span class="gx-bd gx-bd--' + esc(b.tono || 'neu') + '">' + esc(b.t) + '</span>'; }
  function cap(t) { return '<h3 class="gx-cap">' + esc(t) + '</h3>'; }
  function sec(inner, o) { return inner ? '<section class="gx-sec' + (o && o.cls ? ' ' + o.cls : '') + '"' + (o && o.attr ? ' ' + o.attr : '') + '>' + inner + '</section>' : ''; }
  function kv(rows, cls) {
    return '<dl class="gx-kv' + (cls ? ' ' + cls : '') + '">' + rows.map(function (f) {
      var k = f.k != null ? f.k : f[0], v = f.k != null ? f.v : f[1], ancho = f.k != null ? f.ancho : f[2];
      return '<div' + (ancho ? ' class="gx-kv__w"' : '') + '><dt>' + esc(k) + '</dt><dd>' + vacio(v) + '</dd></div>';
    }).join('') + '</dl>';
  }
  function aviso(a) { return '<p class="gx-aviso gx-aviso--' + esc(a.tono || 'info') + '" role="note">' + a.html + '</p>'; }

  /* Caja de estado: cada línea cabe en una sola (nowrap + elipsis) y, recortada, se lee por el title (DC-069). */
  function estadoBox(e, grande) {
    if (!e) return '';
    var lineas = (e.lineas || []).map(function (l) { return '<span class="gx-estado__l" title="' + String(l).replace(/<[^>]+>/g, '') + '">' + l + '</span>'; }).join('');
    var pr = e.progreso == null ? '' : '<div class="gx-bar" role="img" aria-label="Vigencia transcurrida: ' + Math.round(e.progreso) + ' %"><i style="width:' + Math.max(2, Math.min(100, e.progreso)) + '%"></i></div>';
    return '<div class="gx-estado gx-estado--' + esc(e.tono || 'gr') + (grande === false ? ' gx-estado--s' : '') + '"><strong class="gx-estado__t" title="' + esc(e.titulo) + '">' + esc(e.titulo) + '</strong>' + lineas + pr +
      (e.desde ? '<span class="gx-estado__d">' + esc(e.desde) + '</span>' : '') + '</div>';
  }

  /* Pista de pasos: ✓ = hecho, número = pendiente; el actual lleva aria-current. */
  function steps(et, vertical) {
    if (!et || !et.length) return '';
    var ol = '<ol class="gx-steps' + (vertical ? ' gx-steps--v' : '') + '">' + et.map(function (e, i) {
      var on = e.estado === 'on', done = e.estado === 'done';
      return '<li class="gx-step' + (on ? ' gx-step--on' : done ? ' gx-step--done' : '') + '"' + (on ? ' aria-current="step"' : '') + '><b aria-hidden="true">' + (done ? '✓' : i + 1) + '</b>' + esc(e.t) +
        '<span class="gx-sr">' + (done ? ' (hecho)' : on ? ' (paso actual)' : ' (pendiente)') + '</span></li>';
    }).join('') + '</ol>';
    return vertical ? ol : '<div class="gx-stepper"><button type="button" class="gx-sb" data-sb="-1" aria-label="Pasos anteriores">‹</button>' + ol + '<button type="button" class="gx-sb" data-sb="1" aria-label="Pasos siguientes">›</button></div>';
  }
  w.document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-sb]'); if (!b) return;
    b.parentNode.querySelector('.gx-steps').scrollBy({ left: +b.getAttribute('data-sb') * 140, behavior: 'smooth' });
  });

  /* Foto y huella: normales, difuminadas (menor) o con candado (reservado). sm = 64×80, xs = 48×60. */
  function bio(m, tam) {
    var h = !w.GIBio ? '' : m.reservado ? w.GIBio.reservada() : w.GIBio.par(m.docDigitos || m.doc, { menor: !!m.menor });
    return '<div class="gx-bio gx-bio--' + tam + '">' + h + '</div>';
  }

  /* Perfil de afinidad: menor o reservado = sin cálculo (GI.perfilDe lo devuelve reservado). */
  function perfilDe(m) { return GI.perfilDe ? GI.perfilDe(m.docDigitos || m.doc, { menor: !!(m.menor || m.reservado) }) : null; }
  function motivoReserva(p) { return p.motivo === 'menor' ? 'Perfil de afinidad no disponible: la persona es menor de edad.' : 'Perfil de afinidad no disponible: el documento no está completo.'; }
  function barras(c) {
    var on = c.cert == null ? 0 : Math.round(c.cert / 20), h = '';
    [8, 11, 14, 17, 20].forEach(function (a, i) { h += '<i' + (i < on ? '' : ' class="gx-o"') + ' style="height:' + a + 'px"></i>'; });
    return '<span class="gx-bars" aria-hidden="true">' + h + '</span>';
  }
  function escudo(c, px) {
    return c.concluyente ? GI.clubAvatar(c.nombre, px) : '<span class="gpf-av gpf-av--nc" style="--gpf-av:' + px + 'px" aria-hidden="true">?</span>';
  }
  /* Una fila: escudo + club + barras + %. `mini` = versión de una línea junto a foto y huella. */
  function clubRow(p, mini) {
    var c = p.club, pct = c.cert == null ? 'Sin dato' : '<span class="gx-sr">Certeza: </span>' + c.cert + ' %', nombre = c.concluyente ? c.nombre : 'No concluyente';
    if (mini) return '<div class="gx-club gx-club--mini">' + escudo(c, 30) + '<div class="gx-club__t"><b>' + esc(nombre) + '</b><span>Indicador inferido · ' + pct + '</span></div></div>';
    return '<div class="gx-club">' + escudo(c, 40) + '<div class="gx-club__t"><span class="gx-cap">Club afín</span><b>' + esc(nombre) + '</b><span>' + esc(c.por) + '</span></div>' +
      '<div class="gx-club__c">' + barras(c) + '<b>' + pct + '</b></div></div>';
  }
  function reserva(p) {
    return '<p class="gx-reserva" role="note"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span>' + esc(motivoReserva(p)) + '</span></p>';
  }
  var NOTA_FIC = 'Indicador inferido.';

  /* ───────── compacto ───────── */
  function bloqueResumen(m) {
    if (!m.resumen || !m.resumen.length) return '';
    var extra = (m.relato ? '<p class="gx-relato">' + esc(m.relato) + '</p>' : '') +
      (m.chips && m.chips.length ? '<ul class="gx-chips">' + m.chips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '');
    return sec((m.resumenTitulo === '' ? '' : cap(m.resumenTitulo || (m.caso === 'solicitud' ? 'Qué reporta' : 'Resumen de la medida'))) + kv(m.resumen, 'gx-kv--lista') + extra);
  }
  function bloquePersona(m, p) {
    return sec('<div class="gx-persona">' + bio(m, 'sm') + '</div>');
  }
  function bloqueAfinidad(m, p) {
    if (!p) return '';
    return sec(cap('Afinidad') + (p.reservado ? reserva(p) : clubRow(p) + '<p class="gx-nota">' + NOTA_FIC + '</p>'));
  }
  function bloquePersonaAfinidad(m, p) {
    if (!p) return '';
    return sec(cap('Persona y afinidad') + '<div class="gx-persona gx-persona--c">' + bio(m, 'xs') + (p.reservado ? '<p class="gx-nota gx-nota--r">' + esc(motivoReserva(p)) + '</p>' : clubRow(p, true)) + '</div>');
  }
  function lineaMov(x) { return esc(x.fecha) + (x.por ? ' · ' + esc(x.por) : x.nota ? ' · ' + esc(x.nota) : ''); }
  function bloqueMov(m) {
    var h = (m.movimientos || []).slice(0, 2);
    if (!h.length) return '';
    return sec(cap('Últimos movimientos') + '<ul class="gx-tl">' + h.map(function (x, i) { return '<li><i class="gx-dot' + (i ? ' gx-dot--g' : '') + '"></i><div><b>' + esc(x.t) + '</b><small>' + lineaMov(x) + '</small></div></li>'; }).join('') + '</ul>');
  }

  function compacto(m) {
    var p = perfilDe(m), c = [], avisos = (m.avisos || []).concat(m.aviso ? [m.aviso] : []).map(aviso).join('');
    if (m.caso === 'gestion') {
      c.push(sec(estadoBox(m.estado), { cls: 'gx-sec--1' }));
      c.push(sec(cap(m.etapasTitulo || 'Estado del registro') + steps(m.etapas) + (m.etapasNota ? '<p class="gx-nota">' + esc(m.etapasNota) + '</p>' : '') + avisos));
      c.push(bloqueResumen(m));
      if (m.interna && m.interna.length) c.push(sec(cap(m.internaTitulo || 'Gestión interna') + kv(m.interna, 'gx-kv--lista')));
      c.push(bloquePersonaAfinidad(m, p));
    } else if (m.caso === 'solicitud') {
      if (m.estado) c.push(sec(estadoBox(m.estado), { cls: 'gx-sec--1' }));
      c.push(sec(steps(m.etapas) + avisos, m.estado ? null : { cls: 'gx-sec--1' }));
      c.push(bloqueResumen(m));
      c.push(bloquePersonaAfinidad(m, p));
      if (m.siguiente) c.push(sec(cap('Siguiente paso') + m.siguiente));
    } else {
      c.push(sec(estadoBox(m.estado) + avisos, { cls: 'gx-sec--1' }));
      c.push(bloquePersona(m, p));
      c.push(bloqueResumen(m));
      c.push(bloqueAfinidad(m, p));
      c.push(bloqueMov(m));
    }
    return {
      id: m.id, tag: (m.badges || []).map(bd).join(''), meta: m.meta || m.id, titulo: m.nombre,
      chip: m.menor && !m.reservado ? bd({ t: 'Menor de edad', tono: 'neu' }) : '', sub: m.sub || '',
      cuerpo: '<div class="gx-cuerpo">' + c.join('') + '</div>', acciones: m.acciones || '', nota: m.nota || '', onPintar: m.onPintar
    };
  }

  /* ───────── interno ───────── */
  function card(t, inner, extra, cls) { return '<section class="gx-card' + (cls ? ' ' + cls : '') + '"><h3 class="gx-card__t">' + esc(t) + (extra || '') + '</h3>' + inner + '</section>'; }
  function tarjeta(s) { return card(s.t, s.html != null ? '<div class="gx-card__p">' + s.html + '</div>' : kv(s.kv, 'gx-kv--3')); }
  function afinidadCard(m, p) {
    if (!p || m.sinAfinidad) return '';
    if (p.reservado) return card('Perfil y afinidad', reserva(p));
    var U6 = GI.perfilUmbral || { certeza: 60 };
    var tiles = p.senales.map(function (s) { return '<div><small>' + esc(s.etiqueta) + '</small><b>' + esc(s.valor) + '</b></div>'; }).join('') +
      '<div><small>Umbral</small><b>' + U6.certeza + ' % (propuesto)</b></div>';
    return card('Perfil y afinidad', '<p class="gx-aviso gx-aviso--info" role="note">Estas señales informan, no deciden. No hay un puntaje de peligrosidad: cada dato dice de dónde sale.</p>' + clubRow(p) +
      '<div class="gx-sig">' + tiles + '</div><p class="gx-nota">Señal inferida, no certeza. La consulta queda en la auditoría y la persona puede apelar. Datos ficticios del demo.</p>',
      ' <span class="gx-bd gx-bd--neu">Señal inferida</span>');
  }
  function tlHtml(h) {
    return '<ul class="gx-tl">' + (h || []).map(function (x, i) {
      return '<li><i class="gx-dot' + (i ? ' gx-dot--g' : '') + '"></i><div><b>' + esc(x.t) + '</b><small>' + esc(x.fecha) + (x.por ? ' · ' + esc(x.por) : '') + '</small>' + (x.nota ? '<span class="gx-tl__n">' + esc(x.nota) + '</span>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }

  function interno(m) {
    var p = perfilDe(m), left = [], right = [];
    (m.seccionesAntes || []).forEach(function (s) { left.push(tarjeta(s)); });
    if (m.persona) left.push(card(m.persona.t || 'Persona', '<div class="gx-bio-w">' + bio(m, 'lg') + '</div>' + kv(m.persona.kv, 'gx-kv--3')));
    left.push(afinidadCard(m, p));
    if (m.rep) left.push(card(m.rep.t, kv(m.rep.kv, 'gx-kv--3')));
    (m.secciones || []).forEach(function (s) { left.push(tarjeta(s)); });
    right.push(card('Estados', estadoBox(m.estado, false) + steps(m.etapasInterno || m.etapas, true) + (m.estadosNota ? '<div class="gx-card__p">' + m.estadosNota + '</div>' : ''), '',
      'gx-card--est' + (m.estado ? ' gx-card--' + esc(m.estado.tono || 'gr') : '')));
    right.push(card('Historial', m.historial && m.historial.length ? tlHtml(m.historial) : '<p class="gx-nota">Sin movimientos.</p>'));
    if (m.relacionados && m.relacionados.length) right.push(card('Relacionados', kv(m.relacionados, 'gx-kv--1')));
    return '<div class="gx-int"><div class="gx-int__col">' + left.join('') + '</div><aside class="gx-int__side" aria-label="Estados, historial y relacionados">' + right.join('') + '</aside></div>';
  }

  /* ───────── modelos de apoyo ───────── */
  function dd(s) { return U.fmt(s).slice(0, 5); }
  function dinero(v) { return v ? '$' + Number(v).toLocaleString('es-CO') : ''; }
  function lista(items) { return '<ul class="gx-list">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }
  function personaKv(p, r) {
    var edad = U.ageAt(p.fechaNac, r.fechaHechos);
    return [[ 'Documento', esc(p.tipoId) + ' · ' + esc(GI.fmtDoc(p.tipoId, p.numId))], ['Nombre completo', esc((p.nombres + ' ' + p.apellidos).trim())],
      ['Residencia', esc([p.ciudad, p.depto, p.pais].filter(Boolean).join(', '))], ['Dirección', esc(p.dir)],
      ['Teléfono', p.telefono ? esc(p.indicativo + ' ' + p.telefono) : ''], ['Correo', esc(p.correo)],
      ['Fecha de nacimiento', U.fmt(p.fechaNac)], ['Edad', edad != null ? edad + ' años (a la fecha de los hechos)' : ''], ['Sexo', esc(p.sexo)]];
  }
  var TONO_REG = { Recibido: 'info', Validado: 'pos', 'Por Subsanar': 'cau' }, TONO_RES = { Activa: 'neg', Inactiva: 'neu', Cumplida: 'pos' };

  /* Registro de Gestión -> m. Validado = caso medida; Recibido / Por Subsanar = caso gestion. */
  function deRegistro(r) {
    var res = D.estadoRestriccion(r), menor = !!D.esMenor(r), fin = D.finVigencia(r), dias = D.diasRestantes(r), ini = U.addDays(r.fechaEjecutoria, 1);
    var sigla = r.tipoId.replace(/^.*\(|\)$/g, ''), edad = U.ageAt(r.fechaNac, r.fechaHechos), val = r.estadoRegistro === 'Validado', porSub = r.estadoRegistro === 'Por Subsanar';
    var enl = w.GS ? w.GS.porMedida(r.id) : [], misma = GI.all().filter(function (x) { return x.numId === r.numId && x.tipoId === r.tipoId && x.id !== r.id; });
    var doc = sigla + ' ' + GI.fmtDoc(r.tipoId, r.numId), vig = fin ? 'Vigencia del ' + U.fmt(ini) + ' al ' + U.fmt(fin) : '';
    var total = fin ? Math.max(1, Math.round((U.parse(fin) - U.parse(ini)) / 86400000)) : 1, corrido = fin ? Math.round((U.parse(U.today()) - U.parse(ini)) / 86400000) : 0;
    var desde = fin ? 'Desde ' + U.fmt(ini) + ' · ' + r.meses + ' meses' : '';
    var estado;
    if (res === 'Activa') estado = { tono: 'neg', titulo: 'Activa · bloquea en todo el país', lineas: ['Hasta el <b>' + U.fmt(fin) + '</b> · <b>' + esc(GI.fmtDias(dias).toLowerCase()) + '</b>'], progreso: corrido * 100 / total, desde: desde };
    else if (res === 'Cumplida') estado = { tono: 'ok', titulo: 'Cumplida · no bloquea', lineas: ['Cumplida el <b>' + U.fmt(D.fechaCumplida(r) || U.addDays(fin, 1)) + '</b>', esc(vig)], progreso: 100, desde: desde };
    else estado = { tono: porSub ? 'cau' : 'gr', titulo: porSub ? 'Inactiva · por subsanar' : 'Inactiva · aún no bloquea',
      lineas: (porSub ? ['Devuelta a la inspección de policía'].concat(r.observaciones ? ['Motivo: ' + esc(r.observaciones)] : []) : ['Pasa a <b>Activa</b> al quedar <b>Validado</b>']).concat(fin ? ['Vigencia prevista hasta <b>' + U.fmt(fin) + '</b>'] : []) };
    var hist = r.historial.slice().reverse().map(function (h) {
      return { t: h.de === h.a || !h.de ? h.a : h.de + ' → ' + h.a, por: h.usuario || 'Sistema', nota: h.nota, fecha: U.fmt(h.fecha) + ' ' + h.hora };
    });
    var i0 = r.origen[0], conducta = '<span class="gx-tag">' + esc(artDe(i0)) + '</span> ' + esc(CORTA[i0] || '') + (r.origen.length > 1 ? ' <span class="gx-mas">(+' + (r.origen.length - 1) + ')</span>' : '');
    var sancion = [{ k: 'Tiempo', v: r.meses + ' meses' }].concat(r.valor ? [{ k: 'Valor', v: dinero(r.valor) }] : []);
    var resumen = val ? [{ k: 'Conducta', v: conducta }, { k: 'Acto', v: esc(r.numActo) }, { k: 'Evento', v: esc(GI.titulo(r.local + ' vs. ' + r.visitante)) }, { k: 'Fecha', v: U.fmt(r.fechaHechos) }].concat(r.ciudadHechos ? [{ k: 'Lugar', v: esc(GI.titulo(r.ciudadHechos)) }] : [], sancion)
      : [{ k: 'Conducta', v: conducta }, { k: 'Acto', v: esc(r.numActo) }, { k: 'Fecha del acto', v: U.fmt(r.fechaActo) }, { k: 'Ejecutoria', v: U.fmt(r.fechaEjecutoria) }].concat(sancion);
    var enlHtml = enl.length ? enl.map(function (x) { return '<a href="' + SOLS + '">' + esc(x.id) + '</a>' + (x.origen ? ' · ' + esc(x.origen) : ''); }).join('<br>') : '';
    var otras = misma.length ? misma.map(function (x) { return '<a href="' + BASE + '/' + esc(x.id) + '">' + esc(x.id) + '</a>'; }).join(', ') : 'Ninguna';
    var fVal = D.fechaValidacion(r);
    var segundo = val ? { t: 'Validado', estado: 'done' } : { t: porSub ? 'Por subsanar' : 'Validar', estado: 'on' };
    var m = {
      caso: val ? 'medida' : 'gestion', id: r.id, nombre: D.nombreCompleto(r), menor: menor, reservado: false, doc: doc, docDigitos: r.numId,
      sub: doc + (edad != null ? ' · ' + edad + ' años' : '') + (r.ciudad ? ' · ' + GI.titulo(r.ciudad) : ''),
      badges: [{ t: res, tono: TONO_RES[res] || 'neu' }, { t: r.estadoRegistro, tono: TONO_REG[r.estadoRegistro] || 'neu' }],
      estado: estado,
      etapas: [{ t: 'Recibido', estado: 'done' }, segundo, { t: res === 'Cumplida' ? 'Cumplida' : 'Activa', estado: res === 'Activa' ? 'on' : res === 'Cumplida' ? 'done' : 'next' }],
      etapasInterno: [{ t: 'Recibido · ' + dd(r.fechaRegistro), estado: 'done' }, val ? { t: 'Validado' + (fVal ? ' · ' + dd(fVal) : ''), estado: 'done' } : { t: porSub ? 'Por subsanar' : 'Validar registro', estado: 'on' },
        { t: res === 'Cumplida' ? 'Restricción cumplida' : 'Restricción activa', estado: res === 'Activa' ? 'on' : res === 'Cumplida' ? 'done' : 'next' }],
      etapasNota: 'Recibido el ' + U.fmt(r.fechaRegistro) + (r.profesional ? ' por ' + r.profesional : '') + '. Para validar o devolver, abre el expediente.',
      resumen: resumen, interna: [{ k: 'Radicado de entrada', v: esc(r.radEntrada) }, { k: 'Profesional', v: esc(r.profesional) }, { k: 'Solicitud de origen', v: enlHtml || '—' }, { k: 'Otras restricciones', v: otras }],
      movimientos: hist,
      persona: { t: 'Infractor', kv: personaKv(r, r) }, rep: r.rep ? { t: 'Representante legal o tutor', kv: personaKv(r.rep, r) } : null,
      secciones: [
        { t: 'Hechos y conducta', kv: [['Fecha de los hechos', U.fmt(r.fechaHechos)], ['Competición', esc(r.competicion + (r.otraCompeticion ? ' · ' + r.otraCompeticion : ''))],
          ['Evento deportivo', esc(GI.titulo(r.local + ' vs. ' + r.visitante))], ['Ciudad de los hechos', esc(GI.titulo(r.ciudadHechos))],
          ['Origen de la obligación', lista(r.origen.map(function (i) { return C.origen[i]; })), true],
          ['Agravantes', r.agravantes.length ? lista(r.agravantes.map(function (i) { return C.agravantes[i]; })) : 'Ninguno', true], ['Descripción', esc(r.descripcion), true]] },
        { t: 'Sanción', kv: [['Acto administrativo', esc(r.numActo) + ' · ' + U.fmt(r.fechaActo)], ['Constancia de ejecutoria', U.fmt(r.fechaEjecutoria)], ['Tiempo de sanción', r.meses + ' meses'], ['Fin de vigencia', U.fmt(fin)], ['Valor de la sanción', dinero(r.valor) || '—']] },
        { t: 'Gestión interna', kv: [['Fecha de radicado de entrada', U.fmt(r.fechaRadicado)], ['Radicado de entrada en Mindeporte', esc(r.radEntrada)], ['Respuesta al radicado', esc(r.respuesta)], ['Radicado contabilidad', esc(r.radContab)],
          ['Radicado jurídica', esc(r.radJuridica)], ['Profesional responsable', esc(r.profesional)], ['Observaciones', esc(r.observaciones), true]] }],
      relacionados: [{ k: 'Solicitud de origen', v: enlHtml || '—' }, { k: 'Otras restricciones de esta persona', v: otras }],
      historial: hist,
      acciones: '<a class="naowee-btn naowee-btn--loud" href="' + BASE + '/' + esc(r.id) + '" data-k="exp">Ver expediente</a><a class="naowee-btn naowee-btn--quiet" href="' + BASE + '/' + esc(r.id) + '/editar">Editar</a>'
    };
    return m;
  }

  /* Solicitud de gi-solicitudes -> m (caso solicitud). opts: acciones, siguiente, onPintar. */
  var PASOS = [['enviado', 'Enviado'], ['recibido', 'Recibido'], ['tramite', 'En trámite'], ['derivo', 'Derivó en medida']];
  var TONO_SOL = { enviado: 'info', recibido: 'neu', tramite: 'cau', derivo: 'neg', archivado: 'neu' };
  function deSolicitud(s, opts) {
    opts = opts || {};
    var idx = PASOS.map(function (x) { return x[0]; }).indexOf(s.estado), arch = s.estado === 'archivado', medida = s.medida && GI.get(s.medida);
    var etapas = PASOS.map(function (x, i) { return { t: x[1], estado: arch ? (i === 0 ? 'done' : 'next') : i < idx ? 'done' : i === idx ? 'on' : 'next' }; });
    var estado = arch ? { tono: 'gr', titulo: 'Archivada: ' + s.motivoArchivo, lineas: s.notaArchivo ? [esc(s.notaArchivo)] : [] }
      : s.estado === 'derivo' ? { tono: 'info', titulo: 'Derivó en la medida ' + s.medida, lineas: medida ? ['<a href="' + BASE + '/' + esc(s.medida) + '">Abrir la ficha en Gestión</a>'] : [] } : null;
    var avisos = [{ tono: 'info', html: '<strong>Un reporte no bloquea por sí solo.</strong> Solo una medida vigente bloquea el ingreso.' }];
    if (s.menor) avisos.push({ tono: 'warn', html: '<strong>Reserva reforzada.</strong> La persona es menor de edad: no se muestra su nombre, su foto ni su huella.' });
    var nombre = s.menor ? 'Menor de edad · ' + s.iniciales : s.nombre, digs = String(s.doc || '').replace(/\D/g, '');
    var hist = (s.hist || []).slice().reverse().map(function (x) { return { t: x.texto, por: x.quien, fecha: x.fecha }; });
    var sinEv = /^sin /i.test(s.evid || ''), ev = GI.titulo(s.evento || '').split(' · ');
    return {
      caso: 'solicitud', id: s.id, meta: s.id + ' · ' + String(s.fecha).replace(/ \d{4} ·/, ' ·'), nombre: nombre, menor: !!s.menor, reservado: !!s.menor, doc: s.doc, docDigitos: digs,
      sub: s.doc + ' · reportado por ' + s.origen, badges: [{ t: (PASOS.concat([['archivado', 'Archivado']]).filter(function (x) { return x[0] === s.estado; })[0] || [0, s.estado])[1], tono: TONO_SOL[s.estado] || 'neu' }],
      estado: estado, etapas: etapas, avisos: avisos,
      resumenTitulo: 'Qué reporta', resumenColumnas: 1, resumen: [{ k: 'Evento', v: esc(ev[0]) }].concat(ev[1] ? [{ k: 'Fecha', v: esc(ev[1]) }] : [], ev[2] ? [{ k: 'Lugar', v: esc(ev.slice(2).join(' · ')) }] : [], [{ k: 'Conducta', v: esc((s.conductas || []).join('; ')) }, { k: 'Autoridad competente', v: esc(s.autoridad) }]),
      relato: s.descripcion, chips: sinEv ? [] : [s.evid],
      siguiente: opts.siguiente || '', acciones: opts.acciones || '', onPintar: opts.onPintar,
      seccionesAntes: [{ t: 'Reporte', kv: [['Reportado por', esc(s.origen)], ['Tipo de entidad', esc(s.tipo)], ['Fecha del reporte', esc(s.fecha)], ['Número', esc(s.id)]] }],
      persona: { t: 'Persona', kv: [['Persona', s.menor ? 'Menor de edad · ' + esc(s.iniciales) : esc(s.nombre)], ['Documento', esc(s.doc)], ['Reportado por', esc(s.origen) + ' · ' + esc(s.tipo)]] },
      secciones: [{ t: 'Evento y conducta', kv: [['Evento', esc(GI.titulo(s.evento)), true], ['Fecha de los hechos', esc(s.hechos)], ['Autoridad competente', esc(s.autoridad)], ['Conductas', esc((s.conductas || []).join('; ')), true]] },
        { t: 'Relato', html: '<p>' + esc(s.descripcion) + '</p>' }, { t: 'Evidencia', html: '<p>' + esc(s.evid) + '</p>' }],
      estadosNota: aviso(avisos[0]) + (avisos[1] ? aviso(avisos[1]) : ''),
      relacionados: [{ k: 'Medida enlazada', v: s.medida ? '<a href="' + BASE + '/' + esc(s.medida) + '">' + esc(s.medida) + '</a>' : 'Aún sin medida: se enlaza al pasar a trámite' }],
      historial: hist
    };
  }

  GI.expediente = { compacto: compacto, interno: interno, deRegistro: deRegistro, deSolicitud: deSolicitud, CORTA: CORTA, artDe: artDe };
})(window);
