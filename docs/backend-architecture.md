# Backend preparado

La API se implementará por dominio con el flujo `routes → controllers → services → repositories → Prisma → PostgreSQL`.

`server/src/modules` ya contiene Productos, Inventario, Compras y Producción con validadores Zod, repositorios Prisma y servicios. Las rutas son marcadores sin endpoints, conforme al alcance actual.

## Seguridad al habilitar rutas

- Registrar las rutas de autenticación públicas bajo `/api/auth`.
- Aplicar `requireAuthentication` a las demás rutas.
- Aplicar `requirePermission('<módulo>:read')` a GET y `requirePermission('<módulo>:manage')` a mutaciones.
- Resolver permisos desde `Role`, `Permission`, `RolePermission` y `UserPermission`.

## Supabase y Prisma

- `DATABASE_URL`: URL de la base PostgreSQL; puede ser el pooler de Supabase para la API.
- `DIRECT_URL`: usar conexión directa de Supabase para migraciones cuando se habiliten.
- Antes de crear la primera migración, confirmar que el proyecto de Supabase esté activo y que la URL/puerto sean accesibles.
