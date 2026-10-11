# Arquitectura del frontend

El frontend se organiza por funcionalidades dentro de `src/features`. `src/app`
compone las rutas y los proveedores; `src/layouts` contiene la estructura de
navegación; `src/components/ui` alberga solo controles reutilizables sin reglas
de un módulo; `src/styles` define los tokens visuales actuales.

Cada funcionalidad puede tener estas carpetas, según las necesite:

```text
features/<nombre>/
  pages/       entradas de ruta: componen la vista, sin implementar tablas o modales
  components/  presentación propia del módulo (tables/, dialogs/, sections/)
  hooks/       estado de pantalla y coordinación de React Query
  services/    llamadas HTTP y adaptación de contratos API
  schemas/     validación Zod de entradas y contratos externos, cuando aplique
  domain/      reglas puras y selectores con pruebas
  types/       tipos del módulo compartidos entre sus capas
  data/        datos estáticos, nunca estado de negocio mutable
```

En la migración actual, `pages` conserva las entradas de ruta y la composición;
`hooks/use*Controller.ts` conserva sin alterar la coordinación previa de estado,
consultas y mutaciones. `components/tables`, `components/dialogs` y
`components/sections` contienen las piezas visuales extraídas. `shared.tsx`
reúne los controles y utilidades locales que todavía comparten varias piezas
de una misma funcionalidad. Inventario usa `inventory-shared.tsx` y
`warehouses-shared.tsx` porque son dos pantallas del mismo módulo.

Productos tiene vistas de página separadas para catálogo y configuración;
categorías y subcategorías se gestionan en componentes y diálogos propios
dentro de la configuración. Las rutas y pestañas públicas no se alteraron.

Las dependencias objetivo fluyen de `pages` hacia `components` y `hooks`; de
`hooks` hacia `services` y `domain`. `domain` no importa React ni HTTP. Las
dependencias cruzadas heredadas entre módulos se conservan en esta fase para
no modificar contratos ni comportamiento; se reemplazarán por contratos
explícitos al abordar cada dominio. No se crean carpetas vacías.

## Reglas de la migración

- Es una refactorización funcionalmente neutra: conservar textos, clases CSS,
  rutas existentes, estructuras de solicitud/respuesta, cálculos, orden,
  paginación, permisos, caché, confirmaciones y estados de carga/error.
- La página no debe contener el cuerpo de un modal ni el marcado de una tabla.
  Cada modal/formulario y tabla pertenece a un componente propio del módulo.
- React Query vive en hooks/controladores del módulo. Las claves y las
  invalidaciones existentes se preservan para no retrasar la actualización de
  Inventario, Compras, Importaciones, Producción, Reportes y Dashboard.
- Una regla de negocio se extraerá a `domain` solo con pruebas de equivalencia
  específicas. En esta fase no se reescriben reglas existentes. Los hooks
  coordinan acciones, no sustituyen la validación ni la autoridad del backend.
- Se realizan cambios por módulo y se ejecuta `npm run build` después de cada
  bloque. Las pruebas existentes deben permanecer verdes y se agregan pruebas
  de regresión a las reglas puras extraídas.
- La API Express se conserva en esta rama. Su sustitución se diseñará y
  migrará aparte, con contrato HTTP y pruebas de compatibilidad.

## Orden de trabajo

1. Productos: maestro, categorías, subcategorías, atributos y unidades.
2. Inventario y almacenes; compras nacionales e importaciones.
3. Producción; clientes, proveedores y agentes de aduana.
4. Usuarios, reportes, configuración, dashboard y autenticación.
5. Revisión de dependencias cruzadas, compilación y pruebas de regresión.

Los componentes visuales existentes no se rediseñan en esta rama. La rama
feature se mantiene aislada de `main` y no se despliega durante la migración.

## Convenciones y avance de calidad

- Los imports del frontend usan el alias `@/`, resuelto por TypeScript y Vite
  desde `src/`. Las pruebas frontend usan
  `tsx --tsconfig tsconfig.app.json` (`npm run test:frontend`) para resolverlo.
  Los imports de paquetes y la API del servidor no cambian.
- Auth ya sigue el patrón de página de composición, formulario visual,
  controlador de interacción, servicio HTTP y esquemas Zod. La validación del
  cliente refleja el contrato de credenciales del servidor y verifica las
  respuestas antes de guardar un token o restaurar una sesión en caché.
- `npm run lint` y `npm run format:check` verifican estrictamente Auth, el
  primer módulo de la migración. `npm run lint:all` y
  `npm run format:check:all` exponen la deuda de los demás módulos sin
  ocultarla. Cada módulo incorporado deberá quedar limpio antes de ampliar
  el alcance de los comandos predeterminados. `npm run format` formatea todo
  `src` de forma explícita; no se ejecuta como parte de la compilación.
- No se crean enums sin un conjunto cerrado de estados de dominio. Los tipos
  de Auth se infieren de los esquemas para evitar contratos duplicados.
