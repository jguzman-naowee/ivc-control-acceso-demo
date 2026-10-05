/* Perfil y afinidad de la persona (DATOS FICTICIOS del demo): club afín inferido y cuatro señales que informan, no deciden.
   Sale solo de los dígitos del documento, así que la misma persona se ve igual en Búsqueda, Gestión y Solicitudes. */
(function (w) {
  'use strict';
  var GI = w.GI;
  var UMBRAL = 60, MIN_PARTIDOS = 6, VENTANA = 'últimos 6 meses'; /* umbrales propuestos: producto aún no los define */
  var CACHE = {}, uid = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digitos(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
  function hash(seed) { var h = 0; String(seed).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h; }
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function pesa(v, lista) {
    var t = lista.reduce(function (s, x) { return s + x.p; }, 0), x = v * t, i;
    for (i = 0; i < lista.length; i++) { x -= lista[i].p; if (x < 0) return lista[i]; }
    return lista[lista.length - 1];
  }
  function congela(o) { Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === 'object') congela(o[k]); }); return Object.freeze(o); }

  /* Nombres de visualización fijos (el catálogo viene en mayúsculas); p = peso en el sorteo. */
  var CLUBES = [
    { n: 'Atlético Nacional', c: 'Nacional', p: 14 }, { n: 'Independiente Medellín', c: 'Medellín', p: 12 }, { n: 'Millonarios', c: 'Millonarios', p: 12 },
    { n: 'Junior', c: 'Junior', p: 10 }, { n: 'América de Cali', c: 'América', p: 8 }, { n: 'Independiente Santa Fe', c: 'Santa Fe', p: 8 },
    { n: 'Deportivo Cali', c: 'Cali', p: 7 }, { n: 'Deportes Tolima', c: 'Tolima', p: 6 }, { n: 'Atlético Bucaramanga', c: 'Bucaramanga', p: 5 },
    { n: 'Deportivo Pereira', c: 'Pereira', p: 5 }, { n: 'Once Caldas', c: 'Once Caldas', p: 5 }, { n: 'Envigado', c: 'Envigado', p: 4 }
  ];
  var TRIBUNAS = [{ n: 'Norte', p: 30 }, { n: 'Sur', p: 30 }, { n: 'Oriental', p: 22 }, { n: 'Occidental', p: 18 }];
  var ESCUDOS = [[/^(atl.tico )?nacional$/i, 'nacional.png'], [/^(independiente )?medell.n$/i, 'medellin.png']];
  /* Julián Andrés Posada: los mismos valores que el SVN (datos.js, vista policial). */
  var FIJOS = { '71894447': { club: 0, cert: 86, partidos: 16, tribuna: 'Sur', enTribuna: 11, viajes: 3, acomp: 2, intentos: 1, ultimo: 'Último: Puerta 4 · Oriental, 18:42.' } };

  function mono(n) {
    var p = String(n).replace(/\b(de|del|la|el|los|las)\b/gi, ' ').split(/\s+/).filter(function (x) { return x && !/^\d+$/.test(x); });
    return (p.length > 1 ? p[0][0] + p[1][0] : String(n).slice(0, 2)).toUpperCase();
  }
  function escudo(n) { var e = ESCUDOS.filter(function (x) { return x[0].test(String(n).trim()); })[0]; return e ? 'img/origenes/' + e[1] : ''; }

  /* Escudo del club (o monograma si no hay) al tamaño pedido; el nombre ya va en el texto de al lado. */
  GI.clubAvatar = function (nombre, px) {
    if (!nombre) return '';
    var s = Math.max(16, +px || 40), src = escudo(nombre);
    return '<span class="gpf-av' + (src ? '' : ' gpf-av--mono') + '" style="--gpf-av:' + s + 'px" aria-hidden="true">' + (src ? '<img src="' + src + '" alt="" width="' + s + '" height="' + s + '">' : esc(mono(nombre))) + '</span>';
  };

  function reservado(motivo) { return congela({ clave: '', reservado: true, motivo: motivo, club: null, senales: [], ventana: VENTANA, ficticio: true }); }

  function arma(clave, x) {
    var club = CLUBES[x.club], concl = x.cert != null && x.cert >= UMBRAL && x.partidos >= MIN_PARTIDOS;
    var enClub = x.cert == null ? 0 : Math.min(x.partidos, Math.round(x.partidos * x.cert / 100));
    var nivel = x.cert == null ? 'baja' : x.cert >= 72 ? 'alta' : x.cert >= UMBRAL ? 'media' : 'baja';
    var pl = function (n, a, b) { return n + ' ' + (n === 1 ? a : b); };
    return congela({
      clave: clave, reservado: false, ventana: VENTANA, ficticio: true, partidos: x.partidos,
      club: {
        nombre: concl ? club.n : '', corto: concl ? club.c : '', cert: x.cert, nivel: nivel, concluyente: concl, escudo: concl ? escudo(club.n) : '', sigla: concl ? mono(club.n) : '',
        motivo: concl ? '' : x.partidos < MIN_PARTIDOS ? 'historial' : 'certeza',
        por: concl ? enClub + ' de ' + x.partidos + ' partidos en tribuna local.' : x.partidos < MIN_PARTIDOS ? 'Solo ' + x.partidos + ' partidos registrados en 6 meses.' : 'El club más frecuente reúne ' + enClub + ' de ' + x.partidos + ' partidos.'
      },
      senales: [
        { id: 'tribuna', etiqueta: 'Tribuna habitual', valor: x.tribuna, por: x.enTribuna + ' de ' + x.partidos + ' ingresos por la tribuna ' + x.tribuna + '.', icono: 'tribuna' },
        { id: 'frecuencia', etiqueta: 'Frecuencia', valor: x.partidos + ' partidos en 6 meses', por: 'Ingresos reales registrados en la puerta.', icono: 'frecuencia' },
        { id: 'viajes', etiqueta: 'Viajes de visitante', valor: String(x.viajes), por: x.viajes ? 'Ingresos en escenarios de otras ciudades.' : 'Sin ingresos en escenarios de otras ciudades.', icono: 'viajes' },
        { id: 'acompanantes', etiqueta: 'Con quién va', valor: x.acomp ? pl(x.acomp, 'persona que ha tenido medidas', 'personas que han tenido medidas') : 'Nadie con medidas', por: x.acomp ? 'Comparten boletas del mismo propietario.' : 'Sin boletas compartidas con personas que tengan medidas.', icono: 'acompanantes' },
        { id: 'intentos', etiqueta: 'Intentos fallidos', valor: x.intentos ? x.intentos + ' en los últimos 30 días' : 'Ninguno', por: x.intentos ? (x.ultimo || 'Rechazos registrados en las puertas del escenario.') : 'Sin rechazos en las puertas en los últimos 30 días.', icono: 'intentos' }
      ]
    });
  }

  /* Orden de los sorteos fijo: agregar uno nuevo siempre al final para no cambiar los perfiles ya vistos. */
  function generar(clave) {
    var r = rng(hash('afin:' + clave)), banda = r(), rc = r(), rClub = r(), rPart = r(), rTrib = r(), rTribN = r(), rViaj = r(), rAcomp = r(), rAcompN = r(), rInt = r(), rIntN = r();
    var cert = banda < .7 ? 72 + Math.floor(rc * 24) : banda < .85 ? 60 + Math.floor(rc * 12) : 28 + Math.floor(rc * 32);
    var partidos = 4 + Math.floor(rPart * 21), club = pesa(rClub, CLUBES), trib = pesa(rTrib, TRIBUNAS).n;
    return arma(clave, {
      club: CLUBES.indexOf(club), cert: partidos < MIN_PARTIDOS ? null : cert, partidos: partidos, tribuna: trib,
      enTribuna: Math.max(1, Math.min(partidos, Math.round(partidos * (.5 + rTribN * .4)))), viajes: Math.min(partidos, Math.floor(rViaj * 7)),
      acomp: rAcomp < .7 ? 0 : 1 + Math.floor(rAcompN * 3), intentos: rInt < .8 ? 0 : 1 + Math.floor(rIntN * 2)
    });
  }

  /* doc: cualquier texto con el documento (solo cuentan los dígitos). Menor o documento incompleto = reservado, sin cálculo. */
  GI.perfilDe = function (doc, o) {
    if (o && o.menor) return reservado('menor');
    var clave = digitos(doc);
    if (clave.length < 6) return reservado('sin-dato');
    return CACHE[clave] || (CACHE[clave] = FIJOS[clave] ? arma(clave, FIJOS[clave]) : generar(clave));
  };
  GI.perfilUmbral = { certeza: UMBRAL, partidos: MIN_PARTIDOS };

  var ICO = {
    tribuna: '<path d="M3 20h18"/><path d="M5 20v-5h14v5"/><path d="M7 15v-4h10v4"/><path d="M9 11V7h6v4"/>',
    frecuencia: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    viajes: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M8 21v-4M16 21v-4"/>',
    acompanantes: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a4 4 0 0 1 4 4v1"/>',
    intentos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  function ico(k) { return '<svg class="gpf__i" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + '</svg>'; }

  var NOTA_CLUB = 'Se infiere del historial de ingresos; la persona no declara su club.';
  var PRINCIPIO = 'Estas señales informan, no deciden. No hay un puntaje de peligrosidad: cada dato dice de dónde sale.';
  var PIE = 'Señal inferida, no certeza. La consulta queda en la auditoría y la persona puede apelar. Solo el club afín interviene en partidos sin hinchada visitante; aquí solo se consulta.';
  var COMO = 'El club se infiere de los ingresos de la persona a los partidos de los últimos 6 meses: la certeza es la parte de esos partidos en que entró por la tribuna local del mismo club. ' +
    'Con menos de ' + UMBRAL + ' % de certeza o menos de ' + MIN_PARTIDOS + ' partidos no se afirma un club (umbrales propuestos, por confirmar con producto).';

  function barras(cert, nc) {
    var on = cert == null ? 0 : Math.round(cert / 20), h = '';
    for (var i = 0; i < 5; i++) h += '<i class="gpf__b' + (i < on ? ' is-on' : '') + '"></i>';
    return '<span class="gpf__barras' + (nc ? ' is-nc' : '') + '" aria-hidden="true">' + h + '</span>';
  }

  function clubHtml(c, px) {
    var nc = !c.concluyente, pct = c.cert == null ? '<b class="gpf__pct">Sin dato</b>' : '<b class="gpf__pct"><span class="gpf__sr">Certeza: </span>' + c.cert + ' %</b>';
    return '<div class="gpf__club' + (nc ? ' gpf__club--nc' : '') + '">' + (nc ? '<span class="gpf-av gpf-av--nc" style="--gpf-av:' + px + 'px" aria-hidden="true">?</span>' : GI.clubAvatar(c.nombre, px)) +
      '<div class="gpf__club-t"><span class="gpf__rot">Club afín</span><strong class="gpf__club-n">' + (nc ? 'No concluyente' : esc(c.nombre)) + '</strong><span class="gpf__por">' + esc(c.por) + '</span></div>' +
      '<div class="gpf__cert">' + barras(c.cert, nc) + pct + '</div></div>' +
      '<p class="gpf__nota">' + (!nc ? esc(NOTA_CLUB) : c.motivo === 'historial' ? 'Con menos de ' + MIN_PARTIDOS + ' partidos en 6 meses (umbral propuesto) el historial no alcanza para afirmar un club; se deja pasar.' : 'Con menos de ' + UMBRAL + ' % (umbral propuesto) no se afirma un club y se deja pasar.') + '</p>';
  }

  /* o.compacto: señales en una columna (panel); si no, dos columnas con el «por qué» (ficha, Búsqueda).
     o.titulo: texto del h3; false o '' lo omite cuando el anfitrión ya pone su propio título. Sin borde ni padding exterior. */
  GI.perfilHtml = function (p, o) {
    if (!p) return '';
    o = o || {};
    var cls = 'gpf ' + (o.compacto ? 'gpf--c' : 'gpf--f'), id = 'gpfT' + (++uid), titulo = o.titulo === undefined ? 'Perfil y afinidad' : o.titulo;
    var h3 = titulo ? '<h3 class="gpf__h" id="' + id + '">' + esc(titulo) + '</h3>' : '', lab = titulo ? ' aria-labelledby="' + id + '"' : ' aria-label="Perfil y afinidad"';
    if (p.reservado) {
      return '<section class="' + cls + ' gpf--r"' + lab + '>' + (h3 ? '<header class="gpf__cab">' + h3 + '</header>' : '') +
        '<p class="gpf__reserva" role="note">' + ico('lock') + '<span>' + (p.motivo === 'menor' ? 'Perfil de afinidad no disponible: la persona es menor de edad.' : 'Perfil de afinidad no disponible: el documento no está completo.') + '</span></p></section>';
    }
    var sen = p.senales.map(function (s) {
      return '<li class="gpf__s">' + ico(s.icono) + '<span class="gpf__et">' + esc(s.etiqueta) + '</span><strong class="gpf__v">' + esc(s.valor) + '</strong>' + (o.compacto ? '' : '<span class="gpf__sp">' + esc(s.por) + '</span>') + '</li>';
    }).join('');
    return '<section class="' + cls + '"' + lab + '><header class="gpf__cab">' + h3 + '<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet gpf__tag">Señal inferida</span></header>' +
      '<p class="gpf__principio" role="note">' + ico('info') + '<span>' + esc(PRINCIPIO) + '</span></p>' + clubHtml(p.club, o.compacto ? 40 : 48) +
      '<ul class="gpf__sen">' + sen + '</ul>' +
      '<footer class="gpf__pie"><p>' + esc(PIE) + '</p><details class="gpf__como"><summary>Cómo se calcula</summary><p>' + esc(COMO) + '</p></details><p class="gpf__fic">Datos ficticios del demo.</p></footer></section>';
  };

  /* Etiqueta corta con el club y la certeza; hoy no se usa en las filas (decisión de producto), queda lista. */
  GI.perfilChip = function (p) {
    if (!p || p.reservado) return '';
    var c = p.club;
    return '<span class="gpf-chip' + (c.concluyente ? '' : ' gpf-chip--nc') + '">' + (c.concluyente ? GI.clubAvatar(c.nombre, 20) + esc(c.corto) + ' · ' + c.cert + ' %' : 'No concluyente') + '</span>';
  };
})(window);
