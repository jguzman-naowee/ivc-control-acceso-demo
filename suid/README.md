# Demo IVC · Gestión de infractores (Parte 1, HU-26.3)

HTML plano, sin build. Abrir **por servidor** (no con doble clic):

```bash
cd prototype-ivc-base && python3 -m http.server 8811
```

Entrada: `http://localhost:8811/suid/login.html`

| Ruta | Qué es |
|---|---|
| `suid/login.html` | Login real del IVC (es el mismo tema Keycloak del SUID, comprobado en sandbox-ivc). Es falso: entra con cualquier dato, incluso vacío |
| `suid/app.html#/control-acceso/infractores` | Bandeja: KPIs por estado, búsqueda, filtros |
| `…/infractores/nuevo` | Registrar infractor: 55 campos en 6 bloques |
| `…/infractores/INF-2026-0001` | Ficha única con historial; validar o devolver por subsanar |
| `…/infractores/INF-2026-0003/editar` | Edición del registro (caso de un menor con representante) |
| `…/infractores/carga-masiva` | Plantilla, archivo simulado y reporte de inconsistencias |

Menú del profesional del IVC (`suite-web-ivc`): "Mi bandeja" es relleno y lleva a "En construcción"; "Gestión de infractores" es el módulo nuevo.

## Archivos

- `app.html`, `app.js`, `app.css`: shell del SUID (sidebar, migas, avatar) sobre `../shared/` del IVC.
- `gi-catalogos.js`: catálogos reales de la Fuente 2. `gi-data.js`: reglas y 9 registros ficticios en `localStorage`.
- `gi.js` (bandeja y ficha), `gi-form.js` (registro), `gi-bulk.js` (carga masiva), `gi.css`.
- `login/`: CSS e imágenes del login real.

## Decisiones de producto

- El bloque del representante aparece cuando la persona es menor **a la fecha de los hechos**; mientras esa fecha falta, se calcula con hoy y se avisa que es provisional.
- La obligatoriedad de los campos no está definida en el diccionario salvo ¿zona rural?, origen y agravantes. Se marcó obligatorio lo central (identidad, ubicación, hechos, acto, ejecutoria, meses, radicado de entrada y profesional).
- Municipios: listado parcial para el demo; el real carga el oficial.
- Datos 100 % ficticios. Nada sale de `content-supplies/`.
