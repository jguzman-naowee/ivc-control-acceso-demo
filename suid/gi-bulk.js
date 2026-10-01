/* Carga masiva (HU-26.3) como asistente de 6 pasos, uno por pantalla; la validación de filas es la de siempre. */
(function (w, d) {
  'use strict';
  var GI = w.GI, U = GI.util, UI = w.GIUI, esc = SUID.esc;
  var BASE = UI.BASE, TOTAL = 6;

  /* Simulación: el archivo "cargado" trae 12 filas, con errores típicos para mostrar el reporte. */
  var FILAS = [
    ['1', 'CC', '1010100111', 'Mateo Andrés Rojas', 'RES-0402-2026', '2026-09-03', '18', ''],
    ['2', 'CC', '1010100112', 'Laura Sofía Pineda', 'RES-0403-2026', '2026-09-03', '24', ''],
    ['3', 'CC', '', 'Jhon Alexander Peña', 'RES-0404-2026', '2026-09-04', '12', 'Número de identificación vacío.', 'num'],
    ['4', 'TI', '1020200113', 'Samuel Gil Ortega', 'RES-0405-2026', '2026-09-05', '12', 'Infractor menor de edad sin representante legal.', 'rep'],
    ['5', 'CC', '1010100114', 'Valeria Ocampo Díaz', 'RES-0406-2026', '2026-09-05', '4', 'Tiempo de sanción menor a 6 meses.', 'meses'],
    ['6', 'CE', '7040400115', 'Óscar Iván Mora', 'RES-0407-2026', '2026-09-08', '30', ''],
    ['7', 'CC', '1010100116', 'Karen Julieth Soto', 'RES-0408-2026', '2026-09-30', '12', 'La ejecutoria es posterior a la fecha de registro.', 'fecha'],
    ['8', 'CC', '1010100001', 'Andrés Felipe Ramírez Cuesta', 'RES-0148-2026', '2026-03-10', '24', 'Duplicado de INF-2026-0001 (misma persona, acto y ejecutoria).', 'dup'],
    ['9', 'CC', '1010100118', 'Brayan Stiven León', '', '2026-09-09', '20', 'Falta el número del acto administrativo.', 'acto'],
    ['10', 'PA', '1010100119', 'Diana Marcela Cruz', 'RES-0410-2026', '2026-09-10', '15', 'Tipo de identificación "PA" no existe en el catálogo.', 'tipo'],
    ['11', 'CC', '1010100120', 'Felipe Nieto Salazar', 'RES-0411-2026', '2026-09-11', '36', ''],
    ['12', 'CC', '1010100121', 'Adriana Lucía Pacheco', 'RES-0412-2026', '2026-09-12', '48', '']
  ];
  var LIMPIO = FILAS.filter(function (r) { return !r[7]; });
  /* Qué dato corrige cada tipo de error; "dup" solo se puede excluir. */
  var FIX = {
    num: { lbl: 'Número de identificación', ph: 'Solo dígitos', ok: function (v) { return /^\d{6,12}$/.test(v) ? '' : 'Escribe entre 6 y 12 dígitos.'; } },
    rep: { lbl: 'Documento del representante legal', ph: 'Solo dígitos', ok: function (v) { return /^\d{6,12}$/.test(v) ? '' : 'Escribe entre 6 y 12 dígitos.'; } },
    meses: { lbl: 'Tiempo de sanción (meses)', ph: 'Mínimo 6', ok: function (v) { return +v >= 6 && +v <= 120 ? '' : 'El mínimo es 6 meses.'; } },
    fecha: { lbl: 'Fecha de ejecutoria', type: 'date', ok: function (v) { return v && v < U.today() ? '' : 'Debe ser anterior a hoy.'; } },
    acto: { lbl: 'Número del acto administrativo', ph: 'RES-0000-2026', ok: function (v) { return /^[A-Za-z]+-\d+-\d{4}$/.test(v) ? '' : 'Usa el formato RES-0000-2026.'; } },
    tipo: { lbl: 'Tipo de identificación', sel: ['CC', 'CE', 'TI', 'Pasaporte', 'PPT', 'PEP', 'RUMV'], ok: function (v) { return v ? '' : 'Elige un tipo.'; } }
  };
  var PASOS = [
    { t: 'Descarga la plantilla', l: 'La plantilla trae los 55 campos del registro, con los catálogos y las reglas del diccionario de datos.', next: 'Ya la tengo' },
    { t: 'Sube el archivo diligenciado', l: 'Formato .xlsx con la base de sancionatorios. En esta demo se simula la lectura de 12 filas.', next: 'Validar archivo' },
    { t: 'Validamos tu archivo', l: 'Revisamos estructura, obligatoriedad y consistencia fila por fila.', next: 'Ver errores' },
    { t: 'Corrige o excluye las filas con error', l: 'Cada fila con error se corrige aquí o se deja fuera de la carga. Las filas sin error no se tocan.', next: 'Continuar' },
    { t: 'Confirma la importación', l: 'Revisa el resumen. Cada fila importada queda en estado Recibido.', next: 'Importar' },
    { t: 'Carga terminada', l: '', next: '' }
  ];

  function open(view, ctx) {
    ctx.crumbs = [{ label: 'Inicio', href: '#/' }, { label: 'Control de acceso' }, { label: 'Gestión', href: BASE }, { label: 'Carga masiva' }];
    var S = { paso: 1, nombre: '', filas: null, progreso: 0, validado: false, dec: {}, abierto: null, conf: false, timer: null };

    function malas() { return S.filas.filter(function (r) { return r[7]; }); }
    function buenas() { return S.filas.filter(function (r) { return !r[7]; }); }
    function pendientes() { return malas().filter(function (r) { return !S.dec[r[0]] || S.dec[r[0]].est === 'pend'; }).length; }
    function corregidas() { return malas().filter(function (r) { return S.dec[r[0]] && S.dec[r[0]].est === 'fix'; }).length; }
    function excluidas() { return malas().filter(function (r) { return S.dec[r[0]] && S.dec[r[0]].est === 'excl'; }).length; }
    function aImportar() { return buenas().length + corregidas(); }
    function hayAvance() { return S.paso > 1 && S.paso < TOTAL; }
    function listo() {
      if (S.paso === 2) return !!S.filas;
      if (S.paso === 3) return S.validado;
      if (S.paso === 4) return pendientes() === 0;
      if (S.paso === 5) return S.conf && aImportar() > 0;
      return true;
    }

    function salir() {
      if (!hayAvance()) { location.hash = BASE.slice(1); return; }
      var m = UI.modal({ title: '¿Salir de la carga masiva?', sub: 'Paso ' + S.paso + ' de ' + TOTAL,
        body: '<p class="gi-p">Perderás el avance de esta carga: el archivo, la validación y las correcciones. Nada se ha importado todavía.</p>',
        footer: '<button class="naowee-btn naowee-btn--mute" data-x>Seguir aquí</button><button class="naowee-btn naowee-btn--loud" id="bkOut">Salir y descartar</button>' });
      m.el.querySelector('#bkOut').addEventListener('click', function () { m.close(); location.hash = BASE.slice(1); });
    }

    function cuerpo() {
      var p = S.paso;
      if (p === 1) return '<div class="gb-panel"><button type="button" class="naowee-btn naowee-btn--loud gb-btn" id="bkTpl">' + UI.svg('dl') + ' Descargar plantilla (.xlsx)</button>' +
        '<p class="gi-help" style="font-size:14px">Plantilla_sancionatorios_v2.xlsx · 55 campos · catálogos incluidos</p></div>';
      if (p === 2) {
        if (S.filas) return '<div class="gb-panel"><div class="gi-file" style="width:100%">' + UI.svg('file') + '<div><strong>' + esc(S.nombre) + '</strong><small>' + S.filas.length + ' filas leídas</small></div></div>' +
          '<button type="button" class="naowee-btn naowee-btn--mute gb-btn" id="bkOtro">Elegir otro archivo</button></div>';
        return '<div class="gb-drop" id="bkDrop"><div class="gi-drop__ico">' + UI.svg('upload') + '</div><strong>Arrastra el archivo aquí</strong><span>o</span>' +
          '<button type="button" class="naowee-btn naowee-btn--loud gb-btn" id="bkPick">Seleccionar archivo</button><small>.xlsx · máximo 5 MB</small>' +
          '<input type="file" id="bkFileIn" accept=".xlsx,.xls,.csv" hidden></div>' +
          '<div class="gb-ex"><span>Para la demo:</span><button type="button" id="bkExErr">Archivo con errores</button><button type="button" id="bkExOk">Archivo limpio</button></div>';
      }
      if (p === 3) {
        var n = Math.round(S.progreso * S.filas.length / 100);
        return '<div class="gb-panel"><div class="gb-meter"><div class="gb-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + S.progreso + '" aria-label="Avance de la validación"><i style="width:' + S.progreso + '%"></i></div>' +
          '<p>' + (S.validado ? 'Validación terminada' : 'Validando fila ' + Math.max(1, n) + ' de ' + S.filas.length + '…') + '</p></div>' +
          (S.validado ? '<div class="gb-bignum"><div><span>Filas leídas</span><strong>' + S.filas.length + '</strong></div><div><span>Listas para cargar</span><strong class="gi-good">' + buenas().length + '</strong></div><div><span>Con inconsistencias</span><strong class="gi-bad">' + malas().length + '</strong></div></div>' : '') + '</div>';
      }
      if (p === 4) {
        if (!malas().length) return '<div class="gb-panel gb-panel--center"><div class="gb-ok">' + UI.svg('check').replace('width="18" height="18"', 'width="34" height="34"') + '</div><strong style="font-size:18px">No hay errores que corregir</strong><span class="gi-help" style="font-size:14px">Las ' + S.filas.length + ' filas pasaron todas las validaciones.</span></div>';
        return '<div class="gb-errs">' + malas().map(function (r) {
          var dc = S.dec[r[0]] || { est: 'pend' }, f = FIX[r[8]], cls = dc.est === 'fix' ? ' is-fixed' : dc.est === 'excl' ? ' is-excl' : '';
          var estado = dc.est === 'fix' ? 'Corregida: ' + esc(dc.val) : dc.est === 'excl' ? 'Excluida de la carga' : esc(r[7]);
          var html = '<div class="gb-err' + cls + '" data-fila="' + r[0] + '"><div class="gb-err__head"><div><strong>Fila ' + r[0] + ' · ' + esc(r[3]) + '</strong><p>' + estado + '</p></div>' +
            '<div class="gb-err__btns">' + (f ? '<button type="button" data-a="fix" aria-pressed="' + (S.abierto === r[0] || dc.est === 'fix') + '">' + (dc.est === 'fix' ? 'Cambiar corrección' : 'Corregir') + '</button>' : '') +
            '<button type="button" data-a="excl" aria-pressed="' + (dc.est === 'excl') + '">' + (dc.est === 'excl' ? 'Incluir de nuevo' : 'Excluir fila') + '</button></div></div>';
          if (S.abierto === r[0] && f) {
            html += '<div class="gb-fix"><label>' + f.lbl + (f.sel ? '<select data-in><option value="">Selecciona</option>' + f.sel.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>'
              : '<input data-in type="' + (f.type || 'text') + '" placeholder="' + esc(f.ph || '') + '"' + (f.type === 'date' ? ' max="' + U.today() + '"' : '') + '>') + '</label>' +
              '<button type="button" class="naowee-btn naowee-btn--loud gb-btn" data-a="save">Guardar corrección</button><p class="gi-err" data-err hidden></p></div>';
          }
          return html + '</div>';
        }).join('') + '</div>';
      }
      if (p === 5) return '<div class="gb-panel"><ul class="gb-sum"><li><span>Archivo</span><strong>' + esc(S.nombre) + '</strong></li><li><span>Filas sin error</span><strong>' + buenas().length + '</strong></li>' +
        '<li><span>Filas corregidas</span><strong>' + corregidas() + '</strong></li><li><span>Filas excluidas</span><strong>' + excluidas() + '</strong></li>' +
        '<li><span>Se importarán</span><strong class="gi-good">' + aImportar() + '</strong></li></ul>' +
        '<label class="gb-check"><input type="checkbox" id="bkConf"' + (S.conf ? ' checked' : '') + '> Revisé el resumen y confirmo que estos registros pueden entrar en estado Recibido.</label></div>';
      return '<div class="gb-panel gb-panel--center"><div class="gb-ok">' + UI.svg('check').replace('width="18" height="18"', 'width="34" height="34"') + '</div><strong style="font-size:20px">' + aImportar() + ' registros importados en estado Recibido</strong>' +
        '<span class="gi-help" style="font-size:14px">' + (excluidas() ? excluidas() + (excluidas() === 1 ? ' fila quedó fuera;' : ' filas quedaron fuera;') + ' descarga el reporte para corregir y volver a subir. ' : '') + 'Demo: nada se guardó en la bandeja.</span>' +
        '<button type="button" class="naowee-btn naowee-btn--mute gb-btn" id="bkRep">' + UI.svg('dl') + ' Descargar reporte</button></div>';
    }

    function pinta(foco) {
      var p = S.paso, pct = Math.round(p * 100 / TOTAL), P = PASOS[p - 1];
      view.innerHTML = '<div class="page-inner gi-page gb-wiz">' +
        '<div class="gb-top"><div class="gb-prog"><div class="gb-prog__row"><span style="color:var(--text-primary)">Paso ' + p + ' de ' + TOTAL + '</span><span>' + pct + '%</span></div>' +
        '<div class="gb-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Paso ' + p + ' de ' + TOTAL + '"><i style="width:' + pct + '%"></i></div></div>' +
        '<button type="button" class="gb-exit" id="bkExit">' + UI.svg('back') + ' Volver a la bandeja</button></div>' +
        '<div class="gb-stage"><section class="gb-step"><span class="gb-eyebrow">Carga masiva de infractores</span>' +
        '<h1 class="gb-title" id="bkT" tabindex="-1">' + P.t + '</h1>' + (P.l ? '<p class="gb-lead">' + P.l + '</p>' : '') + cuerpo() + '</section></div>' +
        '<div class="gb-foot"><div>' + (p > 1 && p < TOTAL ? '<button type="button" class="naowee-btn naowee-btn--mute gb-btn" id="bkBack">Atrás</button>' : '') + '</div>' +
        '<div>' + (p === TOTAL ? '<button type="button" class="naowee-btn naowee-btn--mute gb-btn" id="bkNew">Cargar otro archivo</button><button type="button" class="naowee-btn naowee-btn--loud gb-btn" id="bkDone">Volver a la bandeja</button>'
          : '<button type="button" class="naowee-btn naowee-btn--loud gb-btn" id="bkNext"' + (listo() ? '' : ' disabled') + '>' + P.next + '</button>') + '</div></div></div>';
      enlaza();
      if (foco) d.getElementById('bkT').focus({ preventScroll: true });
    }

    function ir(n) { S.paso = n; clearTimeout(S.timer); if (n === 3) valida(); pinta(true); d.getElementById('view').scrollTop = 0; }
    function valida() {
      S.progreso = 0; S.validado = false;
      (function tick() {
        S.progreso = Math.min(100, S.progreso + 8);
        if (S.paso !== 3) return;
        if (S.progreso >= 100) { S.validado = true; pinta(false); return; }
        var f = d.querySelector('.gb-meter .gb-bar i'), pp = d.querySelector('.gb-meter p'), bar = d.querySelector('.gb-meter .gb-bar');
        if (f) { f.style.width = S.progreso + '%'; bar.setAttribute('aria-valuenow', S.progreso); pp.textContent = 'Validando fila ' + Math.max(1, Math.round(S.progreso * S.filas.length / 100)) + ' de ' + S.filas.length + '…'; }
        S.timer = setTimeout(tick, 110);
      })();
    }
    function cargaArchivo(nombre, filas) { S.nombre = nombre; S.filas = filas.map(function (r) { return r.slice(); }); S.dec = {}; S.abierto = null; S.conf = false; pinta(false); }

    function enlaza() {
      function $(id) { return d.getElementById(id); }
      function on(id, fn) { var e = $(id); if (e) e.addEventListener('click', fn); }
      on('bkExit', salir);
      on('bkBack', function () { ir(S.paso - 1); });
      on('bkNext', function () { if (listo()) ir(S.paso + 1); });
      on('bkTpl', function () { UI.toast('Plantilla descargada (simulado).'); });
      on('bkPick', function () { $('bkFileIn').click(); });
      on('bkOtro', function () { S.filas = null; pinta(false); });
      on('bkExErr', function () { cargaArchivo('SANCIONATORIOS_septiembre.xlsx', FILAS); });
      on('bkExOk', function () { cargaArchivo('SANCIONATORIOS_septiembre_limpio.xlsx', LIMPIO); });
      on('bkRep', function () { UI.toast('Reporte de la carga descargado (simulado).'); });
      on('bkDone', function () { UI.toast(aImportar() + ' registros cargados en estado Recibido (simulado). Nada se guardó en la bandeja.'); location.hash = BASE.slice(1); });
      on('bkNew', function () { S.filas = null; S.nombre = ''; S.dec = {}; S.conf = false; ir(2); });
      var fi = $('bkFileIn'), dr = $('bkDrop');
      if (fi) fi.addEventListener('change', function () { if (fi.files[0]) cargaArchivo(fi.files[0].name, FILAS); });
      if (dr) {
        dr.addEventListener('dragover', function (e) { e.preventDefault(); dr.classList.add('is-over'); });
        dr.addEventListener('dragleave', function () { dr.classList.remove('is-over'); });
        dr.addEventListener('drop', function (e) { e.preventDefault(); cargaArchivo(e.dataTransfer.files[0] ? e.dataTransfer.files[0].name : 'SANCIONATORIOS_septiembre.xlsx', FILAS); });
      }
      var cf = $('bkConf');
      if (cf) cf.addEventListener('change', function () { S.conf = cf.checked; $('bkNext').disabled = !listo(); });
      view.querySelectorAll('.gb-err').forEach(function (box) {
        var fila = box.getAttribute('data-fila'), r = S.filas.filter(function (x) { return x[0] === fila; })[0];
        box.addEventListener('click', function (e) {
          var b = e.target.closest('[data-a]');
          if (!b) return;
          var a = b.getAttribute('data-a');
          if (a === 'fix') { S.abierto = S.abierto === fila ? null : fila; pinta(false); }
          if (a === 'excl') { var cur = S.dec[fila]; S.dec[fila] = { est: cur && cur.est === 'excl' ? 'pend' : 'excl' }; if (S.abierto === fila) S.abierto = null; pinta(false); }
          if (a === 'save') {
            var inp = box.querySelector('[data-in]'), msg = FIX[r[8]].ok(inp.value.trim()), er = box.querySelector('[data-err]');
            if (msg) { er.textContent = msg; er.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
            S.dec[fila] = { est: 'fix', val: inp.value.trim() }; S.abierto = null; pinta(false);
          }
        });
      });
    }
    pinta(true);
  }

  w.GIBulk = { open: open };
})(window, document);
