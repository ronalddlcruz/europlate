# Arquitectura del backend

La API operativa de Europlate usa Express, Prisma y PostgreSQL. El diagnóstico, la arquitectura objetivo y el avance incremental se mantienen en:

- [Arquitectura actual](architecture-current.md)
- [Arquitectura objetivo](architecture-target.md)
- [Dependencias entre módulos](module-dependencies.md)
- [Protección de reglas de negocio](business-rules-preservation.md)
- [Avance de la refactorización](refactoring-progress.md)
- [Rendimiento: siguiente fase](performance-next-phase.md)

La prueba de rutas en `server/src/shared/openapi/openapi.document.test.ts` verifica la correspondencia entre routers Express y el inventario Swagger. El proyecto `server-nest/` continúa aislado y no sustituye la API activa.
