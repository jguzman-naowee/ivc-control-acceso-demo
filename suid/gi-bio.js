/* Foto y huella de la persona: ilustraciones generadas a partir del documento; la demo no usa fotos reales. */
window.GIBio = (function () {
  'use strict';
  var PIEL = ['#f1c9a5', '#e0ac85', '#c68863', '#a86a4a', '#8a5236'];
  var PELO = ['#2b1f1a', '#3d2a20', '#5a3b27', '#1c1c22', '#7a5a3a'];
  var ROPA = ['#002b5b', '#d74009', '#3d7a52', '#5a4a8a', '#7b8794'];
  var FONDO = ['#e8eef7', '#f3ece4', '#e6f1ec', '#efe9f5'];

  function rng(seed) {
    var s = 7;
    String(seed).split('').forEach(function (c) { s = (s * 31 + c.charCodeAt(0)) >>> 0; });
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function pick(a, r) { return a[Math.floor(r() * a.length)]; }

  function foto(seed) {
    var r = rng('f' + seed), piel = pick(PIEL, r), pelo = pick(PELO, r), ropa = pick(ROPA, r), fondo = pick(FONDO, r), estilo = Math.floor(r() * 4);
    var atras = estilo === 1 ? '<path d="M25 56C22 30 35 21 48 21s26 9 23 35l3 38H22z" fill="' + pelo + '"/>' : estilo === 2 ? '<circle cx="48" cy="22" r="8" fill="' + pelo + '"/>' : '';
    var frente = estilo === 0 ? '<path d="M29 50c0-19 10-23 19-23s19 4 19 23c-3-9-9-13-19-13s-16 4-19 13z" fill="' + pelo + '"/>'
      : estilo === 1 ? '<path d="M29 48c2-14 10-19 19-19s17 5 19 19c-6-6-12-8-19-8s-13 2-19 8z" fill="' + pelo + '"/>'
      : estilo === 2 ? '<path d="M29 48c0-17 9-22 19-22s19 5 19 22c-4-8-10-11-19-11s-15 3-19 11z" fill="' + pelo + '"/>'
      : '<path d="M30 46c1-12 8-17 18-17s17 5 18 17c-5-5-11-7-18-7s-13 2-18 7z" fill="' + pelo + '" opacity=".85"/>';
    return '<svg viewBox="0 0 96 120" role="img" aria-label="Foto de la persona (ilustración de la demo)" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="120" fill="' + fondo + '"/>' +
      atras + '<path d="M6 120c0-27 20-37 42-37s42 10 42 37z" fill="' + ropa + '"/><path d="M41 92l7 9 7-9-3-10H44z" fill="' + piel + '" opacity=".9"/>' +
      '<rect x="40" y="68" width="16" height="20" rx="6" fill="' + piel + '"/><ellipse cx="29" cy="54" rx="3" ry="5" fill="' + piel + '"/><ellipse cx="67" cy="54" rx="3" ry="5" fill="' + piel + '"/>' +
      '<ellipse cx="48" cy="52" rx="19" ry="23" fill="' + piel + '"/>' + frente +
      '<circle cx="41" cy="53" r="1.7" fill="#2a2a33"/><circle cx="55" cy="53" r="1.7" fill="#2a2a33"/><path d="M37 48q4-2 7 0M52 48q4-2 7 0" stroke="#2a2a33" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M43 65q5 3 10 0" stroke="#7a3b2e" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
  }

  function huella(seed) {
    var r = rng('h' + seed), cx = 48 + (r() - .5) * 8, cy = 62 + (r() - .5) * 8, p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28, d = '';
    for (var i = 1; i <= 17; i++) {
      var rx = 2.6 + i * 2.55, ry = 3.4 + i * 3.1, arco = i > 8, pts = [], t0 = arco ? Math.PI * (1.02 - (i - 8) * .018) : 0, t1 = arco ? Math.PI * (1.98 + (i - 8) * .018) : Math.PI * 2;
      for (var t = t0; t <= t1 + 0.001; t += 0.14) {
        var x = cx + rx * Math.cos(t) * (1 + .055 * Math.sin(3 * t + p1)), y = cy + ry * Math.sin(t) * (1 + .05 * Math.cos(2 * t + p2)) + 1.4 * Math.sin(i * .9 + p3);
        pts.push((pts.length ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
      }
      d += '<path d="' + pts.join('') + '"/>';
    }
    for (var j = 0; j < 8; j++) {
      var y0 = 86 + j * 3.6, o = '';
      for (var x = 6; x <= 90; x += 6) o += (o ? 'L' : 'M') + x + ' ' + (y0 + 1.6 * Math.sin(x * .11 + j + p1)).toFixed(1);
      d += '<path d="' + o + '"/>';
    }
    return '<svg viewBox="0 0 96 120" role="img" aria-label="Huella digital (ilustración de la demo)" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="hc' + String(seed).replace(/\W/g, '') + '"><ellipse cx="48" cy="62" rx="36" ry="50"/></clipPath></defs>' +
      '<rect width="96" height="120" fill="#f6f7fb"/><g clip-path="url(#hc' + String(seed).replace(/\W/g, '') + ')" fill="none" stroke="#3a3f5c" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" opacity=".88">' + d + '</g></svg>';
  }

  function item(svg, cap, cls) { return '<figure class="gb-it"><div class="gb-box' + (cls || '') + '">' + svg + '</div><figcaption>' + cap + '</figcaption></figure>'; }
  var LOCK = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  return {
    par: function (seed) { return '<div class="gb-par" role="group" aria-label="Foto y huella digital">' + item(foto(seed), 'Foto') + item(huella(seed), 'Huella') + '</div>'; },
    reservada: function () { return '<div class="gb-par" role="group" aria-label="Foto y huella reservadas">' + item(LOCK, 'Foto reservada', ' gb-box--lock') + item(LOCK, 'Huella reservada', ' gb-box--lock') + '</div>'; }
  };
})();
