# Arquitectura backend encontrada

La API operativa de Europlate arranca en `server/server.ts` y usa Express 5, TypeScript, Prisma 6 y PostgreSQL/Supabase. `server/src/app.ts` registra rutas, CORS, métricas, Swagger y el adaptador global de errores. `server-nest/` es una referencia aislada; no recibe tráfico del frontend.

Los 13 módulos de `server/src/modules` publican 92 rutas de negocio: Auth (2), Productos (18), Inventario (12), Compras (9), Importaciones (9), Producción (8), Usuarios (7), Tipos de cambio (6), Clientes (5), Proveedores (5), Agentes de aduana (5), Reportes (5) y Dashboard (1). El flujo habitual es ruta → controlador → servicio → repositorio/Prisma → PostgreSQL. Los cuerpos y parámetros se validan con Zod; la autenticación relee permisos vigentes desde la BD.

Las operaciones de stock, recepciones, producción y productos ya usan transacciones Prisma. Varias reglas siguen en servicios que acceden a Prisma directamente, incluso cuando existe un repositorio. Productos mezcla configuración del catálogo y mutaciones de inventario; autenticación consultaba dos veces al usuario al restaurar `/session`. Dashboard compone reportes e inventario. `docs/backend-architecture.md` representa una etapa anterior del proyecto y no debe usarse como descripción de las rutas actuales.

El esquema, índices y relaciones vigentes están en `prisma/schema.prisma`. Los documentos PDF de compras e importaciones se almacenan en Supabase Storage. Las pruebas de negocio completas son aún insuficientes para afirmar equivalencia total de recepciones, transferencias o producción.
