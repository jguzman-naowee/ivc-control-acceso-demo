/* ═══════════════════════════════════════════════════════════════════════
   Naowee Floating Footer — Mounter (v1.4.9, 2026-05-23)

   Inyecta el footer flotante canónico en el body. Patrón compartido con
   Naowee Project v2.0.3 (shared/shell.js L544+).

   Uso (en cualquier HTML del prototype):
     <link rel="stylesheet" href="../shared/naowee-footer.css">
     <script src="../shared/naowee-footer.js" defer></script>

   Para HTMLs standalone (sin shared/), inyectarlo inline — copiar este
   IIFE completo dentro de un <script>.

   Para bumpear versión: cambiar IVC_VERSION abajo y rebuild.
   ═══════════════════════════════════════════════════════════════════════ */

(function mountNaoweeFooter() {
  var IVC_VERSION = 'v1.13.57';
  var REPO = 'naowee-tech/naowee-ivc';
  var MODULE_NAME = 'IVC';

  function pathPrefix() {
    /* Computa el prefijo relativo para que el <img src> resuelva tanto en
       file:// como en GitHub Pages. Si estamos en /prototype/<role>/file.html
       el logo vive en /prototype/shared/logos/naowee.svg → 2 niveles arriba. */
    var path = window.location.pathname;
    /* coordinador/, profesional/, usuario-externo/ → ../shared/ */
    if (/\/(coordinador|profesional|usuario-externo|director|juridica|atu|git)\/[^/]*$/.test(path)) {
      return '../shared/';
    }
    /* fallback: si estamos en /prototype/file.html o /shared/file.html */
    if (/\/shared\/[^/]*$/.test(path)) return './';
    return 'prototype/shared/';
  }

  function mount() {
    if (document.querySelector('.naowee-floating-footer')) return;

    var RELEASE_URL = 'https://github.com/' + REPO + '/releases/tag/ivc-' + IVC_VERSION;
    var YEAR = new Date().getFullYear();
    var LOGO_SRC = pathPrefix() + 'logos/naowee.svg';

    var footer = document.createElement('div');
    footer.className = 'naowee-floating-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.setAttribute('aria-label', 'Pie de página Naowee');
    footer.innerHTML =
      '<img src="' + LOGO_SRC + '" alt="Naowee" class="naowee-floating-footer__logo" onerror="this.style.display=\'none\'"/>' +
      '<div class="naowee-floating-footer__sep"></div>' +
      '<span class="naowee-floating-footer__text">Todos los derechos reservados <strong>&copy; ' + YEAR + '</strong></span>' +
      '<div class="naowee-floating-footer__sep"></div>' +
      '<a class="naowee-floating-footer__version" ' +
         'href="' + RELEASE_URL + '" target="_blank" rel="noopener" ' +
         'title="' + MODULE_NAME + ' ' + IVC_VERSION + ' — Ver release notes en GitHub" ' +
         'aria-label="Versión del prototipo: ' + IVC_VERSION + '">' +
        MODULE_NAME + ' <strong>' + IVC_VERSION + '</strong>' +
      '</a>';
    document.body.appendChild(footer);
    bindFooterScrollHide(footer);
  }

  /* Patrón scroll-hide del Project v2.0.3 — esconde el footer al scroll
     down y lo vuelve a mostrar al scroll up.

     v1.13.49 (Doug 27/05/2026): scroll events NO bubble, pero SÍ se pueden
     capturar en phase=capture sobre document. Esto cubre el caso real de
     IVC donde `.page` es el scroll host (creado dinámicamente por shell.js)
     y también fallback a window si no hubiera `.page`. Es robusto frente
     al timing de inicialización porque no depende de query inicial. */
  function bindFooterScrollHide(footer) {
    var lastY = 0;
    var ticking = false;

    function getY() {
      var page = document.querySelector('.page');
      return page ? page.scrollTop : (window.scrollY || document.documentElement.scrollTop);
    }

    /* Init lastY tras un microtask para que `.page` ya exista. */
    setTimeout(function () { lastY = getY(); }, 0);

    function update() {
      var y = getY();
      var dy = y - lastY;
      if (Math.abs(dy) > 4) {
        if (dy > 0 && y > 60) {
          footer.classList.add('is-hidden');
        } else {
          footer.classList.remove('is-hidden');
        }
        lastY = y;
      }
      ticking = false;
    }

    /* capture:true permite captar scroll events de CUALQUIER descendant
       (scroll NO bubble en phase normal). Pasamos by-pass para que aplique
       sea quien sea el host. */
    document.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true, capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
