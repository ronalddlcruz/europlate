# Avance de refactorización

## Piloto 1: Auth y Productos

- Auth: constantes y tipos locales; cálculo de permisos centralizado. `/session` reutiliza la identidad, estado y permisos ya comprobados por el middleware en la misma solicitud, evitando una segunda lectura a BD. La respuesta HTTP y la verificación de JWT se conservan.
- Productos: la configuración de categorías, atributos y unidades se separó de la creación/edición de productos. Los valores permitidos del esquema Zod se derivan de los enums Prisma sin cambiar su orden. La creación de producto variable busca su categoría por subcategoría en vez de cargar todas las categorías.
- Observabilidad: el middleware HTTP existente mide todas las rutas; `npm run performance:modules` muestra p50/p95/p99 y errores para los 2 endpoints Auth y 18 de Productos, incluidos los que aún no tienen muestras. Solo consulta `/internal/performance`, protegido para administrador global; no envía cargas de escritura.

Verificación del piloto: `npm run server:build`, `npm run build`, `npm run lint:backend:pilot`, `npm run test:backend:pilot`, `npm run test:backend:pilot:http`, `npm run test:observability`, `npm run test:imports` y `npm run test:frontend` pasaron. La prueba HTTP de `/session` confirmó una lectura de autorización, el mismo JSON y la vigencia JWT. La consulta de producto variable pasó de leer todas las categorías a buscar solo la propietaria.

Medición local de solo lectura: `npm run performance:pilot:login` contra Express, 10 solicitudes tras 2 calentamientos con correo inexistente: p50 **193.1 ms**, p95 **206.0 ms**. Este caso no ejecuta bcrypt ni representa un login válido. Los números son orientativos y no prueban una mejora antes/después ni sirven como SLO de producción. Los otros endpoints necesitan tráfico autorizado normal para poblar `/internal/performance`.

No se han migrado Inventario, Compras, Importaciones, Producción ni los demás módulos. Se necesita una ventana de tráfico real comparable antes de afirmar un porcentaje de mejora de latencia. El directorio `output/` ya estaba sin seguimiento al comenzar el piloto y no se modificó.
