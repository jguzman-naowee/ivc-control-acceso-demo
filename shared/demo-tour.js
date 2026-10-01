/* ═══════════════════════════════════════════════════════════════════
   demo-tour.js — Tour guiado paso-a-paso para el prototipo IVC.

   Puerto vanilla del demo-tour.js v2.0 del Naowee Project.
   State machine REACTIVA — escucha 'naowee:ivc:state-change' y avanza
   automáticamente al step que corresponde al estado actual del trámite.

   API:
     Tour.mount({ pageId })  → singleton, lee estado y muestra step relevante
     Tour.close()            → oculta el tour (persiste hasta Restart o reset)
     Tour.restart()          → vuelve a mostrar el step actual
     Tour.refresh()          → re-evalúa el step aplicable

   Sigue el DS Naowee:
   - Overlay oscurece el fondo
   - Spotlight con border + box-shadow pulsante sobre el target
   - Card-tooltip con .naowee-card pattern (title + body + footer)
  ═══════════════════════════════════════════════════════════════════ */

(function (window, document) {
  'use strict';

  var TOUR_DEBOUNCE_MS = 150;
  /* TOTAL_STEPS sigue siendo 8 (numeración pública). El step 2 ahora tiene
     dos sub-pasos visuales (2a / 2b) que comparten el mismo stepIndex 2
     pero apuntan a targets distintos según el wizardStep actual. — v1.1.4 #4 */
  var TOTAL_STEPS = 8;

  /* ───── Definición de los 8 steps de Fase 1 ─────
     Schema:
     - id           → identificador único
     - stepIndex    → número visible (Paso X de 8)
     - title        → título del tooltip
     - body         → cuerpo del tooltip
     - target       → selector CSS del elemento a destacar (o null para center)
     - position     → 'top' | 'bottom' | 'left' | 'right' | 'center'
     - pages        → [rutas relativas] donde el step DEBE renderizarse
     - pageHint     → ruta relativa al CTA secundario "Ir a X"
     - pageHintLabel→ texto del CTA secundario
     - applicable   → (state) => boolean : true si el step corresponde al estado actual
  */
  function getSteps() {
    return [
      {
        id: 'iniciar-tramite',
        stepIndex: 1,
        title: 'Inicia tu primer Otorgamiento',
        body: 'Como Liga Deportiva, vas a radicar tu trámite de Otorgamiento de Reconocimiento Deportivo. Da click en "Nuevo trámite" para comenzar.',
        target: '[data-tour="nuevo-tramite"]',
        position: 'bottom',
        pages: ['usuario-externo/dashboard.html'],
        applicable: function (s) {
          return s.perfil === 'usuario-externo' && (!s.tramite || !s.tramite.radicado && s.tramite.estado !== 'Borrador');
        }
      },
      /* v1.1.4 #4 — Step 2a: usuario está en wizardStep 1 (Datos generales).
         El target visible es el stepper del wizard. ANTES el step apuntaba a
         `[data-tour="docs-decreto-1387"]` que está dentro de wizard step 2
         (hidden al cargar), lo que causaba tooltip en top-left sin spotlight. */
      {
        id: 'wizard-stepper-overview',
        stepIndex: 2,
        title: 'El wizard tiene 3 pasos',
        body: 'Datos generales → Documentos (Decreto 1387/1970, Art. 2.1.1.2 — 7 documentos) → Confirmación. Diligencia los datos del organismo y avanza al paso de Documentos.',
        target: '[data-tour="wizard-stepper"]',
        position: 'bottom',
        pages: ['usuario-externo/nuevo-tramite.html'],
        pageHint: 'usuario-externo/nuevo-tramite.html',
        pageHintLabel: 'Ir al wizard',
        applicable: function (s) {
          return s.perfil === 'usuario-externo'
            && s.tramite && !s.tramite.radicado
            && s.tramite.estado === 'Borrador'
            && s.wizardStep === 1;
        }
      },
      /* v1.1.4 #4 — Step 2b: usuario avanzó a wizardStep 2 (Documentos).
         Ahora sí el target [data-tour="docs-decreto-1387"] es visible. */
      {
        id: 'cargar-documentos',
        stepIndex: 2,
        title: 'Carga los 7 documentos del Decreto 1387/1970',
        body: 'El Artículo 2.1.1.2 exige 7 documentos: acta de constitución, lista de afiliados, estatutos, personería jurídica, afiliación internacional, inventario de bienes, y acta de designación de sede.',
        target: '[data-tour="docs-decreto-1387"]',
        position: 'right',
        pages: ['usuario-externo/nuevo-tramite.html'],
        pageHint: 'usuario-externo/nuevo-tramite.html',
        pageHintLabel: 'Ir al wizard',
        applicable: function (s) {
          return s.perfil === 'usuario-externo'
            && s.tramite && !s.tramite.radicado
            && s.tramite.estado === 'Borrador'
            && s.wizardStep >= 2;
        }
      },
      {
        id: 'tramite-radicado',
        stepIndex: 3,
        title: 'Trámite radicado con éxito',
        body: 'Tu radicado es IVC-2026-001. El Ministerio tiene 15 días hábiles para responder. Puedes hacer seguimiento desde el detalle del trámite.',
        target: '[data-tour="numero-radicado"]',
        position: 'bottom',
        pages: ['usuario-externo/tramite-detalle.html'],
        applicable: function (s) {
          return s.perfil === 'usuario-externo'
            && s.tramite && s.tramite.estado === 'Radicado';
        }
      },
      {
        id: 'cambiar-a-profesional',
        stepIndex: 4,
        title: 'Cambia al perfil Profesional IVC',
        body: 'Ahora simulemos al Profesional del Ministerio que va a validar tu trámite. Usa el chip "DEMO · Cambiar perfil" abajo a la derecha para cambiar de rol.',
        target: '#demoSwitcherToggle',
        position: 'top',
        pages: ['usuario-externo/tramite-detalle.html'],
        applicable: function (s) {
          return s.perfil === 'usuario-externo'
            && s.tramite && s.tramite.estado === 'Radicado'
            && s.tourAdvanced; /* Solo aparece después de cerrar el step 3 */
        }
      },
      /* v1.2.0 — Fase 2 Sprint 1: Steps 5-8 ahora son reactivos (HU-3/HU-4/HU-6) */
      {
        id: 'bandeja-coordinador',
        stepIndex: 5,
        title: 'Bandeja del Coordinador',
        body: 'Como Coordinadora de área, asignas las solicitudes radicadas a los profesionales disponibles. Puedes asignar individualmente o en masa. (HU-3)',
        target: '[data-tour="asignacion-masiva"], [data-tour="bandeja-coord"]',
        position: 'bottom',
        pages: ['coordinador/bandeja.html'],
        pageHint: 'coordinador/bandeja.html',
        pageHintLabel: 'Ir a la bandeja',
        applicable: function (s) {
          return s.perfil === 'coordinador';
        }
      },
      {
        id: 'workspace-profesional',
        stepIndex: 6,
        title: 'Workspace del Profesional',
        body: 'Como Profesional, revisas los 7 documentos del Decreto 1387 y marcas cada uno como Cumple, Observación o No cumple. (HU-4/HU-6)',
        target: '[data-tour="checklist-documentos"]',
        position: 'right',
        pages: ['profesional/workspace.html'],
        pageHint: 'profesional/workspace.html',
        pageHintLabel: 'Ir al workspace',
        applicable: function (s) {
          return s.perfil === 'profesional' && (!s.tramite || s.tramite.decision !== 'NoCumple') && (!s.tramite || s.tramite.decision !== 'Cumple');
        }
      },
      {
        id: 'decision-profesional',
        stepIndex: 7,
        title: 'Decisión del trámite',
        body: 'Una vez validados los documentos, decide: Cumple totalmente, Cumplimiento parcial, o No cumple. Cumple/No cumple generan automáticamente el Acto Administrativo.',
        target: '[data-tour="botones-decision"]',
        position: 'top',
        pages: ['profesional/workspace.html'],
        applicable: function (s) {
          return s.perfil === 'profesional' && s.tramite && (s.tramite.docsValidados || 0) >= 5 && !s.tramite.decision;
        }
      },
      {
        id: 'acto-generado',
        stepIndex: 8,
        title: 'Acto administrativo generado',
        body: 'El sistema generó automáticamente la numeración consecutiva y fecha. El acto queda almacenado en el trámite y será firmado por el Director (Fase 3).',
        target: '[data-tour="acto-preview"], #demoSwitcherToggle',
        position: 'center',
        pages: ['profesional/workspace.html'],
        applicable: function (s) {
          return s.perfil === 'profesional' && s.tramite && (s.tramite.decision === 'Cumple' || s.tramite.decision === 'NoCumple');
        }
      }
    ];
  }

  /* ───── State builder ───── */
  function buildState() {
    var baseTramite = window.IVCData.getTramite() || {};
    /* v1.2.0 — Merge tramiteFocal del Profesional (HU-4/HU-6) en el tramite
       que el tour lee. Así s.tramite.decision y s.tramite.docsValidados están
       disponibles para los Steps 6/7/8 applicable functions. */
    var focal = (window.IVCData.getTramiteFocalState && window.IVCData.getTramiteFocalState()) || {};
    var mergedTramite = Object.assign({}, baseTramite, focal);
    return {
      perfil: window.IVCData.getPerfil(),
      tramite: (Object.keys(baseTramite).length === 0 && Object.keys(focal).length === 0) ? null : mergedTramite,
      /* v1.1.4 #4 — wizardStep para discriminar Step 2 / 2b */
      wizardStep: (window.IVCData.getWizardStep && window.IVCData.getWizardStep()) || 1,
      tourAdvanced: localStorage.getItem('naowee.ivc.tourAdvanced') === '1'
    };
  }

  /* ───── Current page detector ───── */
  function currentRelativePage() {
    var parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return parts.slice(-2).join('/');
    return parts.pop() || '';
  }

  function stepMatchesCurrentPage(step) {
    if (!step.pages || step.pages.length === 0) return false; /* stubs Fase 2 — no render */
    var here = currentRelativePage();
    /* Permite también index.html sin subdir */
    return step.pages.some(function (p) {
      return p === here || p.replace(/^[^/]+\//, '') === here;
    });
  }

  function pickActiveStep() {
    var state = buildState();
    var steps = getSteps();
    var stateStep = steps.find(function (s) { return s.applicable(state); });
    if (!stateStep) return null;
    if (!stepMatchesCurrentPage(stateStep)) return null;
    return stateStep;
  }

  /* ───── DOM ───── */
  var _overlay = null;
  var _pendingTimer = null;

  function mountTourElements() {
    if (_overlay) return _overlay;
    _overlay = document.createElement('div');
    _overlay.className = 'demo-tour-overlay';
    _overlay.id = 'demoTourOverlay';
    _overlay.setAttribute('aria-hidden', 'true');
    _overlay.innerHTML =
      '<div class="demo-tour-spotlight" data-spotlight></div>' +
      '<div class="demo-tour-tooltip" role="dialog" aria-labelledby="demoTourTitle" data-tooltip>' +
        '<div class="demo-tour-tooltip__head">' +
          '<span class="demo-tour-tooltip__step" data-step-label>Paso 1 de ' + TOTAL_STEPS + '</span>' +
          '<button type="button" class="demo-tour-tooltip__close" data-close aria-label="Cerrar tour">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<h3 class="demo-tour-tooltip__title" id="demoTourTitle" data-title>—</h3>' +
        '<p class="demo-tour-tooltip__body" data-body>—</p>' +
        '<div class="demo-tour-tooltip__footer">' +
          '<a class="naowee-btn naowee-btn--quiet naowee-btn--small" href="#" data-page-hint hidden>—</a>' +
          '<button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-action-primary>Entendido</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(_overlay);
    _overlay.querySelector('[data-close]').addEventListener('click', close);
    return _overlay;
  }

  /* ───── Positioning ───── */
  function positionTooltip(target, position) {
    if (!_overlay) return;
    var tooltip = _overlay.querySelector('[data-tooltip]');
    var spotlight = _overlay.querySelector('[data-spotlight]');

    if (!target) {
      /* Sin target: centro de la pantalla */
      spotlight.style.display = 'none';
      tooltip.style.position = 'fixed';
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      tooltip.style.right = '';
      tooltip.style.bottom = '';
      return;
    }

    spotlight.style.display = '';
    tooltip.style.transform = '';

    var rect = target.getBoundingClientRect();
    var PAD = 8;
    spotlight.style.top    = (rect.top    - PAD) + 'px';
    spotlight.style.left   = (rect.left   - PAD) + 'px';
    spotlight.style.width  = (rect.width  + PAD * 2) + 'px';
    spotlight.style.height = (rect.height + PAD * 2) + 'px';

    var tipW = tooltip.offsetWidth || 360;
    var tipH = tooltip.offsetHeight || 200;
    var GAP = 16;

    /* Heurística: respetar 'top' siempre; 'bottom' cae a top si no cabe */
    var pos = position || 'bottom';
    var top, left;

    if (pos === 'top') {
      top = rect.top - tipH - GAP;
      left = rect.left + rect.width / 2 - tipW / 2;
    } else if (pos === 'left') {
      top = rect.top + rect.height / 2 - tipH / 2;
      left = rect.left - tipW - GAP;
    } else if (pos === 'right') {
      top = rect.top + rect.height / 2 - tipH / 2;
      left = rect.right + GAP;
    } else {
      /* bottom (default) */
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - tipW / 2;
      /* Si no cabe abajo, mover arriba */
      if (top + tipH > window.innerHeight - 16) {
        top = rect.top - tipH - GAP;
      }
    }

    /* Clamp dentro del viewport */
    if (left < 16) left = 16;
    if (left + tipW > window.innerWidth - 16) left = window.innerWidth - tipW - 16;
    if (top < 16) top = 16;
    if (top + tipH > window.innerHeight - 16) top = window.innerHeight - tipH - 16;

    tooltip.style.position = 'fixed';
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  /* ───── Render del step ───── */
  function renderStep(step) {
    if (!_overlay) return;
    if (!step) {
      _overlay.classList.remove('is-open');
      _overlay.setAttribute('aria-hidden', 'true');
      return;
    }

    _overlay.classList.add('is-open');
    _overlay.setAttribute('aria-hidden', 'false');

    _overlay.querySelector('[data-step-label]').textContent = 'Paso ' + step.stepIndex + ' de ' + TOTAL_STEPS;
    _overlay.querySelector('[data-title]').textContent = step.title;
    _overlay.querySelector('[data-body]').textContent = step.body;

    /* Page hint */
    var hint = _overlay.querySelector('[data-page-hint]');
    if (step.pageHint && step.pageHintLabel) {
      hint.textContent = step.pageHintLabel;
      hint.href = pathPrefix() + step.pageHint;
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }

    /* Resolver target — soporta selectores múltiples separados por coma */
    var target = null;
    if (step.target) {
      var selectors = step.target.split(',').map(function (s) { return s.trim(); });
      for (var i = 0; i < selectors.length; i++) {
        target = document.querySelector(selectors[i]);
        if (target) break;
      }
    }
    positionTooltip(target, step.position);

    /* CTA primario: "Entendido" cierra temporalmente para que el usuario actúe.
       Si es el último step (acto-generado), cierra el tour. */
    var btn = _overlay.querySelector('[data-action-primary]');
    if (step.id === 'acto-generado') {
      btn.textContent = 'Cerrar tour';
      btn.onclick = close;
    } else if (step.id === 'tramite-radicado') {
      btn.textContent = 'Continuar';
      btn.onclick = function () {
        /* Marca tourAdvanced para que aparezca el step 4 (cambiar a profesional) */
        try { localStorage.setItem('naowee.ivc.tourAdvanced', '1'); } catch (e) {}
        _overlay.classList.remove('is-open');
        refresh();
      };
    } else {
      btn.textContent = 'Entendido';
      btn.onclick = function () {
        /* Acknowledge: oculta temporalmente para que el usuario actúe */
        _overlay.classList.remove('is-open');
      };
    }
  }

  /* ───── Path prefix (igual que shell.js) ───── */
  function pathPrefix() {
    /* v1.12.6: agregados atu|git|juridica — sync con shell.js#inSubdir. */
    var inSub = /\/(usuario-externo|profesional|coordinador|director|atu|git|juridica)\//.test(location.pathname);
    return inSub ? '../' : '';
  }

  /* ───── Refresh (debounced) ───── */
  function refresh() {
    clearTimeout(_pendingTimer);
    _pendingTimer = setTimeout(function () {
      if (window.IVCData.isTourClosed()) {
        if (_overlay) _overlay.classList.remove('is-open');
        return;
      }
      var step = pickActiveStep();
      renderStep(step);
    }, TOUR_DEBOUNCE_MS);
  }

  function close() {
    window.IVCData.setTourClosed(true);
    if (_overlay) _overlay.classList.remove('is-open');
  }

  function restart() {
    window.IVCData.setTourClosed(false);
    try { localStorage.removeItem('naowee.ivc.tourAdvanced'); } catch (e) {}
    refresh();
  }

  /* ───── Mount ───── */
  function mount(_opts) {
    if (typeof window === 'undefined') return;
    mountTourElements();

    /* Reactividad: escuchar cambios de state desde data.js */
    window.addEventListener('naowee:ivc:state-change', refresh);

    /* Cross-tab: cambios en localStorage en otra pestaña */
    window.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf('naowee.ivc.') === 0) refresh();
    });

    /* Resize: reposicionar tooltip */
    window.addEventListener('resize', function () {
      var step = pickActiveStep();
      if (!step) return;
      var target = step.target ? document.querySelector(step.target.split(',')[0].trim()) : null;
      positionTooltip(target, step.position);
    });

    /* Scroll: reposicionar (solo si tour está visible) */
    var scrollHandler = function () {
      if (!_overlay || !_overlay.classList.contains('is-open')) return;
      var step = pickActiveStep();
      if (!step) return;
      var target = step.target ? document.querySelector(step.target.split(',')[0].trim()) : null;
      positionTooltip(target, step.position);
    };
    window.addEventListener('scroll', scrollHandler, true);

    /* Render inicial — esperar al DOM */
    setTimeout(refresh, 250);
  }

  window.IVCTour = {
    mount: mount,
    close: close,
    restart: restart,
    refresh: refresh
  };

})(window, document);
