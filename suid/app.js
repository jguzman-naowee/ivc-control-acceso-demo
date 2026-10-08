/* Shell del IVC dentro del SUID: menú del profesional; solo Gestión de infractores tiene contenido. */
(function (w, d) {
  'use strict';

  function ico(paths) {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  var I = {
    chart: ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    users: ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M17.5 14.5c2.4.3 4 2 4 4.5"/>'),
    doc: ico('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>'),
    list: ico('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    power: ico('<path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>'),
    access: ico('<path d="M4 6h6M4 12h6M4 18h6"/><rect x="14" y="4" width="6" height="16" rx="1.5"/>'),
    trophy: ico('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M10 17h4"/>'),
    team: ico('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M17.5 14.5c2.4.3 4 2 4 4.5"/>'),
    grid: ico('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    pin: ico('<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    globe: ico('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
    gear: ico('<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.650 1.650 0 0 0 .33 1.820l.06.060a2 2 0 0 1-2.830 2.830l-.06-.060a1.650 1.650 0 0 0-1.820-.33 1.650 1.650 0 0 0-1 1.510V21a2 2 0 0 1-4 0v-.09a1.650 1.650 0 0 0-1-1.510 1.650 1.650 0 0 0-1.820.33l-.06.060a2 2 0 0 1-2.830-2.830l.06-.060a1.650 1.650 0 0 0 .33-1.820 1.650 1.650 0 0 0-1.510-1H3a2 2 0 0 1 0-4h.09a1.650 1.650 0 0 0 1.510-1 1.650 1.650 0 0 0-.33-1.820l-.06-.060a2 2 0 0 1 2.830-2.830l.06.060a1.650 1.650 0 0 0 1.820.33H9a1.650 1.650 0 0 0 1-1.510V3a2 2 0 0 1 4 0v.09a1.650 1.650 0 0 0 1 1.510 1.650 1.650 0 0 0 1.820-.33l.06-.060a2 2 0 0 1 2.830 2.830l-.06.060a1.650 1.650 0 0 0-.33 1.820V9a1.650 1.650 0 0 0 1.510 1H21a2 2 0 0 1 0 4h-.09a1.650 1.650 0 0 0-1.510 1z"/>'),
    shield: ico('<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    eye: ico('<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    gate: ico('<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-7h6v7M4 12h16"/>'),
    out: ico('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
    search: ico('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.500" y2="16.500"/>'),
    inbox: ico('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.450 5.110L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.450-6.890A2 2 0 0 0 16.760 4H7.240a2 2 0 0 0-1.790 1.110z"/>'),
    chevR: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
    chevD: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.730 21a2 2 0 0 1-3.460 0"/></svg>'
  };

  var SVGS = {"icon-bandeja": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"> <path d=\"M9 5H7C5.895 5 5 5.895 5 7V19C5 20.105 5.895 21 7 21H17C18.105 21 19 20.105 19 19V7C19 5.895 18.105 5 17 5H15M9 5C9 5.552 9.448 6 10 6H14C14.552 6 15 5.552 15 5M9 5C9 4.448 9.448 4 10 4H14C14.552 4 15 4.448 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/> </svg> ", "icon-actos": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M19 15V7.828C19 7.298 18.789 6.789 18.414 6.414L15.586 3.586C15.211 3.211 14.702 3 14.172 3H7C5.895 3 5 3.895 5 5V19C5 20.105 5.895 21 7 21H13\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M21 18L18 21L16 19\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8 11H14\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8 14H14\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8 17H12.33\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M19 8H15C14.448 8 14 7.552 14 7V3\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg> ", "icon-equipo": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M20.7925 9.52352C21.5825 10.3136 21.5825 11.5944 20.7925 12.3845C20.0025 13.1745 18.7216 13.1745 17.9315 12.3845C17.1415 11.5944 17.1415 10.3136 17.9315 9.52352C18.7216 8.73349 20.0025 8.73349 20.7925 9.52352\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M14.2026 5.91236C15.4191 7.12884 15.4191 9.10115 14.2026 10.3176C12.9861 11.5341 11.0138 11.5341 9.79731 10.3176C8.58083 9.10116 8.58083 7.12885 9.79731 5.91236C11.0138 4.69588 12.9861 4.69588 14.2026 5.91236\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M6.06849 9.52352C6.85853 10.3136 6.85853 11.5944 6.06849 12.3845C5.27846 13.1745 3.99757 13.1745 3.20754 12.3845C2.41751 11.5944 2.41751 10.3136 3.20754 9.52352C3.99758 8.73349 5.27846 8.73349 6.06849 9.52352\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M23 19V17.904C23 16.523 21.881 15.404 20.5 15.404H19.699\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M1 19V17.904C1 16.523 2.119 15.404 3.5 15.404H4.301\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M17.339 19V17.399C17.339 15.466 15.772 13.899 13.839 13.899H10.16C8.227 13.899 6.66 15.466 6.66 17.399V19\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg> ", "icon-firmar": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M5.5173 3.97466L3.47045 6.01951L2.47603 5.0281\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M5.49729 10.0006L2.49604 12.9989\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M2.49751 9.99918L5.49582 13.0004\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M5.5173 16.9801L3.47045 19.0249L2.47603 18.0335\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M16.0017 17.1132V5.4973C16.0017 4.11601 17.1214 2.99625 18.5027 2.99625V2.99625C19.884 2.99625 21.0037 4.11601 21.0037 5.4973V17.1132C21.0037 17.8348 20.7697 18.5368 20.3368 19.1141L19.1697 20.6703C19.0122 20.8802 18.7651 21.0038 18.5027 21.0038C18.2403 21.0038 17.9932 20.8802 17.8358 20.6703L16.6686 19.1141C16.2357 18.5368 16.0017 17.8348 16.0017 17.1132V17.1132Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8.99875 4.99709H12\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8.99875 11.4998H12\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M8.99875 18.0025H12\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M16.0017 7.99834H21.0037\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg> ", "icon-firma": "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M15.4483 4.93319L14.0517 3.53652C13.5 2.98569 12.54 2.98736 11.99 3.53652L10.4367 5.08986C10.435 5.09152 10.4333 5.09152 10.4317 5.09319C10.43 5.09486 10.43 5.09652 10.4283 5.09819L3.38417 12.1415C3.10833 12.4165 2.95667 12.7824 2.95667 13.1724V15.4015C2.95667 15.7465 3.23667 16.0265 3.58167 16.0265H5.81083C6.20083 16.0265 6.56667 15.874 6.84083 15.599L13.8892 8.55236L13.89 8.55152L13.8908 8.55069L15.4467 6.99486C16.0167 6.42652 16.0167 5.50236 15.4483 4.93319ZM5.95833 14.7165C5.92 14.7557 5.86833 14.7765 5.8125 14.7765H4.20833V13.1724C4.20833 13.1174 4.22916 13.0657 4.2675 13.0274L4.26916 13.0257L10.8758 6.41902L12.5658 8.10902L5.95833 14.7165ZM14.565 6.11152L13.45 7.22569L11.76 5.53569L12.875 4.42069C12.9817 4.31486 13.0642 4.31652 13.1692 4.42069L14.5658 5.81652C14.645 5.89819 14.645 6.02986 14.565 6.11152Z\" fill=\"currentColor\"/> </svg> ", "icon-notificar": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M19 3C20.105 3 21 3.895 21 5V14C21 15.105 20.105 16 19 16H17.5\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M6.5 16H5C3.895 16 3 15.105 3 14V5C3 3.895 3.895 3 5 3H19\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M12 15V7\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M15 12H16.5C17.052 12 17.5 12.448 17.5 13V19C17.5 20.105 16.605 21 15.5 21H8.5C7.395 21 6.5 20.105 6.5 19V13C6.5 12.448 6.948 12 7.5 12H9\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M14 9L12 7L10 9\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg> ", "icon-avisos": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"> <path d=\"M8.06836 7.00329C8.40443 7.03751 8.66664 7.32161 8.66667 7.6667V12.3334C8.66667 12.7016 8.36819 13 8 13C7.63181 13 7.33333 12.7016 7.33333 12.3334V8.33337H6.66667C6.29848 8.33337 6 8.03489 6 7.6667C6.00003 7.29854 6.2985 7.00004 6.66667 7.00004H8L8.06836 7.00329Z\" fill=\"currentColor\"/> <path d=\"M7.3431 3.58142C7.7105 3.25984 8.25596 3.25139 8.63151 3.55798L8.70768 3.62699L8.77604 3.70251C9.09613 4.0953 9.073 4.6744 8.70703 5.0404C8.31675 5.43068 7.68423 5.43095 7.29362 5.04105C6.91887 4.66673 6.90365 4.06951 7.2474 3.67647C7.26145 3.65928 7.27629 3.64237 7.29232 3.62634L7.29297 3.62569C7.30882 3.6099 7.32613 3.59528 7.3431 3.58142Z\" fill=\"currentColor\"/> </svg> ", "icon-juridica": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"> <path d=\"M12 3L19.5 6V11C19.5 15.418 16.366 19.543 12 20.75C7.634 19.543 4.5 15.418 4.5 11V6L12 3Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> <path d=\"M9 12l2 2 4-4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/> </svg> ", "icon-busqueda": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><circle cx=\"11\" cy=\"11\" r=\"7\" stroke=\"currentColor\" stroke-width=\"1.5\"/><path d=\"M20 20l-4-4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "icon-solicitudes": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14 3v5h5M9 14h6M9 17h4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", "icon-acceso": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M4 21V8l8-5 8 5v13\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9 21v-7h6v7M4 12h16\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"};
  function img(n) { return SVGS[n]; }
  /* Menú del IVC real (suite-web-ivc) más la sección propia de Control de acceso. */
  var MENU = [
    { sec: 'Gestión', items: [
      { id: 'bandeja-coord', label: 'Bandeja', icon: img('icon-bandeja'), ph: 1 },
      { id: 'actos-coord', label: 'Aprobación de actos', icon: img('icon-actos'), ph: 1 }
    ] },
    { sec: 'Control de acceso', items: [
      { id: 'consulta', label: 'Búsqueda y nuevos casos', icon: img('icon-busqueda'), href: '#/control-acceso/consulta' },
      { id: 'infractores', label: 'Gestión de sanciones', icon: img('icon-acceso'), href: '#/control-acceso/infractores' },
      { id: 'solicitudes', label: 'Solicitudes', icon: img('icon-solicitudes'), href: '#/control-acceso/solicitudes' }
    ] },
    { sec: 'Configuración', items: [{ id: 'equipo-coord', label: 'Usuarios y áreas', icon: img('icon-equipo'), ph: 1 }] },
    { sec: 'Operación', items: [{ id: 'bandeja-prof', label: 'Mi bandeja', icon: img('icon-bandeja'), ph: 1 }] },
    { sec: 'Dirección', items: [
      { id: 'bandeja-director', label: 'Por firmar', icon: img('icon-firmar'), ph: 1 },
      { id: 'perfil-director', label: 'Mi firma', icon: img('icon-firma'), ph: 1 }
    ] },
    { sec: 'Atención al usuario', items: [{ id: 'bandeja-atu', label: 'Por notificar', icon: img('icon-notificar'), ph: 1 }] },
    { sec: 'Comunicaciones', items: [{ id: 'bandeja-git', label: 'Avisos', icon: img('icon-avisos'), ph: 1 }] },
    { sec: 'Jurídica', items: [{ id: 'bandeja-jur', label: 'Apelaciones', icon: img('icon-juridica'), ph: 1 }] }
  ];

  var SUID = w.SUID = {
    views: {},
    user: { name: 'Marcela Ortiz', initials: 'MO', role: 'IVC' },
    open: {},
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    icons: I
  };

  function routeInfo() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    return { path: parts.join('/'), parts: parts };
  }

  function renderSidebar(active) {
    var html = '<div class="sidebar-logo suid-logo">' +
      '<a class="suid-logo__back" href="../index.html" aria-label="Volver">' + I.back + '</a>' +
      '<img src="login/img/ministerio.svg" alt="Ministerio del Deporte" class="suid-logo__img"><div class="logo-sep"></div>' +
      '<span class="sb-logo-img sb-logo-img--pill" title="Inspección, Vigilancia y Control">IVC</span></div>' +
      '<nav class="sidebar-nav" role="navigation" aria-label="Menú principal">';
    MENU.forEach(function (s) {
      html += '<div class="nav-section">' + SUID.esc(s.sec) + '</div>';
      s.items.forEach(function (it) {
        var kids = it.children;
        var isOpen = kids && SUID.open[it.id];
        var isActive = it.id === active.parent || it.id === active.item;
        var href = kids ? '#' : (it.href || '#');
        /* Fuera de la demo se ve igual que los demás, pero sin href: el clic no hace nada. */
        var off = it.ph ? ' role="link" aria-disabled="true"' : ' href="' + href + '"';
        html += '<a class="nav-row' + (it.ph ? ' is-inert' : '') + (isActive ? ' is-active' : '') + '"' + off + ' data-id="' + it.id + '"' + (kids ? ' data-toggle="1"' : '') + '>' +
          (isActive ? '<div class="active-bar"></div>' : '') +
          '<div class="icon">' + it.icon + '</div><span class="lbl">' + SUID.esc(it.label) + '</span>' +
          (kids ? '<span class="nav-row__chev">' + (isOpen ? I.chevD : I.chevR) + '</span>' : '') + '</a>';
        if (kids && isOpen) {
          kids.forEach(function (k) {
            var act = k.id === active.item;
            html += '<a class="nav-sub' + (act ? ' is-active' : '') + '" href="' + (k.ph ? '#/en-construccion/' + k.id : k.href) + '">' + SUID.esc(k.label) + '</a>';
          });
        }
      });
    });
    // Publicado dentro del SVN (/ivc/), cerrar sesión vuelve al inicio del sitio; suelto, al login.
    var salida = /\/ivc\//.test(location.pathname) ? location.pathname.replace(/\/ivc\/.*$/, '/index.html') : '../index.html';
    html += '</nav><div class="sidebar-bottom"><a class="nav-row" href="' + salida + '"><div class="icon">' + I.out + '</div><span class="lbl">Cerrar sesión</span></a></div>';
    d.getElementById('sidebar').innerHTML = html;
    d.querySelectorAll('#sidebar [data-toggle]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var id = a.getAttribute('data-id');
        SUID.open[id] = !SUID.open[id];
        renderSidebar(active);
      });
    });
  }

  function renderHeader(crumbs) {
    var bc = crumbs.map(function (c, i) {
      var last = i === crumbs.length - 1;
      return (c.href && !last ? '<a href="' + c.href + '">' + SUID.esc(c.label) + '</a>' : '<span class="' + (last ? 'is-current' : '') + '">' + SUID.esc(c.label) + '</span>') +
        (last ? '' : '<span class="suid-bc__sep">' + I.chevR + '</span>');
    }).join('');
    d.getElementById('topHeader').innerHTML =
      '<nav class="suid-bc" aria-label="Migas de pan">' + bc + '</nav>' +
      '<div class="top-header__right">' +
        '<button class="suid-bell" type="button" aria-label="Notificaciones">' + I.bell + '</button>' +
        '<div class="suid-avatar"><span class="suid-avatar__ring">' + SUID.user.initials + '</span>' + I.chevD + '</div>' +
      '</div>';
  }

  var tok = 0;
  /* quiet: re-pintado tras una acción (sin esqueleto). La navegación sí pasa por el estado de carga. */
  function render(quiet) {
    var r = routeInfo();
    var view = d.getElementById('view');
    var match = null;
    Object.keys(SUID.views).sort(function (a, b) { return b.length - a.length; }).some(function (k) {
      if (r.path === k || r.path.indexOf(k + '/') === 0) { match = k; return true; }
    });
    /* Sin ruta: inicio en blanco con la marca de agua del IVC (DC-001). */
    var inicio = !r.path;
    var ctx = { route: r, rest: match ? r.path.slice(match.length).replace(/^\//, '').split('/').filter(Boolean) : [] };
    var ITEM = { 'control-acceso/consulta': 'consulta', 'control-acceso/solicitudes': 'solicitudes' };
    /* Registrar, editar, carga masiva y la ficha son acciones de Gestión, no ítems del menú. */
    renderSidebar({ parent: '', item: match ? (ITEM[match] || 'infractores') : '' });

    function pinta() {
      if (inicio) {
        view.innerHTML = '<div class="suid-home"><h1 class="sk-sr">Inicio</h1><span class="suid-home__wm" aria-hidden="true">IVC</span></div>';
        ctx.crumbs = [{ label: 'Inicio' }];
      } else if (match) {
        SUID.views[match](view, ctx);
      } else {
        view.innerHTML = '<div class="page-inner suid-ph"><h1 class="page-title">En construcción</h1>' +
          '<p class="page-subtitle">Esta bandeja del IVC queda fuera de la demo. El trabajo está en Gestión de infractores.</p>' +
          '<a class="naowee-btn naowee-btn--loud" href="#/control-acceso/infractores">Ir a Gestión de infractores</a></div>';
        ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'En construcción' }];
      }
      view.scrollTop = 0;
      renderHeader(ctx.crumbs || [{ label: 'Inicio', href: '#/' }]);
    }

    var mine = ++tok, L = SUID.load;
    var ms = quiet === true || !L || inicio ? 0 : L.delay(match, ctx);
    if (!ms) { pinta(); return; }
    var cr = L.crumbs(match, ctx);
    renderHeader(cr);
    view.scrollTop = 0;
    L.begin(view, match, ctx, ms);
    setTimeout(function () {
      if (mine !== tok) return;
      L.end(view);
      pinta();
    }, ms);
  }

  SUID.start = function () {
    w.addEventListener('hashchange', function () { render(false); });
    render(false);
  };
  SUID.render = function () { render(true); };
})(window, document);
