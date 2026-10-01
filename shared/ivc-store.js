/* ═══════════════════════════════════════════════════════════════════════
   Naowee IVC — Store (v1.5.0)

   Source of truth para el demo end-to-end. Persiste trámites + asignaciones
   en localStorage bajo el namespace 'ivc:'.

   Doc del plan: /docs/PLAN-END-TO-END.md

   Uso:
     <script src="../shared/ivc-store.js"></script>
     IVCStore.init();
     var tramites = IVCStore.getTramites({ area: 'aficionado' });
     IVCStore.asignar('IVC-2026-00001', 'cp-001', 'Carolina Méndez');
     IVCStore.on('tramite:asignado', function(t){ renderTabla(); });

   Cross-tab: escucha el evento `storage` del browser → notifica listeners
   cuando otra tab modifica el store.
   ═══════════════════════════════════════════════════════════════════════ */

(function (root) {
  'use strict';

  var KEY = 'ivc:store';
  var SEED_VERSION = 8;            /* v1.13.56 (Doug + Danna 2026-05-29): bump fuerza reseed — IVC-2026-014 migrado de 'PendienteFirma' a 'Firmado' para que la consulta pública muestre el nuevo CTA "¿Cómo notificar al organismo?" (modal movido del director al organismo según Flujo V4). */

  /* ─── Seed inicial ───────────────────────────────────────────────────
     v1.5.3 FIX (25/05/2026): bug crítico — antes mkSeed referenciaba
     SEED.profesionales mientras SEED se estaba construyendo, lo que tiraba
     "Cannot read property of undefined" y dejaba IVCStore sin asignar.
     Solución: extraer PROFESIONALES y SEED_TRAMITES_RAW como constantes
     independientes y construir SEED con .map(). */
  var PROFESIONALES = [
    { id: 'cp-001', nombre: 'Carlos Pérez',     area: 'aficionado', activos: 12 },
    { id: 'mg-002', nombre: 'María García',     area: 'aficionado', activos: 8  },
    { id: 'al-003', nombre: 'Andrés López',     area: 'aficionado', activos: 15 },
    { id: 'lr-004', nombre: 'Lucía Ramírez',    area: 'aficionado', activos: 5  }
  ];

  /* v1.13.33 (Doug 27/05/2026): nuevo array de PERSONAS del equipo IVC,
     centraliza TODOS los miembros (no solo profesionales). El Coordinador
     gestiona este equipo desde /coordinador/equipo.html.
     PROFESIONALES queda como sub-vista (rol='profesional' + activo).
     Roles: profesional | director | coordinador | atu | git | juridica.
     Estados: activo | pendiente | inactivo. */
  var PERSONAS = [
    /* Coordinadores */
    { id: 'co-001', nombre: 'Carolina Méndez',     email: 'carolina.mendez@deporte.gov.co',  cedula: 'CC 52.345.678', rol: 'coordinador', area: null,         estado: 'activo',    fechaInvitacion: '2024-01-15', fechaActivacion: '2024-01-15' },

    /* Profesionales IVC — sincronizado con PROFESIONALES para back-compat. */
    { id: 'cp-001', nombre: 'Carlos Pérez',        email: 'carlos.perez@deporte.gov.co',     cedula: 'CC 79.123.456', rol: 'profesional', area: 'aficionado', estado: 'activo',    fechaInvitacion: '2024-02-10', fechaActivacion: '2024-02-12' },
    { id: 'mg-002', nombre: 'María García',        email: 'maria.garcia@deporte.gov.co',     cedula: 'CC 52.456.789', rol: 'profesional', area: 'aficionado', estado: 'activo',    fechaInvitacion: '2024-02-10', fechaActivacion: '2024-02-12' },
    { id: 'al-003', nombre: 'Andrés López',        email: 'andres.lopez@deporte.gov.co',     cedula: 'CC 80.234.567', rol: 'profesional', area: 'aficionado', estado: 'activo',    fechaInvitacion: '2024-03-05', fechaActivacion: '2024-03-07' },
    { id: 'lr-004', nombre: 'Lucía Ramírez',       email: 'lucia.ramirez@deporte.gov.co',    cedula: 'CC 43.345.678', rol: 'profesional', area: 'aficionado', estado: 'activo',    fechaInvitacion: '2024-04-01', fechaActivacion: '2024-04-03' },

    /* Director IVC */
    { id: 'dir-001', nombre: 'María Helena Ramos', email: 'mh.ramos@deporte.gov.co',         cedula: 'CC 41.567.890', rol: 'director',    area: null,         estado: 'activo',    fechaInvitacion: '2024-01-10', fechaActivacion: '2024-01-12' },

    /* ATU · GIT · Jurídica — un titular por área. */
    { id: 'atu-001', nombre: 'Patricia Sánchez',   email: 'p.sanchez@deporte.gov.co',        cedula: 'CC 52.678.901', rol: 'atu',        area: null,          estado: 'activo',    fechaInvitacion: '2024-03-15', fechaActivacion: '2024-03-15' },
    { id: 'git-001', nombre: 'Roberto Castro',     email: 'r.castro@deporte.gov.co',         cedula: 'CC 79.789.012', rol: 'git',        area: null,          estado: 'activo',    fechaInvitacion: '2024-03-20', fechaActivacion: '2024-03-22' },
    { id: 'jur-001', nombre: 'Diana Quintero',     email: 'd.quintero@deporte.gov.co',       cedula: 'CC 52.890.123', rol: 'juridica',   area: null,          estado: 'activo',    fechaInvitacion: '2024-04-05', fechaActivacion: '2024-04-07' }
  ];

  /* v1.7.3 (26/05/2026): factory de datos mock por tipo de organismo.
     Cubre todos los campos obligatorios del matriz oficial XLSX, así el
     modal "Ver detalle del trámite" muestra info completa en lugar de "—".

     Cada tipo (liga/asociacion/federacion) tiene sus secciones obligatorias:
       - generales: nombre, NIT (solo liga), dirección, municipio, teléfono, correo
       - personeria: f1.* / f2.* / f3.* según organismo
       - asamblea: f1_* (liga) / f3_* (federación) — N/A en asociación
       - estructura: f1_* / f2_* / f3_*
       - cierre: certificaciones + radicado + observaciones + archivos */
  function _mockDatos(tipoOrg, organismo, nit) {
    var base = {
      nombre: organismo,
      direccion: 'Carrera 13 # 45-67, Edificio Polideportivo, oficina 502',
      municipio: 'Bogotá D.C.',
      telefono: '+57 601 555 0123',
      correo: 'contacto@' + organismo.toLowerCase().replace(/[^a-z]+/g,'') + '.org.co'
    };
    if (tipoOrg === 'liga') {
      base.nit = nit;
      base.f1 = {
        no_res_personeria:    'Res. 0421-2018',
        radicado_personeria:  'RAD-2018-04-0421',
        fecha_reforma:        '2024-03-15',
        radicado_estatutos:   'RAD-2024-03-0918',
        no_res_estatutos:     'Res. 0918-2024',
        periodo_inicial:      '2020-2024',
        periodo_vigente:      '2024-2028',
        no_res_rd_anterior:   'Res. 0210-2020',
        fecha_notif_rd:       '2020-04-02',
        fecha_firmeza_rd:     '2020-04-18',
        f1_no_acta_miembros:  'Acta 03-2024',
        tiene_constancia:     'si',
        fecha_constancia:     '2024-04-10',
        no_res_minimos:       'Res. 0210-2024',
        n_minimos:            '15'
      };
      base.asamblea = {
        f1_tema:                          'Elección de dignatarios período 2024-2028',
        f1_reuniones: [
          { tipo: 'ORDINARIA',             fechaConv: '2024-03-15', fechaReal: '2024-03-30', antelacion: '2024-03-15', cumple: 'si' },
          { tipo: 'EXTRAORDINARIA',        fechaConv: '2024-02-10', fechaReal: '2024-02-20', antelacion: '2024-02-10', cumple: 'si' }
        ],
        f1_obs_asamblea:                  'Asamblea realizada conforme a los estatutos vigentes. Quórum verificado por Revisor Fiscal.',
        f1_tipo_convocante:               'PRESIDENTE',
        f1_convocante_vigente:            'si',
        f1_no_res_convocante:             'Res. 0210-2020',
        f1_no_acta_designa_presidente:    'Acta 01-2024',
        f1_no_res_comite_provisional:     '',
        f1_vigencia_comite_provisional:   '',
        f1_comite_designado_por_oa:       'no_aplica',
        f1_ente_deportivo:                'Indeportes Bolívar',
        f1_num_afiliados:                 '47',
        f1_num_asistentes:                '38',
        f1_cumplio_quorum:                'si',
        f1_adjunta_cert_rf_fecha:         'si',
        f1_archivo_cert_rf_fecha:         { name: 'cert-rf-fecha-asamblea.pdf', size: '245 KB' },
        f1_adjunta_cert_rf_actual:        'si',
        f1_archivo_cert_rf_actual:        { name: 'cert-rf-actual.pdf', size: '198 KB' },
        f1_obs_asistencia:                'Quórum del 80,8% de los afiliados activos.'
      };
      base.estructura = {
        f1_fundadores: [
          { nombre: 'Club Atlético Cartagena',  no_res_reconocimiento: 'Res. 0112-2015' },
          { nombre: 'Club Deportivo Mompox',    no_res_reconocimiento: 'Res. 0078-2017' },
          { nombre: 'Club Atletismo Magangué',  no_res_reconocimiento: 'Res. 0145-2019' }
        ],
        f1_miembros_oa: [
          { nombre: 'Juan Carlos Hernández',  identificacion: '79.123.456',  cargo: 'Presidente',  capacitacion: 'si', nombrado_por: 'Asamblea',         no_periodos: '1' },
          { nombre: 'María Elena Vargas',     identificacion: '52.234.567',  cargo: 'Vicepresidente', capacitacion: 'si', nombrado_por: 'Asamblea',     no_periodos: '1' },
          { nombre: 'Pedro Antonio Gómez',    identificacion: '80.345.678',  cargo: 'Secretario',  capacitacion: 'si', nombrado_por: 'Asamblea',         no_periodos: '2' },
          { nombre: 'Ana Lucía Rodríguez',    identificacion: '41.456.789',  cargo: 'Tesorero',    capacitacion: 'si', nombrado_por: 'Asamblea',         no_periodos: '1' },
          { nombre: 'Carlos Mario Pérez',     identificacion: '79.567.890',  cargo: 'Vocal',       capacitacion: 'no', nombrado_por: 'Asamblea',         no_periodos: '1' }
        ],
        f1_presidente_antecedentes: 'no',
        f1_persona_discapacidad:    'Pedro Antonio Gómez (discapacidad visual parcial)',
        f1_revisor_fiscal: [
          { display: 'Revisor Fiscal Principal', nombre: 'Luis Fernando Castro',   identificacion: '79.678.901' },
          { display: 'Revisor Fiscal Suplente',  nombre: 'Patricia Eugenia Mejía', identificacion: '52.789.012' }
        ],
        f1_comision_disciplinaria: [
          { display: 'Miembro 1', nombre: 'Jorge Iván Restrepo' },
          { display: 'Miembro 2', nombre: 'Sandra Milena Ortiz' },
          { display: 'Miembro 3', nombre: 'Ricardo Andrés Toro' }
        ],
        f1_comision_tecnica: [
          { display: 'Miembro 1', nombre: 'Diego Alejandro Rojas' },
          { display: 'Miembro 2', nombre: 'Mónica Patricia Salazar' }
        ],
        f1_comision_juzgamiento: [
          { display: 'Miembro 1', nombre: 'Felipe Antonio Cárdenas' },
          { display: 'Miembro 2', nombre: 'Laura Cristina Mejía' }
        ],
        f1_aplica_paradeporte: 'si',
        f1_comision_paradeporte: [
          { display: 'Miembro 1', nombre: 'Roberto Carlos Pinilla' },
          { display: 'Miembro 2', nombre: 'Diana Marcela Ríos' }
        ],
        f1_paradeporte_fecha_asamblea: '2024-04-05'
      };
      base.cierre = {
        f1_adjunta_cert_conjunta:  'si',
        f1_archivo_cert_conjunta:  { name: 'cert-conjunta-estructura.pdf', size: '312 KB' },
        no_radicado_doc:           'RAD-2026-05-' + nit.slice(-4),
        observaciones:             'Documentación completa. Pendiente revisión de plazo de notificación.',
        archivos_adjuntos:         { name: 'expediente-completo.zip', size: '4.2 MB' }
      };
    }
    if (tipoOrg === 'asociacion') {
      base.f2 = {
        sub_tipo:                       'JUVENIL',
        no_personeria:                  'Res. 0512-2019 (15/06/2019)',
        radicado_personeria:            'RAD-2019-06-0512',
        fecha_estatutos:                '2022-08-22',
        radicado_estatutos:             'RAD-2022-08-0712',
        no_acta_sede:                   'Acta 12-2023',
        radicado_acta_sede:             'RAD-2023-09-0112',
        no_acta_constitucion:           'Acta 02-2023',
        radicado_acta_constitucion:     'RAD-2023-02-0078',
        no_inscripcion_miembros:        'Res. 0089-2024',
        radicado_inscripcion_miembros:  'RAD-2024-02-0089',
        tiene_inventario:               'si',
        archivo_inventario:             { name: 'inventario-bienes.pdf', size: '189 KB' },
        tiene_afiliacion:               'no',
        archivo_afiliacion:             null
      };
      base.estructura = {
        f2_seccionales: [
          { nombre_seccional: 'Seccional Cali',      nombre_directivo: 'Andrés Felipe Quintero' },
          { nombre_seccional: 'Seccional Palmira',   nombre_directivo: 'Beatriz Elena Mosquera' },
          { nombre_seccional: 'Seccional Buga',      nombre_directivo: 'Carlos Eduardo Tobón' }
        ]
      };
      base.cierre = {
        no_radicado_doc:    'RAD-2026-05-ASO-' + nit.slice(-4),
        observaciones:      'Documentación de seccionales completa. Falta validar inventario actualizado 2026.',
        archivos_adjuntos:  { name: 'expediente-asociacion.zip', size: '2.8 MB' }
      };
    }
    if (tipoOrg === 'federacion') {
      base.municipio = 'Bogotá D.C.';
      base.f3 = {
        no_res_personeria:                'Res. 0042-1982',
        radicado_personeria:              'RAD-1982-01-0042',
        f3_periodo_estatutario_inicial:   '2020-2024',
        f3_no_res_minimos:                'Res. 0312-2024',
        f3_n_minimos:                     '32'
      };
      base.asamblea = {
        f3_tipo_convocatoria:    'COMITE_PROVISIONAL',
        f3_fecha_convocatoria:   '2024-02-15',
        f3_fecha_realizacion:    '2024-03-15',
        f3_num_afiliados:        '32',
        f3_num_asistentes:       '28',
        f3_cumplio_quorum:       'si',
        f3_adjunta_cert_rf:      'si',
        f3_archivo_cert:         { name: 'cert-rf-federacion.pdf', size: '276 KB' }
      };
      base.estructura = {
        f3_afiliados: [
          { nombre: 'Liga de Atletismo de Antioquia', no_res_reconocimiento: 'Res. 0023-2018' },
          { nombre: 'Liga de Atletismo de Bolívar',   no_res_reconocimiento: 'Res. 0078-2019' },
          { nombre: 'Liga de Atletismo del Valle',    no_res_reconocimiento: 'Res. 0145-2017' },
          { nombre: 'Liga de Atletismo de Caldas',    no_res_reconocimiento: 'Res. 0210-2020' }
        ],
        f3_miembros_oa: [
          { nombre: 'Dr. Ramón Eduardo Velásquez', cargo: 'Presidente',     identificacion: '19.876.543', tiene_capacitacion: 'si', nombrado_por: 'Asamblea', acepta_cargo: 'si' },
          { nombre: 'Dra. Marcela Andrea Robles',  cargo: 'Vicepresidenta', identificacion: '52.987.654', tiene_capacitacion: 'si', nombrado_por: 'Asamblea', acepta_cargo: 'si' },
          { nombre: 'Ing. Hernán Darío Cardona',   cargo: 'Secretario',     identificacion: '70.123.456', tiene_capacitacion: 'si', nombrado_por: 'Asamblea', acepta_cargo: 'si' },
          { nombre: 'Cra. Liliana Marcela Posada', cargo: 'Tesorera',       identificacion: '43.234.567', tiene_capacitacion: 'si', nombrado_por: 'Asamblea', acepta_cargo: 'si' }
        ],
        f3_persona_discapacidad:          'Dr. Ramón Eduardo Velásquez (movilidad reducida)',
        f3_fecha_reunion_electiva_oa:     '2024-03-15',
        f3_fecha_reunion_asignacion:      '2024-03-22',
        f3_acredita_cert_residencia_oa:   'si',
        f3_nombres_cert_residencia_oa:    'Velásquez, Robles, Cardona, Posada',
        f3_archivo_cert_residencia_oa:    { name: 'cert-residencia-oa.pdf', size: '156 KB' },
        f3_revisor_fiscal: [
          { display: 'Revisor Fiscal Principal', nombre: 'CP. Alejandro Rivera',   identificacion: '79.345.678', no_tarjeta_profesional: '152.345-T', acepta_cargo: 'si', antecedentes_disciplinarios: 'no', firma_revisoria: 'si' },
          { display: 'Revisor Fiscal Suplente',  nombre: 'CP. Mónica Patricia Ríos', identificacion: '52.456.789', no_tarjeta_profesional: '167.890-T', acepta_cargo: 'si', antecedentes_disciplinarios: 'no', firma_revisoria: 'si' }
        ],
        f3_acredita_cert_residencia_oc:   'si',
        f3_nombres_cert_residencia_oc:    'Rivera, Ríos',
        f3_archivo_cert_residencia_oc:    { name: 'cert-residencia-oc.pdf', size: '134 KB' },
        f3_comision_disciplinaria: [
          { display: 'Miembro 1', nombre: 'Dr. Iván Mauricio Vargas',  identificacion: '79.456.789', acepta: 'si' },
          { display: 'Miembro 2', nombre: 'Dra. Adriana Lucía Soto',   identificacion: '52.567.890', acepta: 'si' },
          { display: 'Miembro 3', nombre: 'Dr. Javier Andrés Mendoza', identificacion: '80.678.901', acepta: 'si' }
        ],
        f3_fecha_reunion_oa_cd:           '2024-03-28'
      };
      base.cierre = {
        f3_adjunta_cert_coc:                 'si',
        f3_archivo_cert_coc:                 { name: 'cert-coc.pdf', size: '298 KB' },
        f3_adjunta_aval_paralimpico:         'si',
        f3_archivo_aval_paralimpico:         { name: 'aval-cpc.pdf', size: '187 KB' },
        f3_adjunta_cert_conjunta_no_inv:     'si',
        f3_archivo_cert_conjunta_no_inv:     { name: 'cert-no-investigacion.pdf', size: '245 KB' },
        no_radicado_doc:                     'RAD-2026-05-FED-' + nit.slice(-4),
        observaciones:                       'Documentación completa según matriz oficial F3. Trámite priorizado por COC.',
        archivos_adjuntos:                   { name: 'expediente-federacion.zip', size: '6.4 MB' }
      };
    }
    return base;
  }

  /* v1.12.0: estados "post-veredicto" — los seeds con estos estados generan
     historico extendido para simular el journey end-to-end (asignación →
     validación → veredicto → acto → firma → notificación → renuncia/recursos). */
  var ESTADOS_POST_VEREDICTO = {
    'PendienteCOO':     1,
    'PendienteFirma':   2,
    'Firmado':          3,
    'NotifElectronica': 4,
    'NotifOficinas':    4,
    'EnApelacion':      5,
    'EnReposicion':     5,
    'Vigente':          5
  };

  function mkSeed(id, tipoOrg, tipoTramite, organismo, nit, fechaIso, plazoDias, estado, profId) {
    var prof = profId && PROFESIONALES.find(function(p){ return p.id === profId; });
    var hist = [
      { fecha: fechaIso, hora: '08:15', actor: organismo + ' (demo)', accion: 'Radicado' },
      { fecha: fechaIso, hora: '08:15', actor: 'Sistema', accion: 'Remisión automática a Deporte Aficionado' }
    ];

    var nivelPost = ESTADOS_POST_VEREDICTO[estado] || 0;
    var asignado = estado === 'Asignada' || estado === 'En validación' || nivelPost > 0;
    var enValidacion = estado === 'En validación' || nivelPost > 0;

    if (asignado) {
      hist.push({ fecha: fechaIso, hora: '10:32', actor: 'Carolina Méndez (Coordinador IVC)', accion: 'Asignada a ' + (prof ? prof.nombre : 'Profesional') });
    }
    if (enValidacion) {
      hist.push({ fecha: fechaIso, hora: '14:18', actor: prof ? prof.nombre + ' (Profesional)' : 'Profesional', accion: 'Inicio de validación' });
    }

    /* v1.12.0: historico extendido para estados post-veredicto (nivel >= 1). */
    if (nivelPost >= 1) {
      hist.push({
        fecha: fechaIso, hora: '16:05',
        actor: (prof ? prof.nombre : 'Profesional') + ' (Profesional)',
        accion: 'Estado: En validación → PendienteCOO · Acto administrativo generado y enviado al Coordinador IVC para revisión.',
        estado: 'PendienteCOO',
        observacion: 'Acto administrativo generado y enviado al Coordinador IVC para revisión.'
      });
    }
    if (nivelPost >= 2) {
      hist.push({
        fecha: fechaIso, hora: '17:20',
        actor: 'Carolina Méndez (Coordinador IVC)',
        accion: 'Estado: PendienteCOO → PendienteFirma · Acto v1 aprobado (COO). Enviado al Director del IVC para firma electrónica.',
        estado: 'PendienteFirma',
        observacion: 'Acto v1 aprobado (COO). Enviado al Director del IVC para firma electrónica.'
      });
    }
    if (nivelPost >= 3) {
      hist.push({
        fecha: fechaIso, hora: '18:10',
        actor: 'María Helena Ramos (Director IVC)',
        accion: 'Estado: PendienteFirma → Firmado · Acto administrativo firmado electrónicamente con firma preset del Director.',
        estado: 'Firmado',
        observacion: 'Acto administrativo firmado electrónicamente con firma preset del Director.'
      });
    }
    if (nivelPost >= 4) {
      /* Bifurca según el estado final deseado. */
      if (estado === 'NotifOficinas' || estado === 'EnApelacion' || estado === 'EnReposicion' || estado === 'Vigente') {
        /* Para EnApelacion/EnReposicion/Vigente con plazo > 5 → simulamos NotifElectronica.
           Para NotifOficinas → ese es el estado final aquí. */
        if (estado === 'NotifOficinas') {
          hist.push({
            fecha: fechaIso, hora: '18:30',
            actor: 'María Helena Ramos (Director IVC)',
            accion: 'Estado: Firmado → NotifOficinas · Alerta de notificación en oficinas (5 días hábiles) emitida al organismo.',
            estado: 'NotifOficinas',
            observacion: 'Alerta de notificación en oficinas (5 días hábiles) emitida al organismo.'
          });
        } else {
          hist.push({
            fecha: fechaIso, hora: '18:30',
            actor: 'María Helena Ramos (Director IVC)',
            accion: 'Estado: Firmado → NotifElectronica · Notificación electrónica enviada al organismo.',
            estado: 'NotifElectronica',
            observacion: 'Notificación electrónica enviada al organismo. Esperando respuesta sobre renuncia a términos.'
          });
        }
      } else {
        /* estado === NotifElectronica */
        hist.push({
          fecha: fechaIso, hora: '18:30',
          actor: 'María Helena Ramos (Director IVC)',
          accion: 'Estado: Firmado → NotifElectronica · Notificación electrónica enviada al organismo.',
          estado: 'NotifElectronica',
          observacion: 'Notificación electrónica enviada al organismo. Esperando respuesta sobre renuncia a términos.'
        });
      }
    }
    if (nivelPost >= 5) {
      var actorOrg = organismo + ' (Organismo externo)';
      if (estado === 'Vigente') {
        hist.push({
          fecha: fechaIso, hora: '19:00', actor: actorOrg,
          accion: 'Estado: NotifElectronica → Vigente · Organismo renunció a términos. Acto administrativo vigente desde el día siguiente (D+1).',
          estado: 'Vigente',
          observacion: 'Organismo renunció a términos. Acto administrativo vigente desde el día siguiente (D+1).'
        });
      }
      if (estado === 'EnApelacion') {
        hist.push({
          fecha: fechaIso, hora: '19:00', actor: actorOrg,
          accion: 'Estado: NotifElectronica → PendienteRecursos · Organismo NO renunció a términos.',
          estado: 'PendienteRecursos', observacion: 'NO renunció a términos. Términos legales corriendo.'
        });
        hist.push({
          fecha: fechaIso, hora: '19:05', actor: actorOrg,
          accion: 'Estado: PendienteRecursos → PendienteRecursoTipo · Organismo interpone recursos.',
          estado: 'PendienteRecursoTipo', observacion: 'Organismo interpone recursos.'
        });
        hist.push({
          fecha: fechaIso, hora: '19:10', actor: actorOrg,
          accion: 'Estado: PendienteRecursoTipo → EnApelacion · Recurso de Apelación interpuesto. Remitido al área jurídica.',
          estado: 'EnApelacion', observacion: 'Recurso de Apelación interpuesto. Remitido al área jurídica del Ministerio para revisión y fallo.'
        });
      }
      if (estado === 'EnReposicion') {
        hist.push({
          fecha: fechaIso, hora: '19:00', actor: actorOrg,
          accion: 'Estado: NotifElectronica → PendienteRecursos · Organismo NO renunció a términos.',
          estado: 'PendienteRecursos', observacion: 'NO renunció a términos.'
        });
        hist.push({
          fecha: fechaIso, hora: '19:05', actor: actorOrg,
          accion: 'Estado: PendienteRecursos → EnReposicion · Recurso de Reposición interpuesto. Se creó trámite hijo.',
          estado: 'EnReposicion', observacion: 'Recurso de Reposición interpuesto. Se creó trámite hijo con FK al original.'
        });
      }
    }

    return {
      id: id,
      organismo: organismo,
      nit: nit,
      tipoOrganismo: tipoOrg,
      tipoTramite: tipoTramite,
      area: 'aficionado',
      fechaRadicacion: fechaIso,
      plazoDias: plazoDias,
      estado: estado,
      profesionalId: profId || null,
      profesionalNombre: prof ? prof.nombre : null,
      historico: hist,
      documentos: {},
      datos: _mockDatos(tipoOrg, organismo, nit)
    };
  }

  /* SEED construido AFTER mkSeed está definido. Las 12 filas raw como tuplas.
     v1.12.0: seed extendido con trámites en TODOS los estados del flujo post-firma
     para que las bandejas de los nuevos roles (Director, ATU, GIT, Jurídica)
     tengan datos al primer load — el usuario puede probar cada caso sin tener
     que correr el flujo end-to-end desde cero. */
  var SEED_TRAMITES_RAW = [
    /* Estados iniciales — flujo asignación */
    ['IVC-2026-001', 'liga',       'Otorgamiento',  'Liga de Atletismo de Bolívar',        '800.245.678-3', '2026-05-21', 15, 'No asignada'],
    ['IVC-2026-002', 'liga',       'Renovación',    'Liga de Voleibol de Cundinamarca',    '800.456.789-1', '2026-05-20', 12, 'No asignada'],
    ['IVC-2026-003', 'asociacion', 'Otorgamiento',  'Asociación de Patinaje del Valle',    '901.234.567-2', '2026-05-19',  3, 'Asignada',      'cp-001'],
    ['IVC-2026-004', 'liga',       'Actualización', 'Liga de Natación del Atlántico',      '800.789.012-4', '2026-05-19', -2, 'No asignada'],
    ['IVC-2026-005', 'liga',       'Otorgamiento',  'Liga de Tenis de Mesa de Antioquia',  '811.345.678-9', '2026-05-18', 18, 'En validación','mg-002'],
    ['IVC-2026-006', 'liga',       'Renovación',    'Liga de Ciclismo de Boyacá',          '900.567.890-5', '2026-05-18',  5, 'Asignada',      'al-003'],
    ['IVC-2026-007', 'asociacion', 'Otorgamiento',  'Asociación de Taekwondo de Caldas',   '901.456.789-3', '2026-05-17', -5, 'No asignada'],
    ['IVC-2026-008', 'liga',       'Otorgamiento',  'Liga de Fútbol de Sala del Tolima',   '800.234.567-8', '2026-05-17', 20, 'En validación','lr-004'],
    ['IVC-2026-009', 'liga',       'Renovación',    'Liga de Karate del Quindío',          '900.123.456-7', '2026-05-15',  2, 'Asignada',      'cp-001'],
    ['IVC-2026-010', 'liga',       'Otorgamiento',  'Liga de Baloncesto de Risaralda',     '800.345.678-2', '2026-05-14', 10, 'No asignada'],
    ['IVC-2026-011', 'asociacion', 'Otorgamiento',  'Asociación de Esgrima del Meta',      '901.789.012-1', '2026-05-13',  4, 'En validación','mg-002'],
    ['IVC-2026-012', 'federacion', 'Renovación',    'Federación Colombiana de Atletismo',  '900.987.654-3', '2026-05-12', 25, 'No asignada'],
    /* v1.12.0: presets demo del flujo post-firma. Cada uno simula un caso
       distinto que el usuario puede probar end-to-end desde la bandeja del rol
       correspondiente. profId, fecha y plazo elegidos para que el contexto sea
       creíble (las fechas son anteriores al "ahora" mock). */
    ['IVC-2026-013', 'liga',       'Otorgamiento',  'Liga de Patinaje del Cauca',          '900.111.222-3', '2026-05-10', 25, 'PendienteCOO',     'cp-001'],
    ['IVC-2026-014', 'asociacion', 'Otorgamiento',  'Asociación de Squash del Huila',      '901.555.666-7', '2026-05-09', 24, 'Firmado',          'mg-002'],
    ['IVC-2026-015', 'liga',       'Renovación',    'Liga de Bádminton del Magdalena',     '800.777.888-1', '2026-05-08', 23, 'NotifElectronica','al-003'],
    ['IVC-2026-016', 'asociacion', 'Otorgamiento',  'Asociación de Tiro con Arco Nariño',  '901.888.999-2', '2026-05-07', 22, 'NotifOficinas',    'lr-004'],
    ['IVC-2026-017', 'liga',       'Renovación',    'Liga de Rugby de Bogotá',             '800.222.333-4', '2026-05-06',  3, 'NotifOficinas',    'cp-001'],
    ['IVC-2026-018', 'liga',       'Otorgamiento',  'Liga de Vóleibol Playa Córdoba',      '900.333.444-5', '2026-05-05', 20, 'EnApelacion',      'mg-002'],
    ['IVC-2026-019', 'asociacion', 'Otorgamiento',  'Asociación de Hockey San Andrés',     '901.666.777-8', '2026-05-04', 19, 'Vigente',          'al-003'],
    ['IVC-2026-020', 'liga',       'Renovación',    'Liga de Bolos del Chocó',             '800.444.555-6', '2026-05-03', 18, 'EnReposicion',     'lr-004'],
    /* v1.13.1 (Doug 27/05/2026): 3 trámites adicionales en PendienteCOO
       para que la página de "Aprobación de actos" del Coordinador no se
       sienta vacía. Distintos profesionales para mostrar variedad de
       autores en la cola COO. */
    ['IVC-2026-021', 'liga',       'Otorgamiento',  'Liga de Bádminton del Tolima',        '800.555.111-2', '2026-05-11', 22, 'PendienteCOO',     'mg-002'],
    ['IVC-2026-022', 'asociacion', 'Renovación',    'Asociación de Polo del Atlántico',    '901.222.333-4', '2026-05-12', 21, 'PendienteCOO',     'al-003'],
    ['IVC-2026-023', 'federacion', 'Otorgamiento',  'Federación Colombiana de Esgrima',    '900.444.555-7', '2026-05-13', 20, 'PendienteCOO',     'lr-004'],
    /* v1.13.26 (Doug 27/05/2026): 2 trámites NotifOficinas con plazo VENCIDO
       (plazoDias negativo) para que la bandeja GIT Comunicaciones tenga
       casos reales que mostrar. Estos representan organismos que NO
       asistieron a las oficinas dentro de los 5 días hábiles tras la
       alerta de notificación → CPACA Art 67-69 obliga a surtir notificación
       por aviso publicado. Fechas anteriores al "ahora" mock para que el
       contexto temporal sea coherente. */
    ['IVC-2026-024', 'liga',       'Otorgamiento',  'Liga de Tiro al Blanco del Cesar',     '800.666.999-1', '2026-04-25', -7,  'NotifOficinas', 'cp-001'],
    ['IVC-2026-025', 'asociacion', 'Renovación',    'Asociación de Pesca Deportiva Caquetá','901.444.111-3', '2026-04-20', -12, 'NotifOficinas', 'mg-002']
  ];

  function buildSeed() {
    return {
      seedVersion: SEED_VERSION,
      /* v1.13.26 (Doug 27/05/2026): bumpeado de 23→25 porque v1.13.26 agregó
         024/025 al seed (NotifOficinas vencidos para GIT). Mantener este
         contador sincronizado evita colisión de IDs cuando crearReposicion
         intenta el siguiente disponible. */
      ultimoRadicado: 25,
      mode: 'demo',
      profesionales: JSON.parse(JSON.stringify(PROFESIONALES)),
      /* v1.13.33: nuevo state.personas[] — equipo IVC completo gestionado
         por el Coordinador desde /coordinador/equipo.html. */
      personas: JSON.parse(JSON.stringify(PERSONAS)),
      tramites: SEED_TRAMITES_RAW.map(function (row) { return mkSeed.apply(null, row); })
    };
  }

  /* ─── Persistencia ─────────────────────────────────────────────────── */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      /* Si la versión del seed cambió, hacer reset */
      if (parsed.seedVersion !== SEED_VERSION) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.error('[IVCStore] write failed:', e); }
  }

  /* ─── Event emitter simple ─────────────────────────────────────────── */
  var listeners = {};
  function emit(event, payload) {
    (listeners[event] || []).forEach(function (cb) {
      try { cb(payload); } catch (e) { console.error('[IVCStore] listener error:', e); }
    });
  }

  /* Cross-tab: storage event dispara cuando otra tab modifica localStorage */
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function (e) {
      if (e.key === KEY) emit('store:changed-external', null);
    });
  }

  /* ─── API pública ──────────────────────────────────────────────────── */
  var IVCStore = {
    init: function () {
      var s = read();
      if (!s) {
        s = buildSeed();                         /* deep clone construido */
        write(s);
      }
      if (!s.mode) { s.mode = 'demo'; write(s); }  /* migration */
      return s;
    },

    /* v1.5.1: 2 modos de demo (patrón Project v2.0.3)
       'demo'  — 12 trámites mock seed + 4 profesionales
       'blank' — sin trámites (vacío para que el usuario cree desde formulario) */
    getMode: function () { return this.init().mode || 'demo'; },

    setMode: function (mode) {
      if (mode !== 'demo' && mode !== 'blank') return;
      var s;
      if (mode === 'blank') {
        s = {
          seedVersion: SEED_VERSION,
          ultimoRadicado: 0,
          profesionales: JSON.parse(JSON.stringify(PROFESIONALES)),  /* profesionales sí, los necesita el Coordinador */
          tramites: [],
          mode: 'blank'
        };
      } else {
        s = buildSeed();
      }
      write(s);
      emit('store:mode-changed', mode);
      emit('store:reset', null);
      return s;
    },

    reset: function () {
      var currentMode = this.getMode();
      return this.setMode(currentMode);   /* reset preserva el modo actual */
    },

    getProfesionales: function (area) {
      var s = this.init();
      return area
        ? s.profesionales.filter(function (p) { return p.area === area; })
        : s.profesionales.slice();
    },

    /* v1.13.33 (Doug 27/05/2026): API para gestión del equipo IVC desde
       /coordinador/equipo.html. PERSONAS centraliza profesionales,
       director, coord, ATU, GIT, jurídica con estado de invitación. */
    getPersonas: function (filtros) {
      var s = this.init();
      var ps = (s.personas || []).slice();
      if (!filtros) return ps;
      if (filtros.rol)    ps = ps.filter(function (p) { return p.rol === filtros.rol; });
      if (filtros.area)   ps = ps.filter(function (p) { return p.area === filtros.area; });
      if (filtros.estado) ps = ps.filter(function (p) { return p.estado === filtros.estado; });
      if (filtros.q) {
        var q = String(filtros.q).toLowerCase();
        ps = ps.filter(function (p) {
          return (p.nombre || '').toLowerCase().indexOf(q) >= 0 ||
                 (p.email  || '').toLowerCase().indexOf(q) >= 0;
        });
      }
      return ps;
    },

    getPersona: function (id) {
      var s = this.init();
      return (s.personas || []).find(function (p) { return p.id === id; }) || null;
    },

    /* Carga actual = # trámites activos asignados al profesional. Solo
       aplica a rol=profesional; otros roles devuelven 0. Estados que
       cuentan como "activo": Asignada / En validación / Cumple / Parcial /
       NoCumple / PendienteCOO (todavía en ciclo de revisión).
       Estados que NO cuentan: PendienteFirma, Firmado, NotifElectronica,
       NotifOficinas, Vigente, EnApelacion, EnReposicion (fuera del
       backlog del profesional). */
    getCargaPersona: function (personaId) {
      var s = this.init();
      var ESTADOS_ACTIVOS = ['Asignada', 'En validación', 'Cumple', 'Parcial', 'NoCumple', 'PendienteCOO'];
      return s.tramites.filter(function (t) {
        return t.profesionalId === personaId && ESTADOS_ACTIVOS.indexOf(t.estado) >= 0;
      }).length;
    },

    /* Crear/invitar persona. Genera ID auto, estado='pendiente'. */
    invitarPersona: function (data) {
      if (!data || !data.nombre || !data.email || !data.rol) return null;
      var s = this.init();
      var prefix = ({ profesional: 'pf', director: 'dir', coordinador: 'co', atu: 'atu', git: 'git', juridica: 'jur' })[data.rol] || 'p';
      /* Genera ID único basado en personas existentes con el mismo prefijo. */
      var n = ((s.personas || []).filter(function (p) { return p.id.indexOf(prefix + '-') === 0; }).length + 1);
      var id = prefix + '-' + String(n).padStart(3, '0');
      var hoy = new Date().toISOString().slice(0, 10);
      var nueva = {
        id: id,
        nombre: data.nombre,
        email: data.email,
        cedula: data.cedula || '',
        rol: data.rol,
        area: data.area || null,
        estado: 'pendiente',
        fechaInvitacion: hoy,
        fechaActivacion: null,
        mensajeInvitacion: data.mensaje || ''
      };
      s.personas = s.personas || [];
      s.personas.push(nueva);
      write(s);
      emit('persona:invitada', nueva);
      return nueva;
    },

    /* Simular aceptación de invitación (modo demo) → estado='activo'. */
    aceptarInvitacion: function (personaId) {
      var s = this.init();
      var p = (s.personas || []).find(function (x) { return x.id === personaId; });
      if (!p) return null;
      if (p.estado !== 'pendiente') return p;
      p.estado = 'activo';
      p.fechaActivacion = new Date().toISOString().slice(0, 10);
      /* Si es un profesional, también lo agregamos a s.profesionales para
         back-compat con el código existente que consume getProfesionales(). */
      if (p.rol === 'profesional') {
        s.profesionales = s.profesionales || [];
        if (!s.profesionales.find(function (x) { return x.id === p.id; })) {
          s.profesionales.push({ id: p.id, nombre: p.nombre, area: p.area, activos: 0 });
        }
      }
      write(s);
      emit('persona:aceptada', p);
      return p;
    },

    desactivarPersona: function (personaId) {
      var s = this.init();
      var p = (s.personas || []).find(function (x) { return x.id === personaId; });
      if (!p) return null;
      p.estado = 'inactivo';
      write(s);
      emit('persona:desactivada', p);
      return p;
    },

    /* v1.13.42 (Doug): editar campos de una persona ya invitada. Solo
       actualiza fields permitidos (nombre, email, cedula, rol, area).
       NO cambia estado ni fechaInvitacion. Sincroniza profesionales[]
       cuando aplica para back-compat. */
    editarPersona: function (personaId, updates) {
      if (!updates) return null;
      var s = this.init();
      var p = (s.personas || []).find(function (x) { return x.id === personaId; });
      if (!p) return null;
      var ALLOWED = ['nombre', 'email', 'cedula', 'rol', 'area'];
      ALLOWED.forEach(function (key) {
        if (key in updates) p[key] = updates[key];
      });
      /* Si la persona es profesional activo, sincronizar la entrada
         en s.profesionales[] (back-compat con código legacy). */
      if (p.rol === 'profesional' && p.estado === 'activo') {
        var pro = (s.profesionales || []).find(function (x) { return x.id === p.id; });
        if (pro) {
          pro.nombre = p.nombre;
          pro.area   = p.area;
        }
      }
      write(s);
      emit('persona:editada', p);
      return p;
    },

    /* Reactivar una persona inactiva sin volver a invitar. */
    reactivarPersona: function (personaId) {
      var s = this.init();
      var p = (s.personas || []).find(function (x) { return x.id === personaId; });
      if (!p) return null;
      p.estado = 'activo';
      write(s);
      emit('persona:reactivada', p);
      return p;
    },

    getTramites: function (filtros) {
      var s = this.init();
      var ts = s.tramites.slice();
      if (!filtros) return ts;
      if (filtros.area)          ts = ts.filter(function (t) { return t.area === filtros.area; });
      if (filtros.estado)        ts = ts.filter(function (t) { return t.estado === filtros.estado; });
      if (filtros.profesionalId) ts = ts.filter(function (t) { return t.profesionalId === filtros.profesionalId; });
      return ts;
    },

    getTramite: function (id) {
      var s = this.init();
      return s.tramites.find(function (t) { return t.id === id; }) || null;
    },

    misAsignaciones: function (profesionalId) {
      return this.getTramites({ profesionalId: profesionalId });
    },

    crearTramite: function (formData) {
      var s = this.init();
      s.ultimoRadicado = (s.ultimoRadicado || 0) + 1;
      var pad = String(s.ultimoRadicado).padStart(3, '0');
      var id = 'IVC-' + new Date().getFullYear() + '-' + pad;
      var now = new Date();
      var iso = now.toISOString().slice(0, 10);
      var hora = now.toTimeString().slice(0, 5);
      var nuevo = {
        id: id,
        organismo: formData.organismo || '—',
        nit: formData.nit || '—',
        tipoOrganismo: formData.tipoOrganismo || 'liga',
        tipoTramite: formData.tipoTramite || 'Otorgamiento',
        area: formData.area || 'aficionado',
        fechaRadicacion: iso,
        plazoDias: 15,
        estado: 'No asignada',
        profesionalId: null,
        profesionalNombre: null,
        historico: [
          { fecha: iso, hora: hora, actor: formData.organismo || 'Usuario externo', accion: 'Radicado' },
          { fecha: iso, hora: hora, actor: 'Sistema', accion: 'Remisión automática a Deporte ' + (formData.area === 'profesional' ? 'Profesional' : 'Aficionado') }
        ],
        documentos: formData.documentos || {},
        datos: formData.datos || {}
      };
      s.tramites.unshift(nuevo);
      write(s);
      emit('tramite:creado', nuevo);
      return nuevo;
    },

    asignar: function (tramiteId, profesionalId, actor) {
      var s = this.init();
      var t = s.tramites.find(function (x) { return x.id === tramiteId; });
      if (!t) return null;
      var prof = s.profesionales.find(function (p) { return p.id === profesionalId; });
      if (!prof) return null;
      var now = new Date();
      t.profesionalId = profesionalId;
      t.profesionalNombre = prof.nombre;
      t.estado = 'Asignada';
      t.historico.push({
        fecha: now.toISOString().slice(0, 10),
        hora: now.toTimeString().slice(0, 5),
        actor: actor || 'Coordinador',
        accion: 'Asignada a ' + prof.nombre
      });
      write(s);
      emit('tramite:asignado', t);
      return t;
    },

    /* v1.12.0: ATU/GIT marca al organismo como notificado en oficinas.
       Estado pasa de NotifOficinas → NotifElectronica (mismo semantic: org
       ya recibió la notificación, pendiente respuesta de renuncia). El canal
       (plantilla/aviso) queda registrado en el historico para trazabilidad. */
    marcarNotificadoOficinas: function (tramiteId, canal, actor) {
      var s = this.init();
      var t = s.tramites.find(function (x) { return x.id === tramiteId; });
      if (!t) return null;
      if (t.estado !== 'NotifOficinas') return null;
      var detalle = canal === 'plantilla'
        ? 'Organismo notificado por plantilla (Atención al Usuario · dentro de 5 días hábiles).'
        : 'Organismo notificado por aviso (GIT Comunicaciones · CPACA Art 67-69 · vencido 5 días).';
      return this.actualizarEstado(t.id, 'NotifElectronica', actor || 'Sistema', detalle);
    },

    /* v1.12.0: Jurídica resuelve un recurso de apelación.
       Resolución 'favorable' → Vigente (organismo gana, acto queda vigente).
       Resolución 'desfavorable' → NoCumple (acto se mantiene rechazado por Jurídica). */
    resolverApelacion: function (tramiteId, resolucion, actor, observacion) {
      var s = this.init();
      var t = s.tramites.find(function (x) { return x.id === tramiteId; });
      if (!t) return null;
      if (t.estado !== 'EnApelacion') return null;
      if (resolucion !== 'favorable' && resolucion !== 'desfavorable') return null;
      var newEstado = resolucion === 'favorable' ? 'Vigente' : 'NoCumple';
      var detalle = (observacion ? observacion + ' · ' : '') +
        (resolucion === 'favorable'
          ? 'Apelación FALLA A FAVOR del organismo. Acto administrativo queda vigente.'
          : 'Apelación NO PROSPERA. Trámite queda cerrado en firme.');
      return this.actualizarEstado(t.id, newEstado, actor || 'Jurídica', detalle);
    },

    /* v1.11.4: crear trámite por REPOSICIÓN — clona los datos básicos del
       trámite padre (organismo, NIT, tipoOrganismo, datos diligenciados,
       documentos) y crea un trámite nuevo con tipoTramite='Reposición' y
       tramite_parent apuntando al original. El nuevo trámite arranca en
       'No asignada' (vuelve al ciclo de remisión automática del Coordinador).
       El padre debe ser marcado con estado 'EnReposicion' por el caller. */
    crearReposicion: function (parentId, actor) {
      var s = this.init();
      var padre = s.tramites.find(function (x) { return x.id === parentId; });
      if (!padre) return null;

      s.ultimoRadicado = (s.ultimoRadicado || 0) + 1;
      var pad = String(s.ultimoRadicado).padStart(3, '0');
      var id = 'IVC-' + new Date().getFullYear() + '-' + pad;
      var now = new Date();
      var iso = now.toISOString().slice(0, 10);
      var hora = now.toTimeString().slice(0, 5);

      var nuevo = {
        id: id,
        organismo: padre.organismo,
        nit: padre.nit,
        tipoOrganismo: padre.tipoOrganismo,
        tipoTramite: 'Reposición',
        area: padre.area || 'aficionado',
        fechaRadicacion: iso,
        plazoDias: 15,
        estado: 'No asignada',
        profesionalId: null,
        profesionalNombre: null,
        /* v1.11.4: FK al trámite original. La página pública / bandejas pueden
           seguir el link para mostrar el historial completo (parent + child). */
        tramite_parent: parentId,
        historico: [
          { fecha: iso, hora: hora, actor: actor || padre.organismo,
            accion: 'Reposición radicada · trámite hijo del ' + parentId,
            estado: 'No asignada' },
          { fecha: iso, hora: hora, actor: 'Sistema',
            accion: 'Remisión automática a Deporte ' + (padre.area === 'profesional' ? 'Profesional' : 'Aficionado'),
            estado: 'No asignada' }
        ],
        /* Clonar datos diligenciados + documentos para que el Profesional
           tenga el contexto completo al revalidar. */
        documentos: padre.documentos ? JSON.parse(JSON.stringify(padre.documentos)) : {},
        datos: padre.datos ? JSON.parse(JSON.stringify(padre.datos)) : {}
      };
      s.tramites.unshift(nuevo);
      write(s);
      emit('tramite:creado', nuevo);
      return nuevo;
    },

    actualizarEstado: function (tramiteId, estado, actor, observacion) {
      var s = this.init();
      var t = s.tramites.find(function (x) { return x.id === tramiteId; });
      if (!t) return null;
      var now = new Date();
      var prev = t.estado;
      t.estado = estado;
      /* v1.9.1: además del campo `accion` (string concatenado), guardar
         `estado` y `observacion` separados para que el consumidor pueda
         extraer las causales del veredicto sin parsear strings. */
      t.historico.push({
        fecha: now.toISOString().slice(0, 10),
        hora: now.toTimeString().slice(0, 5),
        actor: actor || 'Sistema',
        accion: 'Estado: ' + prev + ' → ' + estado + (observacion ? ' · ' + observacion : ''),
        estado: estado,
        observacion: observacion || ''
      });
      write(s);
      emit('tramite:estado-cambiado', t);
      return t;
    },

    /* v1.13.13 (Doug 27/05/2026): persiste el array de docs validados al
       trámite. Usado por el workspace del Profesional cuando emite veredicto
       (Cumple/Parcial/NoCumple) para que la página pública pueda leer qué
       docs fueron marcados como obs/no y listarlos uno por uno en el modal
       de subsanación. */
    setDocumentos: function (tramiteId, docs) {
      var s = this.init();
      var t = s.tramites.find(function (x) { return x.id === tramiteId; });
      if (!t) return null;
      t.documentos = Array.isArray(docs) ? docs.slice() : [];
      write(s);
      return t;
    },

    on: function (event, cb) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return function off() {
        listeners[event] = (listeners[event] || []).filter(function (c) { return c !== cb; });
      };
    },

    /* Debug helper para consola */
    _dump: function () { return this.init(); }
  };

  root.IVCStore = IVCStore;
})(typeof window !== 'undefined' ? window : globalThis);
