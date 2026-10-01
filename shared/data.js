/* ═══════════════════════════════════════════════════════════════════
   data.js — Mock state + localStorage helpers para el prototipo IVC.
   No usa módulos ES — se incluye con <script src="">.

   Expone: window.IVCData
   Persistencia: localStorage con prefix 'naowee.ivc.'
   Eventos: dispatches 'naowee:ivc:state-change' al mutar.
  ═══════════════════════════════════════════════════════════════════ */

(function (window) {
  'use strict';

  /* ───── Storage keys ───── */
  var K_PERFIL    = 'naowee.ivc.perfil';
  var K_TRAMITE   = 'naowee.ivc.tramite';
  var K_TOUR_CLOSED = 'naowee.ivc.tourClosed';
  var K_SIDEBAR_COLLAPSED = 'naowee.ivc.sidebarCollapsed';
  var K_WIZARD_STEP = 'naowee.ivc.wizardStep'; /* v1.1.4 #4 — tour reactivo */
  var K_TRAMITE_FOCAL = 'naowee.ivc.tramiteFocal'; /* v1.2.0 — workspace del Profesional */

  /* ───── Perfiles disponibles ─────
     v1.5.3 (25/05/2026): perfil 'usuario-externo' removido del switcher.
     Doug: el flujo Fase 1 arranca desde una pantalla pública (sin login).
     No tiene sentido simular al ciudadano como "perfil" interno del Ministerio.
     El formulario sigue accesible; el switch sólo lista roles internos. */
  var PERFILES = {
    'coordinador': {
      id: 'coordinador',
      nombre: 'Carolina Méndez',
      cedula: '52.345.678',
      rol: 'Coordinadora · Deporte Aficionado',
      area: 'Deporte Aficionado',
      avatar: 'CM',
      etapa: 'Fase 2',
      enabled: true,
      color: '#7c3aed'
    },
    'profesional': {
      id: 'profesional',
      nombre: 'Carlos Pérez',
      cedula: '79.456.123',
      rol: 'Profesional · Deporte Aficionado',
      area: 'Deporte Aficionado',
      avatar: 'CP',
      etapa: 'Fase 2',
      enabled: true,
      color: '#1f78d1'
    },
    'director': {
      id: 'director',
      nombre: 'María Helena Ramos',
      cedula: '41.567.890',
      rol: 'Director · Deporte Aficionado',
      area: 'Deporte Aficionado',
      avatar: 'MR',
      etapa: 'Fase 5',
      /* v1.11.1: habilitado para el role switcher tras entregar /director/. */
      enabled: true,
      color: '#d74009'
    },
    /* v1.12.0: 3 nuevos roles complementarios del flujo V4.
       Lane "Roles compl." en el diagrama IVC-FLUJO-V4. */
    'atu': {
      id: 'atu',
      nombre: 'Sofía Quintero',
      cedula: '52.123.456',
      rol: 'Atención al Usuario · plantilla 5d',
      area: 'Atención al Usuario',
      avatar: 'SQ',
      etapa: 'Fase 5.5',
      enabled: true,
      color: '#1f78d1'
    },
    'git': {
      id: 'git',
      nombre: 'Diego Sandoval',
      cedula: '79.987.654',
      rol: 'GIT Comunicaciones · aviso +5d',
      area: 'GIT Comunicaciones',
      avatar: 'DS',
      etapa: 'Fase 5.5',
      enabled: true,
      color: '#7c3aed'
    },
    'juridica': {
      id: 'juridica',
      nombre: 'Laura Restrepo',
      cedula: '41.234.567',
      rol: 'Jurídica · apelación',
      area: 'Jurídica',
      avatar: 'LR',
      etapa: 'Fase 6',
      enabled: true,
      color: '#7c3aed'
    }
  };

  /* ───── Trámite mock (estructura progresiva) ───── */
  var TRAMITE_TEMPLATE = {
    id: 'IVC-2026-001',
    tipo: 'Otorgamiento de Reconocimiento Deportivo',
    tipologia: 'tramite',
    organismo: 'Liga de Atletismo de Bolívar',
    nit: '800.245.678-3',
    disciplina: 'Atletismo',
    domicilio: 'Cartagena de Indias, Bolívar',
    fechaRadicacion: null,
    fechaLimite: null,
    estado: null, /* null → 'Borrador' → 'Radicado' → 'En Validación' → 'Subsanado' → ... */
    radicado: false,
    documentos: [],
    historicos: [
      {
        id: 'IVC-2021-088',
        tipo: 'Otorgamiento Reconocimiento Deportivo',
        fecha: '2021-08-14',
        estado: 'Finalizado',
        vigencia: 'Vigente hasta 2025-08-14'
      },
      {
        id: 'IVC-2024-204',
        tipo: 'Renovación Reconocimiento Deportivo',
        fecha: '2024-11-22',
        estado: 'Finalizado',
        vigencia: 'Vigente hasta 2028-11-22'
      }
    ]
  };

  /* ───── Documentos del Decreto 1387/1970, Artículo 2.1.1.2 ───── */
  var DOCUMENTOS_DECRETO_1387 = [
    {
      id: 'acta-constitucion',
      orden: 1,
      titulo: 'Copia del Acta de Constitución',
      obligatorio: true,
      descripcion: 'Acta con la firma del Representante Legal donde consta la creación del organismo deportivo, sus fundadores y el quórum.',
      fundamento: 'Decreto 1387/1970, Art. 2.1.1.2 — núm. 1'
    },
    {
      id: 'lista-afiliados',
      orden: 2,
      titulo: 'Lista de afiliados con nóminas de Directivos',
      obligatorio: true,
      descripcion: 'Mínimo de Clubes Deportivos o Promotores requeridos por la Ley 181/1995. Incluye Órganos de Administración y Control.',
      fundamento: 'Ley 181/1995 + Decreto 1085/2015'
    },
    {
      id: 'estatutos',
      orden: 3,
      titulo: 'Copia de Estatutos y Reglamentos',
      obligatorio: true,
      descripcion: 'Estatutos sociales aprobados en Asamblea, con reglamentos disciplinario y técnico anexos.',
      fundamento: 'Decreto 1387/1970, Art. 2.1.1.2 — núm. 3'
    },
    {
      id: 'personeria',
      orden: 4,
      titulo: 'Documento de Personería Jurídica',
      obligatorio: true,
      descripcion: 'Certificado vigente de existencia y representación legal, emitido en los últimos 30 días.',
      fundamento: 'Decreto 1529/1990 Art. 2 + Decreto 525/1990'
    },
    {
      id: 'afiliacion-internacional',
      orden: 5,
      titulo: 'Constancia de afiliación internacional',
      obligatorio: false,
      descripcion: 'Solo aplica si la disciplina cuenta con federación internacional reconocida.',
      fundamento: 'Decreto 1387/1970, Art. 2.1.1.2 — núm. 5 (opcional)'
    },
    {
      id: 'inventario',
      orden: 6,
      titulo: 'Inventario de bienes',
      obligatorio: true,
      descripcion: 'Listado de bienes muebles e inmuebles del organismo deportivo a la fecha de constitución.',
      fundamento: 'Decreto 1387/1970, Art. 2.1.1.2 — núm. 6'
    },
    {
      id: 'sede',
      orden: 7,
      titulo: 'Acta de designación de sede',
      obligatorio: true,
      descripcion: 'Documento donde el Órgano de Administración designa la dirección física y de notificaciones.',
      fundamento: 'Decreto 1387/1970, Art. 2.1.1.2 — núm. 7'
    }
  ];

  /* ───── 12 pasos del flujo V2 (timeline) ───── */
  var FLUJO_TIMELINE = [
    { id: 1, titulo: 'Radicación',                rol: 'Usuario Externo',         estado: 'pending' },
    { id: 2, titulo: 'Remisión a GESDOC',         rol: 'Gestión Documental',      estado: 'pending' },
    { id: 3, titulo: 'Asignación de Profesional', rol: 'Coordinador IVC',         estado: 'pending' },
    { id: 4, titulo: 'Validación de requisitos',  rol: 'Profesional IVC',         estado: 'pending' },
    { id: 5, titulo: 'Generar acto administrativo', rol: 'Profesional IVC',       estado: 'pending' },
    { id: 6, titulo: 'Revisión de coordinación',  rol: 'Coordinador IVC',         estado: 'pending' },
    { id: 7, titulo: 'Decisión Aprobar/Rechazar', rol: 'Director',                estado: 'pending' },
    { id: 8, titulo: 'Firma electrónica',         rol: 'Director',                estado: 'pending' },
    { id: 9, titulo: 'Definición de notificación', rol: 'Gestión Documental',     estado: 'pending' },
    { id: 10, titulo: 'Envío de notificado',      rol: 'Sistema',                 estado: 'pending' },
    { id: 11, titulo: 'Renuncia a términos / Recursos', rol: 'Usuario Externo',   estado: 'pending' },
    { id: 12, titulo: 'Actualización del trámite (RND)', rol: 'Sistema',          estado: 'pending' }
  ];

  /* ───── Profesionales disponibles (HU-3 — para asignación) ───── */
  var PROFESIONALES_DISPONIBLES = [
    { id: 'cp-001', nombre: 'Carlos Pérez',     cedula: '79.456.123', activos: 12, color: '#1f78d1', avatar: 'CP' },
    { id: 'mg-002', nombre: 'María García',     cedula: '41.987.654', activos:  8, color: '#7c3aed', avatar: 'MG' },
    { id: 'al-003', nombre: 'Andrés López',     cedula: '80.123.456', activos: 15, color: '#d74009', avatar: 'AL' },
    { id: 'lr-004', nombre: 'Lucía Ramírez',    cedula: '52.789.012', activos:  5, color: '#1f8923', avatar: 'LR' }
  ];

  /* ───── Bandeja del Coordinador (HU-3) — 12 trámites mock ───── */
  var TRAMITES_BANDEJA = [
    { id: 'IVC-2026-001', tipo: 'Otorgamiento',  organismo: 'Liga de Atletismo de Bolívar',          nit: '800.245.678-3', fechaRadicacion: '2026-05-21', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-002', tipo: 'Renovación',    organismo: 'Liga de Voleibol de Cundinamarca',      nit: '800.456.789-1', fechaRadicacion: '2026-05-20', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-003', tipo: 'Otorgamiento',  organismo: 'Asociación de Patinaje del Valle',      nit: '901.234.567-2', fechaRadicacion: '2026-05-19', estado: 'Asignada',     profesionalId: 'cp-001', profesionalNombre: 'Carlos Pérez' },
    { id: 'IVC-2026-004', tipo: 'Actualización', organismo: 'Liga de Natación del Atlántico',        nit: '800.789.012-4', fechaRadicacion: '2026-05-19', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-005', tipo: 'Otorgamiento',  organismo: 'Liga de Tenis de Mesa de Antioquia',    nit: '811.345.678-9', fechaRadicacion: '2026-05-18', estado: 'En validación', profesionalId: 'mg-002', profesionalNombre: 'María García' },
    { id: 'IVC-2026-006', tipo: 'Renovación',    organismo: 'Liga de Ciclismo de Boyacá',            nit: '900.567.890-5', fechaRadicacion: '2026-05-18', estado: 'Asignada',     profesionalId: 'al-003', profesionalNombre: 'Andrés López' },
    { id: 'IVC-2026-007', tipo: 'Otorgamiento',  organismo: 'Asociación de Taekwondo de Caldas',     nit: '901.456.789-3', fechaRadicacion: '2026-05-17', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-008', tipo: 'Otorgamiento',  organismo: 'Liga de Fútbol de Sala del Tolima',     nit: '800.234.567-8', fechaRadicacion: '2026-05-17', estado: 'En validación', profesionalId: 'lr-004', profesionalNombre: 'Lucía Ramírez' },
    { id: 'IVC-2026-009', tipo: 'Actualización', organismo: 'Liga de Judo de Santander',             nit: '900.876.543-2', fechaRadicacion: '2026-05-16', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-010', tipo: 'Renovación',    organismo: 'Liga de Baloncesto del Magdalena',      nit: '800.345.678-6', fechaRadicacion: '2026-05-15', estado: 'Asignada',     profesionalId: 'cp-001', profesionalNombre: 'Carlos Pérez' },
    { id: 'IVC-2026-011', tipo: 'Otorgamiento',  organismo: 'Asociación de Boxeo del Cauca',         nit: '901.567.890-1', fechaRadicacion: '2026-05-15', estado: 'No asignada',  profesionalId: null,    profesionalNombre: '—' },
    { id: 'IVC-2026-012', tipo: 'Otorgamiento',  organismo: 'Liga de Karate del Quindío',            nit: '900.654.321-7', fechaRadicacion: '2026-05-14', estado: 'En validación', profesionalId: 'mg-002', profesionalNombre: 'María García' }
  ];

  /* ───── Trámite focal del Profesional (HU-4/HU-6) — IVC-2026-001 ───── */
  function getTramiteFocal() {
    return {
      id: 'IVC-2026-001',
      tipo: 'Otorgamiento de Reconocimiento Deportivo',
      organismo: 'Liga de Atletismo de Bolívar',
      nit: '800.245.678-3',
      disciplina: 'Atletismo',
      fechaRadicacion: '2026-05-21',
      fechaAsignacion: '2026-05-21 14:32',
      asignadoHace: '15 min',
      diasRestantes: 14,
      documentos: [
        { id: 'acta-constitucion',      orden: 1, titulo: 'Copia del Acta de Constitución',            obligatorio: true,  validacion: null, observacion: '' },
        { id: 'lista-afiliados',        orden: 2, titulo: 'Lista de afiliados con nóminas de Directivos', obligatorio: true, validacion: null, observacion: '' },
        { id: 'estatutos',              orden: 3, titulo: 'Copia de Estatutos y Reglamentos',          obligatorio: true,  validacion: null, observacion: '' },
        { id: 'personeria',             orden: 4, titulo: 'Documento de Personería Jurídica',          obligatorio: true,  validacion: null, observacion: '' },
        { id: 'afiliacion-internacional', orden: 5, titulo: 'Constancia de afiliación internacional',  obligatorio: false, validacion: null, observacion: '' },
        { id: 'inventario',             orden: 6, titulo: 'Inventario de bienes',                      obligatorio: true,  validacion: null, observacion: '' },
        { id: 'sede',                   orden: 7, titulo: 'Acta de designación de sede',               obligatorio: true,  validacion: null, observacion: '' }
      ]
    };
  }

  /* ───── Storage helpers ───── */
  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* quota excedido o privacidad — silencioso */ }
  }

  function remove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* noop */ }
  }

  function notifyChange(reason) {
    try {
      window.dispatchEvent(new CustomEvent('naowee:ivc:state-change', { detail: { reason: reason || 'unknown' } }));
    } catch (e) { /* IE — noop */ }
  }

  /* ───── Public API ───── */
  function getPerfil() {
    /* v1.5.3: default a 'coordinador' (primer perfil interno disponible)
       en lugar de null/usuario-externo que fue removido. */
    var p = read(K_PERFIL, null);
    if (!p || !PERFILES[p]) p = 'coordinador';
    return p;
  }

  function setPerfil(perfilId) {
    if (!PERFILES[perfilId]) return false;
    write(K_PERFIL, perfilId);
    notifyChange('perfil');
    return true;
  }

  function getPerfilData(perfilId) {
    return PERFILES[perfilId || getPerfil()] || null;
  }

  function getAllPerfiles() {
    return Object.keys(PERFILES).map(function (k) { return PERFILES[k]; });
  }

  function getTramite() {
    return read(K_TRAMITE, null);
  }

  function setTramite(tramite) {
    write(K_TRAMITE, tramite);
    notifyChange('tramite');
  }

  function updateTramite(partial) {
    var current = getTramite() || JSON.parse(JSON.stringify(TRAMITE_TEMPLATE));
    var updated = Object.assign({}, current, partial);
    write(K_TRAMITE, updated);
    notifyChange('tramite-update');
    return updated;
  }

  function resetTramite() {
    remove(K_TRAMITE);
    notifyChange('tramite-reset');
  }

  function initTramiteBorrador() {
    var t = JSON.parse(JSON.stringify(TRAMITE_TEMPLATE));
    t.estado = 'Borrador';
    write(K_TRAMITE, t);
    notifyChange('tramite-borrador');
    return t;
  }

  function radicarTramite() {
    var t = getTramite() || JSON.parse(JSON.stringify(TRAMITE_TEMPLATE));
    t.estado = 'Radicado';
    t.radicado = true;
    t.fechaRadicacion = '2026-05-21';
    t.fechaLimite = '2026-06-12'; /* +15 días hábiles */
    write(K_TRAMITE, t);
    notifyChange('radicar');
    return t;
  }

  function toggleDocumento(docId) {
    var t = getTramite() || initTramiteBorrador();
    var docs = t.documentos || [];
    var idx = docs.indexOf(docId);
    if (idx >= 0) docs.splice(idx, 1);
    else docs.push(docId);
    t.documentos = docs;
    write(K_TRAMITE, t);
    notifyChange('documento');
    return t;
  }

  function getTramiteEstado() {
    var t = getTramite();
    return t ? t.estado : null;
  }

  function getTimeline() {
    var t = getTramite();
    if (!t || !t.radicado) {
      return FLUJO_TIMELINE.map(function (p) { return Object.assign({}, p, { estado: 'pending' }); });
    }
    /* Step 1 complete, Step 2 in curso (Fase 1 sólo llega hasta ahí) */
    return FLUJO_TIMELINE.map(function (p) {
      if (p.id === 1) return Object.assign({}, p, { estado: 'complete', fecha: t.fechaRadicacion });
      if (p.id === 2) return Object.assign({}, p, { estado: 'current' });
      return Object.assign({}, p, { estado: 'pending' });
    });
  }

  /* ───── Tour state ───── */
  function isTourClosed() {
    return read(K_TOUR_CLOSED, false) === true;
  }

  function setTourClosed(v) {
    if (v) write(K_TOUR_CLOSED, true);
    else remove(K_TOUR_CLOSED);
    notifyChange('tour');
  }

  /* ───── Sidebar collapsed state ───── */
  function isSidebarCollapsed() {
    return read(K_SIDEBAR_COLLAPSED, false) === true;
  }

  function setSidebarCollapsed(v) {
    write(K_SIDEBAR_COLLAPSED, !!v);
  }

  /* ───── Wizard step (Doug v1.1.4 #4) — tour Step 2 / 2b reactivo ───── */
  function getWizardStep() {
    var v = read(K_WIZARD_STEP, 1);
    var n = parseInt(v, 10);
    return (isNaN(n) || n < 1) ? 1 : n;
  }

  function setWizardStep(n) {
    var step = parseInt(n, 10);
    if (isNaN(step) || step < 1) step = 1;
    write(K_WIZARD_STEP, step);
    notifyChange('wizard-step');
  }

  /* ───── Full reset (botón "Reiniciar demo")
     v1.12.0: ahora también limpia el store del IVC (ivc:store), la firma
     preset del Director (ivc-director-firma), y cualquier estado de demo
     persistido cross-perfil. Antes solo limpiaba IVCData keys → los
     trámites del store y la firma del Director sobrevivían al reset. */
  function fullReset() {
    remove(K_PERFIL);
    remove(K_TRAMITE);
    remove(K_TOUR_CLOSED);
    remove(K_SIDEBAR_COLLAPSED);
    remove(K_WIZARD_STEP);
    remove(K_TRAMITE_FOCAL);
    /* v1.12.0: limpiar todo el state del IVCStore + assets del Director. */
    try {
      localStorage.removeItem('ivc:store');
      localStorage.removeItem('ivc-director-firma');
    } catch (e) { /* private mode, IE — noop */ }
    notifyChange('full-reset');
  }

  /* ───── Trámite focal (v1.2.0 — Profesional workspace HU-4/HU-6)
     Estructura: { docsValidados: number, decision: 'Cumple'|'NoCumple'|'Parcial'|null,
                   numActo: string|null, fechaActo: string|null, observacionesNoCumple: string }
     Se almacena por separado del trámite "Borrador" del Usuario Externo (K_TRAMITE)
     para no contaminar el state del wizard. El tour escucha este key para Steps 6-8. */
  function getTramiteFocalState() {
    return read(K_TRAMITE_FOCAL, { docsValidados: 0, decision: null, numActo: null, fechaActo: null, observacionesNoCumple: '' });
  }
  function updateTramiteFocalState(partial) {
    var current = getTramiteFocalState();
    var updated = Object.assign({}, current, partial);
    write(K_TRAMITE_FOCAL, updated);
    /* El tour mira s.tramite — para reactividad lo mergeamos con el state del Profesional */
    notifyChange('tramite-focal');
    return updated;
  }
  function resetTramiteFocal() {
    remove(K_TRAMITE_FOCAL);
    notifyChange('tramite-focal-reset');
  }

  /* ───── Días hábiles calculator (placeholder simple) ───── */
  function diasRestantes() {
    var t = getTramite();
    if (!t || !t.fechaLimite) return null;
    var hoy = new Date('2026-05-21');
    var limite = new Date(t.fechaLimite);
    var msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.round((limite - hoy) / msPerDay));
  }

  /* ───── Expose ───── */
  window.IVCData = {
    /* Constants */
    PERFILES: PERFILES,
    DOCUMENTOS_DECRETO_1387: DOCUMENTOS_DECRETO_1387,
    FLUJO_TIMELINE: FLUJO_TIMELINE,
    PROFESIONALES_DISPONIBLES: PROFESIONALES_DISPONIBLES,
    TRAMITES_BANDEJA: TRAMITES_BANDEJA,
    getTramiteFocal: getTramiteFocal,
    /* Perfil */
    getPerfil: getPerfil,
    setPerfil: setPerfil,
    getPerfilData: getPerfilData,
    getAllPerfiles: getAllPerfiles,
    /* Trámite */
    getTramite: getTramite,
    setTramite: setTramite,
    updateTramite: updateTramite,
    resetTramite: resetTramite,
    initTramiteBorrador: initTramiteBorrador,
    radicarTramite: radicarTramite,
    toggleDocumento: toggleDocumento,
    getTramiteEstado: getTramiteEstado,
    getTimeline: getTimeline,
    diasRestantes: diasRestantes,
    /* Tour */
    isTourClosed: isTourClosed,
    setTourClosed: setTourClosed,
    /* Sidebar */
    isSidebarCollapsed: isSidebarCollapsed,
    setSidebarCollapsed: setSidebarCollapsed,
    /* Wizard step (v1.1.4 #4) */
    getWizardStep: getWizardStep,
    setWizardStep: setWizardStep,
    /* Trámite focal Profesional (v1.2.0) */
    getTramiteFocalState: getTramiteFocalState,
    updateTramiteFocalState: updateTramiteFocalState,
    resetTramiteFocal: resetTramiteFocal,
    /* Reset */
    fullReset: fullReset
  };

})(window);
