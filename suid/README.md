# Demo IVC · Gestión de infractores (Parte 1, HU-26.3)

HTML plano, sin build. Abrir **por servidor** (no con doble clic):

```bash
cd prototype-ivc-base && python3 -m http.server 8000
```

Entrada: `/suid/login.html` en el servidor local de tu preferencia (el puerto es libre).

| Ruta | Qué es |
|---|---|
| `suid/login.html` | Login real del IVC (es el mismo tema Keycloak del SUID, comprobado contra el prototipo de referencia). Es falso: entra con cualquier dato, incluso vacío |
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
- `gi-panel.js` / `gi-panel.css`: panel derecho único (`GI.panel`). `gi-perfil.js` / `gi-perfil.css`: perfil y afinidad (`GI.perfilDe`, `GI.perfilHtml`).
- `login/`: CSS e imágenes del login real.

## Decisiones de producto

- El bloque del representante aparece cuando la persona es menor **a la fecha de los hechos**; mientras esa fecha falta, se calcula con hoy y se avisa que es provisional.
- La obligatoriedad de los campos no está definida en el diccionario salvo ¿zona rural?, origen y agravantes. Se marcó obligatorio lo central (identidad, ubicación, hechos, acto, ejecutoria, meses, radicado de entrada y profesional).
- Municipios: listado parcial para el demo; el real carga el oficial.
- Datos 100 % ficticios. Nada sale de los insumos de diseño.

## Estados de carga

- **Esqueletos:** cada pantalla (Búsqueda, Gestión, ficha, registro, carga masiva, Solicitudes) muestra primero su esqueleto, con la forma de la pantalla real, y una barra de progreso bajo la cabecera.
- **Una sola velocidad**, fija: de 0,35 s (secciones en construcción) a 1 s (Gestión). Búsqueda espera 1 s fijo al consultar.
- **Acciones:** guardar, validar, devolver por subsanar, enlazar y archivar deshabilitan el botón y muestran "Guardando…", "Validando…", etc. El login también ("Iniciando sesión…").
- Respeta `prefers-reduced-motion`: sin brillo animado.
- Archivos: `skeleton.js` (esqueletos, tiempos y `SUID.busy`) y `skeleton.css`.

## Foto y huella

- Las imágenes de `img/fotos/` son generadas con IA; no hay personas reales. Cada persona usa una de tres fotos de hincha (tomadas de `prototype/svn/assets/fotos`), elegida por documento, así que se repiten. Si se suman más fotos, basta agregarlas a la lista `FOTOS` de `gi-bio.js`.
- **Menores:** muestran `nino-difuminado.jpg`, recortado y difuminado con `ffmpeg` (`gblur=sigma=22`) a partir de la imagen original, más que ella. Con reserva reforzada sin abrir, solo se ve el candado.
- **Huella:** una sola imagen (`huella.jpg`) que cambia de giro, espejo y encuadre según el documento.

## Panel derecho

- Es el comportamiento del panel de medidas del SVN (`#/medidas`) llevado al IVC: al elegir un registro se abre un panel a la derecha con su información, sin salir de la lista. Hoy lo usan **Gestión** (clic o Enter en la fila, o el botón «Ver expediente» de la fila) y **Solicitudes**.
- En Gestión el pie del panel tiene **Ver expediente** (abre la ficha completa, que es la vista de siempre) y **Editar**. Validar o devolver un registro se hace en el expediente; el panel lo avisa.
- No tapa la pantalla con un velo: la tabla sigue usable. Un clic en otra fila cambia el contenido; la fila abierta queda marcada. **Esc** y la **X** lo cierran y devuelven el foco a la fila; cambiar de vista también lo cierra. Si el registro abierto sale del resultado al filtrar o buscar, el panel se cierra solo; al paginar sigue abierto.
- Mide 440 px (380 px bajo 1100 px) y bajo el encabezado; en pantallas angostas (menos de 768 px) ocupa todo el ancho. Con el panel abierto, la barra de búsqueda y filtros se acorta para no quedar debajo y los avisos se desplazan a su izquierda.
- Para usarlo: `GI.panel.abrir({ id, tag, meta, titulo, chip, sub, resumen, cuerpo, acciones, nota, origen, onPintar, onCerrar })`. `GI.panel.actualizar(parcial)` repinta sin perder el scroll ni el foco, `GI.panel.sincronizar()` marca la fila (se llama tras pintar la tabla) y `GI.panel.cerrar()` lo cierra. Los botones del contenido se atan en `onPintar`, que se ejecuta tras cada pintura.

## Perfil y afinidad (datos ficticios)

- Muestra el club afín y las señales de la persona (tribuna habitual, frecuencia, viajes de visitante, con quién va, intentos fallidos). Aparece en el panel y la ficha de Gestión, en Solicitudes y en Búsqueda, siempre con el mismo resultado para la misma persona.
- **Los datos son ficticios.** Se generan en `gi-perfil.js` solo a partir de los dígitos del documento, así que no cambian al recargar ni al editar el registro. Julián Andrés Posada (718944471) lleva los valores del SVN. Solo Atlético Nacional e Independiente Medellín tienen escudo; los demás clubes llevan monograma.
- Los menores y los documentos incompletos no se calculan: se muestra una nota de reserva. Con menos de 60 % de certeza o de 6 partidos en 6 meses el resultado es «no concluyente» y no se afirma un club. Esos umbrales son una propuesta, pendiente de confirmar con producto.
- Las señales informan, no deciden: no hay un puntaje de peligrosidad y solo el club afín interviene en una regla de acceso (partidos sin hinchada visitante); aquí solo se consulta.

## Publicación

- Demostración con datos ficticios; la app lo avisa en la barra superior.
- Las fotos de personas son generadas con IA; los escudos y logos de terceros son solo ilustrativos.
- La foto de la deportista del login es de uso autorizado por Jorge, pendiente de permiso formal.
