/* ═══════════════════════════════════════════════════════════════════
   shell.js — IVC Naowee layout (port canónico de naowee-test-sidebar-shell)
   ─────────────────────────────────────────────────────────────────────
   Mantiene API pública window.IVCShell.init() que las 4 páginas usan,
   pero ahora emite el markup canónico Naowee:
     - .sidebar > .sidebar-logo (burger + ministerio.svg + sep + pill "IVC")
     - .nav-row con .icon + .lbl + .active-bar (view-transition morph)
     - .top-header > .profile-switcher > .user-chip + .profile-dd
     - .demo-role-switcher (chip flotante bottom-right)
   Vanilla JS (no ES modules) — sirve desde file:// y todos los browsers.
   ═══════════════════════════════════════════════════════════════════ */

(function (window, document) {
  'use strict';

  var COLLAPSED_KEY = 'naowee.ivc.sidebarCollapsed';

  /* ───── Icons (inline SVG, stroke-based, currentColor) ───── */
  var ICONS = {
    burger:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    tramites: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
    notif:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    docs:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    perfil:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    bandeja:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    logout:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    chevron:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    refresh:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    bell:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    gear:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    userIcon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    logoutSm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    /* v1.10.0: icono para "Aprobación de actos" — documento con sello/check
       superpuesto. Comunica "documento que requiere visto bueno". */
    approval: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><polyline points="9 13 11 15 15 11"/></svg>',
    /* v1.11.0: icono para "Mi firma" del Director — pluma estilizada. */
    firma:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17v3h3"/><path d="M3 17l9-9 4 4-9 9"/><path d="M14 6l1.5-1.5a2.12 2.12 0 0 1 3 3L17 9"/><path d="M3 22h18"/></svg>',
    /* v1.12.0: iconos para los 3 nuevos roles complementarios. */
    plantilla:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>',
    aviso:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    juridica: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M12 3v18"/><path d="M5 7l7-3 7 3"/><path d="M5 7l-2 7c0 1.5 1 3 3 3s3-1.5 3-3l-2-7"/><path d="M19 7l-2 7c0 1.5 1 3 3 3s3-1.5 3-3l-2-7"/></svg>',
    /* v1.13.33: icono para "Equipo" del Coordinador — grupo de personas. */
    team:     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };

  /* ───── Nav items por perfil ───── */
  var NAV_ITEMS = {
    'usuario-externo': [
      { id: 'tramites', label: 'Mis trámites',   icon: ICONS.tramites, href: 'dashboard.html' },
      { id: 'notif',    label: 'Notificaciones', icon: ICONS.notif,    href: '#', badge: '2' },
      { id: 'docs',     label: 'Documentos',     icon: ICONS.docs,     href: '#' }
      /* "Mi perfil" eliminado (v1.1.3) — duplicaba el access del user-pill del header */
    ],
    /* v1.2.0 — Fase 2 Sprint 1: Coordinador habilitado (HU-3)
       v1.5.8 (25/05/2026): "Trámites en validación" y "Histórico" eliminados.
       Pasaron a ser TABS dentro de la Bandeja (patrón Naowee: un destino,
       múltiples vistas). Feedback Doug. */
    /* v1.10.0: Coordinador suma "Aprobación de actos" — flujo dedicado para
       revisar/aprobar los actos administrativos generados por profesionales
       antes de pasar a firma del Director (loop INS-004 COO).
       v1.10.1: badge del actos removido — un valor hardcoded creaba mismatch
       con el empty state real de la página, y además truncaba el label. */
    /* v1.13.4 (Doug 27/05/2026): badge dinámico. Antes era hardcoded '4' →
       generaba mismatch entre el contador del sidebar y los trámites reales
       en la tabla. Ahora se computa en computeBadge() abajo, usando el store. */
    'coordinador': [
      { id: 'bandeja-coord', section: 'gestion', label: 'Bandeja',              icon: ICONS.bandeja,  href: 'bandeja.html' },
      { id: 'actos-coord',   section: 'gestion', label: 'Aprobación de actos',  icon: ICONS.approval, href: 'actos.html' },
      /* v1.13.35: sección CONFIGURACIÓN — patrón canónico del Project
         admin. Coordinador gestiona equipo IVC desde aquí. */
      { id: 'equipo-coord',  section: 'config',  label: 'Usuarios y áreas',     icon: ICONS.team,     href: 'equipo.html' }
    ],
    /* v1.2.0 — Fase 2 Sprint 1: Profesional habilitado (HU-4/HU-6)
       v1.5.4 (25/05/2026): bandeja-prof ahora apunta a bandeja.html (lista de
       asignados), no a workspace.html (que es la vista de validación 1-trámite).
       v1.5.8 (25/05/2026): "En revisión" e "Histórico" eliminados → tabs en bandeja. */
    'profesional': [
      { id: 'bandeja-prof', label: 'Mi bandeja', icon: ICONS.bandeja, href: 'bandeja.html' }
    ],
    /* v1.11.0: Director con bandeja de trámites pendientes firma + perfil
       para subir su firma electrónica (preset reutilizable). */
    'director': [
      { id: 'bandeja-director', label: 'Por firmar', icon: ICONS.approval, href: 'bandeja.html' },
      { id: 'perfil-director',  label: 'Mi firma',   icon: ICONS.firma,    href: 'perfil.html' }
    ],
    /* v1.12.0: 3 nuevos roles complementarios (Fase 5.5 - 6 del flujo V4). */
    'atu': [
      { id: 'bandeja-atu', label: 'Por notificar', icon: ICONS.plantilla, href: 'bandeja.html' }
    ],
    'git': [
      { id: 'bandeja-git', label: 'Avisos', icon: ICONS.aviso, href: 'bandeja.html' }
    ],
    'juridica': [
      { id: 'bandeja-jur', label: 'Apelaciones', icon: ICONS.juridica, href: 'bandeja.html' }
    ]
  };

  /* Section label por perfil. v1.13.35: soporta multi-sección con un map
     { sectionKey → label }. Ítems sin `section` caen en una sección
     default (la primera del map o el string legacy). */
  var SECTION_LABELS = {
    'usuario-externo': 'MI ORGANISMO',
    'coordinador':     { 'gestion': 'GESTIÓN', 'config': 'CONFIGURACIÓN' },
    'profesional':     'OPERACIÓN',
    'director':        'DIRECCIÓN',
    /* v1.12.0: roles complementarios. */
    'atu':             'ATENCIÓN AL USUARIO',
    'git':             'COMUNICACIONES',
    'juridica':        'JURÍDICA'
  };

  function el(html) {
    var div = document.createElement('div');
    div.innerHTML = String(html).trim();
    return div.firstChild;
  }

  function inSubdir() {
    /* v1.12.6: agregados atu|git|juridica al regex. Bug reportado por Doug
       cuando cambiaba de perfil estando en /prototype/atu/bandeja.html:
       inSubdir() devolvía false → pathPrefix() devolvía '' → navegación
       resolvía a /prototype/atu/coordinador/bandeja.html (404). */
    return /\/(usuario-externo|profesional|coordinador|director|atu|git|juridica)\//.test(location.pathname);
  }
  /* v1.13.4: badge dinámico del sidebar — Doug reportó que Profesional
     mostraba '4' hardcoded cuando solo tenía 3 trámites. Ahora computeBadge()
     cuenta del store y devuelve string o null. */
  function computeBadge(navId) {
    if (typeof window === 'undefined' || !window.IVCStore || !IVCStore.getTramites) return null;
    try {
      var todos = IVCStore.getTramites({ area: 'aficionado' }) || [];
      if (navId === 'bandeja-coord') {
        /* v1.13.5: Doug — el badge debe reflejar el total de trámites visibles
           en la tabla (mismo número que el footer "Mostrando X de Y"), no
           solo las "No asignada". El Coordinador ve toda la operación. */
        return todos.length || null;
      }
      if (navId === 'bandeja-prof') {
        return todos.filter(function (t) {
          return t.profesionalId === 'cp-001' && (t.estado === 'Asignada' || t.estado === 'En validación');
        }).length || null;
      }
      if (navId === 'bandeja-director') {
        return todos.filter(function (t) { return t.estado === 'PendienteFirma'; }).length || null;
      }
      if (navId === 'actos-coord') {
        return todos.filter(function (t) { return t.estado === 'PendienteCOO'; }).length || null;
      }
      if (navId === 'bandeja-atu') {
        return todos.filter(function (t) {
          return t.estado === 'NotifOficinas' && (typeof t.plazoDias === 'number' ? t.plazoDias >= 0 : true);
        }).length || null;
      }
      if (navId === 'bandeja-git') {
        return todos.filter(function (t) {
          return t.estado === 'NotifOficinas' && (typeof t.plazoDias === 'number' && t.plazoDias < 0);
        }).length || null;
      }
      if (navId === 'bandeja-jur') {
        return todos.filter(function (t) { return t.estado === 'EnApelacion'; }).length || null;
      }
    } catch (e) { return null; }
    return null;
  }
  function pathPrefix() { return inSubdir() ? '../' : ''; }
  function sharedPath() { return pathPrefix() + 'shared/'; }

  function getCollapsed() {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  }
  function setCollapsed(v) {
    localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0');
  }

  /* ───── Sidebar (canonical markup) ───── */
  function renderSidebar(opts) {
    /* v1.5.3: default a 'coordinador' (perfil interno) en lugar de 'usuario-externo'
       que fue removido del switcher. usuario-externo sigue existiendo en NAV_ITEMS
       como fallback para la ruta /usuario-externo/ pero ya no es perfil seleccionable. */
    var perfilId = (opts && opts.perfilId) || (window.IVCData && window.IVCData.getPerfil()) || 'coordinador';
    var items = NAV_ITEMS[perfilId] || NAV_ITEMS['coordinador'] || NAV_ITEMS['usuario-externo'];
    var activeId = (opts && opts.activeNav) || items[0].id;
    var isCollapsed = getCollapsed();
    var sectionLabel = SECTION_LABELS[perfilId] || 'OPERACIÓN';

    /* Determinar subdir base por perfil (para resolver href relativos) */
    var perfilSubdirs = {
      'usuario-externo': 'usuario-externo/',
      'coordinador':     'coordinador/',
      'profesional':     'profesional/',
      'director':        'director/',
      /* v1.12.0: subdirs nuevos para los 3 roles complementarios. */
      'atu':             'atu/',
      'git':             'git/',
      'juridica':        'juridica/'
    };
    var perfilSubdir = perfilSubdirs[perfilId] || 'usuario-externo/';

    /* v1.13.35: helper para render de un nav row individual. */
    function renderNavRow(it) {
      var isActive = it.id === activeId;
      var href = it.href;
      if (href && href !== '#' && !/^https?:/.test(href)) {
        href = (inSubdir() ? '' : perfilSubdir) + href;
      }
      var badgeVal = it.badge != null ? it.badge : computeBadge(it.id);
      var badgeHtml = badgeVal ? '<span class="nav-row__badge">' + badgeVal + '</span>' : '';
      return '<a class="nav-row ' + (isActive ? 'is-active' : '') + '" ' +
        'href="' + href + '" ' +
        'data-nav-id="' + it.id + '" ' +
        'data-lbl="' + it.label + '">' +
        (isActive ? '<div class="active-bar"></div>' : '') +
        '<div class="icon">' + it.icon + '</div>' +
        '<span class="lbl">' + it.label + '</span>' +
        badgeHtml +
        '</a>';
    }

    /* v1.13.35: multi-section support — si sectionLabel es un objeto
       { sectionKey: label }, agrupar items por su campo `section`. */
    var navHtml;
    if (typeof sectionLabel === 'object' && sectionLabel !== null) {
      var sectionKeys = Object.keys(sectionLabel);
      navHtml = sectionKeys.map(function (key) {
        var sectionItems = items.filter(function (it) { return it.section === key; });
        if (sectionItems.length === 0) return '';
        return '<div class="nav-section">' + sectionLabel[key] + '</div>' +
               sectionItems.map(renderNavRow).join('');
      }).join('');
    } else {
      /* Legacy single-section: una sola label, todos los items. */
      navHtml = '<div class="nav-section">' + sectionLabel + '</div>' +
                items.map(renderNavRow).join('');
    }

    return '<aside class="sidebar ' + (isCollapsed ? 'is-collapsed' : '') + '" id="sidebar">' +
      '<div class="sidebar-logo">' +
        '<button class="burger-btn" id="sidebarToggle" type="button" aria-label="Colapsar menú">' +
          ICONS.burger +
        '</button>' +
        '<img src="' + sharedPath() + 'logos/ministerio.svg" alt="Ministerio del Deporte" class="sb-logo-img"/>' +
        '<div class="logo-sep"></div>' +
        '<span class="sb-logo-img sb-logo-img--pill" title="Inspección, Vigilancia y Control">IVC</span>' +
      '</div>' +
      '<nav class="sidebar-nav" id="sidebarNav" role="navigation" aria-label="Menú principal">' +
        navHtml +
      '</nav>' +
      '<div class="sidebar-bottom">' +
        '<a class="nav-row" href="' + pathPrefix() + 'index.html" data-action="logout" data-lbl="Cerrar sesión">' +
          '<div class="icon">' + ICONS.logout + '</div>' +
          '<span class="lbl">Cerrar sesión</span>' +
        '</a>' +
      '</div>' +
      '</aside>';
  }

  /* ───── Header (canonical: profile-switcher SIN breadcrumb ni title)
     Doug fix #2: NO breadcrumb en header.
     Doug fix #3: el title del page vive en el body de la página
     (page-title-block en dashboard, hero en detalle, stepper en wizard).
     Si opts.title === null o no se pasa, no se renderiza title.
     Si se pasa string, se renderiza por compat con otras vistas. ───── */
  function renderHeader(opts) {
    var perfilId = (window.IVCData && window.IVCData.getPerfil()) || 'usuario-externo';
    var perfil = (window.IVCData && window.IVCData.PERFILES[perfilId]) || {};
    var title = (opts && opts.title) || null;

    var titleHtml = '';
    if (title) {
      titleHtml = '<div class="top-header__title-wrap">' +
        '<h1 class="top-header__title">' + title + '</h1>' +
      '</div>';
    } else {
      /* Spacer flex para empujar el user-chip a la derecha */
      titleHtml = '<div class="top-header__title-wrap"></div>';
    }

    var color = perfil.color || '#002B5B';
    var avatar = perfil.avatar || 'LB';
    var ident = perfil.nit ? ('NIT ' + perfil.nit) : (perfil.cedula ? ('CC ' + perfil.cedula) : '');

    return '<header class="top-header">' +
      titleHtml +
      '<div class="top-header__right">' +
        '<div class="profile-switcher" id="profileSwitcher">' +
          '<div class="user-chip" id="userChipTrigger">' +
            '<div class="ava">' +
              '<div class="ava-ring" style="background:' + color + '22;color:' + color + '">' + avatar + '</div>' +
              '<div class="ava-dot"></div>' +
            '</div>' +
            '<div class="user-info">' +
              '<span class="user-name">' + (perfil.nombre || 'Usuario') + '</span>' +
              '<span class="user-role">' + (perfil.rol || '') + '</span>' +
            '</div>' +
            '<button class="user-chip__chevron" type="button" aria-label="Abrir menú de cuenta">' +
              ICONS.chevron +
            '</button>' +
          '</div>' +
          /* Mid-Fi: solo identity card. Sin acciones (Mi perfil / Notif /
             Configuraciones / Cerrar sesión) para no distraer del flujo IVC.
             Doug feedback v1.1.4 — round 3 #1. */
          '<div class="profile-dd profile-dd--identity-only" role="menu">' +
            '<div class="profile-dd__header">' +
              '<span class="ava-ring" style="width:42px;height:42px;font-size:14px;background:' + color + '22;color:' + color + '">' + avatar + '</span>' +
              '<div class="profile-dd__user">' +
                '<strong>' + (perfil.nombre || 'Usuario') + '</strong>' +
                '<small>' + ident + '</small>' +
                '<span class="profile-dd__current-role" style="color:' + color + '">' +
                  '<span class="profile-dd__check-ico">' + ICONS.check + '</span>' +
                  (perfil.rol || '') +
                '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>';
  }

  /* ───── Demo Role Switcher (chip flotante — solo sandbox) ───── */
  function renderDemoSwitcher() {
    var perfilId = (window.IVCData && window.IVCData.getPerfil()) || 'usuario-externo';
    var perfiles = (window.IVCData && window.IVCData.getAllPerfiles && window.IVCData.getAllPerfiles()) || [];
    var currentPerfil = (window.IVCData && window.IVCData.PERFILES[perfilId]) || {};

    /* v1.12.9 (Doug 27/05/2026): agrupar perfiles por fase del flujo end-to-end.
       Orden canónico del proceso IVC:
       1) Coordinador IVC (radica/asigna) — Fase 2
       2) Profesional IVC (valida documentos) — Fase 2 (paralela)
       3) Director IVC (firma) — Fase 5
       4) Notificación (ATU plantilla / GIT aviso) — Fase 5.5
       5) Jurídica (apelaciones) — Fase 6 */
    var GROUPS = [
      { label: 'Validación de requisitos', ids: ['coordinador', 'profesional'] },
      { label: 'Firma del acto',           ids: ['director'] },
      { label: 'Notificación al organismo', ids: ['atu', 'git'] },
      { label: 'Recursos y apelaciones',   ids: ['juridica'] }
    ];

    function renderItem(p) {
      var isActive = p.id === perfilId;
      var disabled = !p.enabled;
      return '<a class="demo-role-switcher__item ' +
        (isActive ? 'is-active' : '') + ' ' +
        (disabled ? 'is-disabled' : '') + '" ' +
        'href="#" data-perfil="' + p.id + '"' +
        (disabled ? ' aria-disabled="true"' : '') + '>' +
        '<span class="demo-role-switcher__item-avatar" style="background:' + p.color + '22;color:' + p.color + '">' + p.avatar + '</span>' +
        '<span class="demo-role-switcher__item-meta">' +
          '<span class="demo-role-switcher__item-name">' + p.nombre + '</span>' +
          '<span class="demo-role-switcher__item-role">' + p.rol + '</span>' +
        '</span>' +
        '<span class="demo-role-switcher__item-stage">' + p.etapa + '</span>' +
        (isActive ? '<span class="demo-role-switcher__check">' + ICONS.check + '</span>' : '') +
      '</a>';
    }

    var perfilesById = {};
    perfiles.forEach(function (p) { perfilesById[p.id] = p; });

    var itemsHtml = GROUPS.map(function (g) {
      var groupItems = g.ids
        .map(function (id) { return perfilesById[id]; })
        .filter(Boolean)
        .map(renderItem)
        .join('');
      if (!groupItems) return '';
      return '<div class="demo-role-switcher__group-label">' + g.label + '</div>' + groupItems;
    }).join('');

    return '<div class="demo-role-switcher" id="demoSwitcher">' +
      '<button class="demo-role-switcher__toggle" id="demoSwitcherToggle" type="button" aria-haspopup="true">' +
        '<span class="demo-role-switcher__badge">DEMO</span>' +
        '<span class="demo-role-switcher__avatar" style="background:' + (currentPerfil.color || '#002B5B') + '22;color:' + (currentPerfil.color || '#002B5B') + '">' + (currentPerfil.avatar || 'LB') + '</span>' +
        '<span>Cambiar perfil</span>' +
        '<span class="demo-role-switcher__chev">' + ICONS.chevron + '</span>' +
      '</button>' +
      '<div class="demo-role-switcher__panel" id="demoSwitcherPanel" role="menu">' +
        '<div class="demo-role-switcher__panel-label">CAMBIAR DE PERFIL (SIMULADO)</div>' +
        '<div class="demo-role-switcher__list">' + itemsHtml + '</div>' +
        /* v1.5.2 (25/05/2026): Sección MODO DEMO — patrón Project v2.0.3.
           "Guiado · vacío" (sin datos, arranca cuando creas un trámite) vs
           "Libre · con datos" (seed de 12 trámites). */
        '<div class="demo-role-switcher__mode-section">' +
          '<div class="demo-role-switcher__mode-label">MODO DEMO</div>' +
          '<div class="demo-role-switcher__mode-switch" role="group" aria-label="Modo demo">' +
            '<button type="button" class="demo-role-switcher__mode-btn" data-mode="blank" title="Bandeja vacía — el flujo arranca cuando creas un trámite desde el formulario">Guiado · vacío</button>' +
            '<button type="button" class="demo-role-switcher__mode-btn" data-mode="demo"  title="12 trámites mock cargados para explorar la bandeja">Libre · con datos</button>' +
          '</div>' +
        '</div>' +
        '<div class="demo-role-switcher__panel-footer">' +
          '<button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" id="demoRestartTourBtn">' +
            ICONS.refresh +
            '<span>Reiniciar tour</span>' +
          '</button>' +
          '<button type="button" class="naowee-btn naowee-btn--quiet naowee-btn--small" id="demoResetBtn" title="Limpia el state del demo">Reiniciar demo</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ───── Tooltip para sidebar colapsado ───── */
  var _tooltipEl = null;
  function setupTooltips() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    if (!_tooltipEl) {
      _tooltipEl = document.createElement('div');
      _tooltipEl.className = 'nav-tooltip';
      document.body.appendChild(_tooltipEl);
    }
    function showTooltip(row) {
      if (!sidebar.classList.contains('is-collapsed')) return;
      var lbl = row.getAttribute('data-lbl') || row.querySelector('.lbl')?.textContent || '';
      _tooltipEl.textContent = String(lbl).trim();
      var rect = row.getBoundingClientRect();
      _tooltipEl.style.left = (rect.right + 12) + 'px';
      _tooltipEl.style.top = (rect.top + rect.height / 2) + 'px';
      _tooltipEl.classList.add('is-visible');
    }
    function hideTooltip() {
      if (_tooltipEl) _tooltipEl.classList.remove('is-visible');
    }
    sidebar.querySelectorAll('.nav-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () { showTooltip(row); });
      row.addEventListener('mouseleave', hideTooltip);
    });
    var observer = new MutationObserver(hideTooltip);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  }

  /* ───── Wire events ───── */
  function wireEvents() {
    /* Burger toggle — desktop colapsa, mobile abre drawer */
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        /* En mobile (< 768px) el sidebar usa drawer overlay; el
           burger del header lo abre/cierra. Aquí (burger interno del
           sidebar) cierra el drawer cuando está abierto. */
        if (window.matchMedia('(max-width: 767px)').matches) {
          closeMobileDrawer();
          return;
        }
        sidebar.classList.toggle('is-collapsed');
        setCollapsed(sidebar.classList.contains('is-collapsed'));
      });
    }

    /* v1.13.43: Mobile drawer trigger (botón flotante top-left).
       Solo visible en < 768px vía CSS. Crear si no existe. */
    setupMobileDrawer(sidebar);

    /* Profile dropdown */
    var switcher = document.getElementById('profileSwitcher');
    var trigger = document.getElementById('userChipTrigger');
    if (switcher && trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        switcher.classList.toggle('is-open');
      });
      document.addEventListener('click', function (e) {
        if (!switcher.contains(e.target)) switcher.classList.remove('is-open');
      });
    }

    /* Demo switcher */
    var sw = document.getElementById('demoSwitcher');
    var swToggle = document.getElementById('demoSwitcherToggle');
    if (swToggle && sw) {
      swToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        sw.classList.toggle('is-open');
      });
      document.addEventListener('click', function (e) {
        if (sw.classList.contains('is-open') && !sw.contains(e.target)) {
          sw.classList.remove('is-open');
        }
      });
    }

    /* Cambio de perfil */
    document.querySelectorAll('[data-perfil]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        if (item.classList.contains('is-disabled')) {
          var nameEl = item.querySelector('.demo-role-switcher__item-name');
          var nameText = nameEl ? nameEl.textContent : 'Este perfil';
          showSnackbar(nameText + ' estará disponible en Fase 2.');
          return;
        }
        var next = item.getAttribute('data-perfil');
        var current = window.IVCData.getPerfil();
        if (next === current) {
          if (sw) sw.classList.remove('is-open');
          return;
        }
        window.IVCData.setPerfil(next);
        /* v1.2.0 — landing por perfil
           v1.11.2: agregada entrada 'director' → /director/bandeja.html. Antes
           faltaba: el switcher escribía el perfil pero no navegaba → la página
           se quedaba en /coordinador/* mostrando aún a Carolina Méndez.
           Síntoma: "primero no switecha al perfil" (Doug, 2026-05-26). */
        var landings = {
          'usuario-externo': 'usuario-externo/dashboard.html',
          'coordinador':     'coordinador/bandeja.html',
          'profesional':     'profesional/bandeja.html',
          'director':        'director/bandeja.html',
          /* v1.12.0: landings para los 3 roles complementarios. */
          'atu':             'atu/bandeja.html',
          'git':             'git/bandeja.html',
          'juridica':        'juridica/bandeja.html'
        };
        var landing = landings[next];
        if (landing) {
          window.location.href = pathPrefix() + landing;
        }
      });
    });

    /* Reiniciar tour */
    var restartBtn = document.getElementById('demoRestartTourBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        window.IVCData.setTourClosed(false);
        window.location.reload();
      });
    }

    /* Reiniciar demo (full reset) */
    var resetBtn = document.getElementById('demoResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.confirm('¿Reiniciar el demo? Se borrarán los datos del trámite y volverás al inicio.')) {
          window.IVCData.fullReset();
          window.location.href = pathPrefix() + 'index.html';
        }
      });
    }

    /* v1.5.3 (25/05/2026): Modo demo (Guiado·vacío / Libre·con datos)
       Event delegation en document — sobrevive re-renders del panel.
       Antes hacía querySelectorAll una sola vez y los bindings se perdían
       si el switcher se re-renderizaba. Doug 25/05/2026. */
    function syncModeButtons() {
      if (!window.IVCStore) return;
      var current = window.IVCStore.getMode();
      document.querySelectorAll('.demo-role-switcher__mode-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.mode === current ? 'true' : 'false');
      });
    }
    syncModeButtons();

    /* Event delegation: el handler vive en document, sobrevive a cualquier
       re-mount del panel demo-switcher. */
    if (!window.__ivcModeBound) {
      window.__ivcModeBound = true;
      document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.demo-role-switcher__mode-btn');
        if (!btn) return;
        e.stopPropagation();
        if (!window.IVCStore) {
          console.warn('[IVC] Modo demo clicked but IVCStore not loaded');
          return;
        }
        var mode = btn.dataset.mode;
        if (mode === window.IVCStore.getMode()) return;
        window.IVCStore.setMode(mode);
        syncModeButtons();
        /* v1.5.3 (25/05/2026): cerrar el panel demo-switcher ANTES de
           mostrar el snackbar, así no queda detrás del pill. */
        var swPanel = document.getElementById('demoSwitcher');
        if (swPanel) swPanel.classList.remove('is-open');
        if (window.IVCShell && window.IVCShell.showSnackbar) {
          /* Pequeño delay para que el cierre del menu se vea fluido antes del snack */
          setTimeout(function () {
            window.IVCShell.showSnackbar(
              mode === 'demo'
                ? 'Modo libre: 12 trámites cargados'
                : 'Modo guiado: bandeja vacía. Crea un trámite desde el formulario.',
              'success'
            );
          }, 180);
        }
      });
    }

    /* Logout */
    document.querySelectorAll('[data-action="logout"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = pathPrefix() + 'index.html';
      });
    });

    setupTooltips();
  }

  /* ───── Snackbar canónico (DS v1.8.0) ─────
     v1.5.3 rev (25/05/2026): markup paridad con .naowee-snackbar del DS
     oficial (líneas 3172-3232). Variants soportados:
     - 'success'  → badge verde (positive)
     - 'info'     → badge azul (informative, default)
     - 'caution'  → badge naranja (caution)
     - 'negative' → badge rojo (negative)
     El positionamiento (fixed bottom + animación) vive en components.css. */
  var SNACK_ICONS = {
    success:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    info:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    caution:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    negative: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  };
  function showSnackbar(text, variant) {
    var v = SNACK_ICONS[variant] ? variant : 'info';
    var existing = document.querySelector('.naowee-snackbar');
    if (existing) existing.remove();
    var snack = el(
      '<div class="naowee-snackbar naowee-snackbar--' + v + '" role="status" aria-live="polite">' +
        '<div class="naowee-snackbar__content">' +
          '<span class="naowee-snackbar__badge">' + SNACK_ICONS[v] + '</span>' +
          '<span class="naowee-snackbar__text">' + text + '</span>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(snack);
    requestAnimationFrame(function () { snack.classList.add('is-visible'); });
    setTimeout(function () {
      snack.classList.remove('is-visible');
      setTimeout(function () { snack.remove(); }, 300);
    }, 3200);
  }

  /* ───── Init (public API consumed by 4 HTML pages) ───── */
  function init(opts) {
    opts = opts || {};

    if (window.IVCData && !window.IVCData.getPerfil()) {
      window.IVCData.setPerfil('usuario-externo');
    }

    var shellRoot = document.getElementById('app-shell');
    if (shellRoot) {
      /* Las páginas ya inyectan su contenido envuelto en <div class="page-inner">
         desde su <template id="page-content">, así que NO lo re-envolvemos acá. */
      var innerContent = shellRoot.innerHTML;
      shellRoot.outerHTML =
        '<div class="shell" id="app-shell">' +
          renderSidebar({ activeNav: opts.activeNav, perfilId: opts.perfilId }) +
          '<div class="main">' +
            renderHeader({ title: opts.title }) +
            '<main class="page page-fade-in" id="page-main">' +
              innerContent +
            '</main>' +
          '</div>' +
        '</div>';
    }

    if (!document.getElementById('demoSwitcher')) {
      var switcher = el(renderDemoSwitcher());
      document.body.appendChild(switcher);
    }

    wireEvents();
  }

  /* ───── Mobile drawer (sidebar como off-canvas en < 768px) ─────
     v1.13.43 (Doug): responsive mobile-first.
     - setupMobileDrawer inyecta un trigger flotante (top-left) que
       abre el sidebar como drawer overlay.
     - Backdrop click / ESC / click en cualquier nav-row cierran. */
  function setupMobileDrawer(sidebar) {
    if (!sidebar) return;
    if (document.querySelector('.mobile-drawer-trigger')) return;
    var trigger = document.createElement('button');
    trigger.className = 'mobile-drawer-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Abrir menú');
    trigger.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    document.body.appendChild(trigger);

    trigger.addEventListener('click', function (ev) {
      ev.stopPropagation();
      sidebar.classList.add('is-mobile-open');
      document.body.classList.add('has-mobile-drawer-open');
    });

    /* Backdrop click → cerrar (body::after es backdrop visual, lo
       capturamos via click en body cuando drawer abierto). */
    document.addEventListener('click', function (ev) {
      if (!document.body.classList.contains('has-mobile-drawer-open')) return;
      if (sidebar.contains(ev.target) || trigger.contains(ev.target)) return;
      closeMobileDrawer();
    });

    /* Click en cualquier nav-row dentro del drawer → cierra el drawer
       después de navegar (UX standard de drawer mobile). */
    sidebar.addEventListener('click', function (ev) {
      var nav = ev.target.closest && ev.target.closest('.nav-row');
      if (nav && window.matchMedia('(max-width: 767px)').matches) {
        /* Esperar un frame para que el browser inicie la navegación
           antes de cerrar el drawer (no afecta navegación). */
        setTimeout(closeMobileDrawer, 100);
      }
    });

    /* ESC cierra drawer si está abierto. */
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && document.body.classList.contains('has-mobile-drawer-open')) {
        closeMobileDrawer();
      }
    });

    /* Resize: si pasamos de mobile a desktop con drawer abierto, cerrar. */
    window.addEventListener('resize', function () {
      if (!window.matchMedia('(max-width: 767px)').matches) {
        closeMobileDrawer();
      }
    });
  }

  function closeMobileDrawer() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('is-mobile-open');
    document.body.classList.remove('has-mobile-drawer-open');
  }

  window.IVCShell = {
    init: init,
    renderSidebar: renderSidebar,
    renderHeader: renderHeader,
    renderDemoSwitcher: renderDemoSwitcher,
    showSnackbar: showSnackbar,
    ICONS: ICONS,
    pathPrefix: pathPrefix
  };

})(window, document);
