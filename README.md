# IVC · Control de acceso (demo)

Demo navegable del módulo **Control de acceso** del IVC (Inspección, Vigilancia y Control · Ministerio del Deporte), Parte 1: gestión de infractores según la HU-26.3.

**Ver la demo:** https://jguzman-naowee.github.io/ivc-control-acceso-demo/

Abre en el login del SUID. Es un login de demostración: entra con cualquier dato, incluso vacío.

## Qué tiene

Dentro del panel del IVC, la sección **Control de acceso** tiene tres pantallas:

| Pantalla | Qué hace |
|---|---|
| Búsqueda | Consulta si una persona tiene una medida vigente y hasta cuándo. Los menores solo por documento completo |
| Gestión | Bandeja, ficha con historial, registro de infractor (55 campos), edición y carga masiva |
| Solicitudes | Reportes de entidades deportivas e inspecciones; se enlazan a una medida de Gestión |

El resto del menú (Bandeja, Aprobación de actos, etc.) es el del IVC real y no tiene contenido en esta demo.

## Datos

Todos los datos son **ficticios** y se guardan en el `localStorage` del navegador. Nada sale de tu equipo. El botón "Restablecer datos de la demo" (pie de la bandeja de Gestión) los devuelve al estado inicial.

## Estructura

- `index.html`: login.
- `suid/`: la demo (shell, vistas y datos). Detalle en [`suid/README.md`](suid/README.md).
- `shared/`, `profesional/`, `coordinador/`, `director/`, `usuario-externo/`, `selector-perfiles-ivc.html`: copia del prototipo de diseño [`naowee-tech/design-naowee-ivc`](https://github.com/naowee-tech/design-naowee-ivc), usada como base de estilos y componentes.

HTML, CSS y JS planos, sin build. Se puede abrir con doble clic en `index.html` o servir con cualquier servidor estático.
