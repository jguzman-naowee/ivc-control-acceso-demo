/* Foto y huella de la persona. Son imágenes generadas con IA (no hay personas reales); el menor va difuminado. */
window.GIBio = (function () {
  'use strict';
  var FOTOS = ['hincha-sonriente', 'hincha-serio', 'hincha-enojado'];
  for (var n = 1; n <= 12; n++) FOTOS.push('hincha-' + (n < 10 ? '0' : '') + n);
  var rango = null, fijas = {};
  var LOCK = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function hash(seed) { var h = 0; String(seed).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h; }
  function img(src, alt, st) { return '<img class="gb-img" src="img/fotos/' + src + '.jpg" alt="' + alt + '" loading="lazy" decoding="async"' + (st ? ' style="' + st + '"' : '') + '>'; }
  function item(inner, cap, cls) { return '<figure class="gb-it"><div class="gb-box' + (cls || '') + '">' + inner + '</div><figcaption>' + cap + '</figcaption></figure>'; }

  /* Posición del documento en la lista ordenada: reparte las 15 fotos sin azar (hash solo si el documento no existe). */
  function idxDe(seed) {
    var k = String(seed);
    if (fijas[k] != null) return fijas[k];
    if (!rango && window.GI && window.GI.all) {
      var ds = {}; window.GI.all().forEach(function (r) { ds[String(r.numId)] = 1; });
      rango = {}; Object.keys(ds).sort().forEach(function (d, i) { rango[d] = i; });
    }
    return ((rango && rango[k] != null ? rango[k] : hash(k)) % FOTOS.length);
  }
  /* Recientes fija las fotos de su página en orden: si la del rango ya salió, toma la siguiente libre; el panel respeta lo fijado. */
  function repartir(seeds) {
    var usa = {};
    seeds.forEach(function (s) { var i = idxDe(s); while (usa[i]) i = (i + 1) % FOTOS.length; usa[i] = 1; fijas[String(s)] = i; });
  }
  /* El menor lleva siempre la suya, difuminada. */
  function fotoDe(seed, menor) {
    return menor ? img('nino-difuminado', 'Foto del menor, difuminada') : img(FOTOS[idxDe(seed)], 'Foto de la persona (imagen generada)');
  }
  /* La misma huella cambia de giro, espejo y encuadre según el documento para que no se vea repetida. */
  function huellaDe(seed) {
    var h = hash('h' + seed), giro = (h % 13) - 6, esp = h % 2 ? -1 : 1, esc = 1 + (h % 4) * .035;
    return img('huella', 'Huella digital (imagen generada)', 'transform:scaleX(' + esp + ') rotate(' + giro + 'deg) scale(' + esc.toFixed(3) + ')');
  }

  var PH = '<svg viewBox="0 0 24 24" width="40%" height="40%" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/></svg>';
  return {
    /* Foto sola; sin captura biométrica va un marcador en su lugar. */
    repartir: repartir,
    foto: function (seed, o) { return o && o.sin ? '<span class="gb-ph" role="img" aria-label="Sin foto registrada">' + PH + '</span>' : fotoDe(seed, o && o.menor); },
    par: function (seed, o) {
      return '<div class="gb-par" role="group" aria-label="Foto y huella digital">' + item(fotoDe(seed, o && o.menor), 'Foto') + item(huellaDe(seed), 'Huella') + '</div>';
    },
    reservada: function () { return '<div class="gb-par" role="group" aria-label="Foto y huella reservadas">' + item(LOCK, 'Foto reservada', ' gb-box--lock') + item(LOCK, 'Huella reservada', ' gb-box--lock') + '</div>'; }
  };
})();
