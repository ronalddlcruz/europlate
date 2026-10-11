# Europlate — backend Nest (fase 1: Auth)

Este servicio se ejecuta en paralelo al backend Express. `npm run dev` y la web siguen apuntando a Express en el puerto 3001. No se han cambiado rutas del frontend, el esquema Prisma, tablas ni datos.

## Estructura

| Carpeta                         | Responsabilidad                                                |
| ------------------------------- | -------------------------------------------------------------- |
| `src/config`                    | Validación de entorno, configuración HTTP y Swagger.           |
| `src/common/prisma`             | Una instancia de Prisma por proceso Nest, con pool limitado.   |
| `src/common/errors` y `filters` | Códigos y formato de error compatibles con Express.            |
| `src/modules/auth/controllers`  | Contrato HTTP.                                                 |
| `src/modules/auth/dto`          | Validación de entrada y documentación OpenAPI.                 |
| `src/modules/auth/services`     | Login y firma/verificación JWT.                                |
| `src/modules/auth/repositories` | Lectura parametrizada de identidad y permisos en una consulta. |
| `src/modules/auth/guards`       | JWT, usuario activo, empresa y permisos vigentes desde BD.     |
| `src/modules/auth/mappers`      | Proyección del usuario de sesión.                              |

La estructura sigue el patrón modular Nest 11 del backend Interbank de referencia, adaptando **la lógica de Europlate**. No se incorporaron Redis, sesiones por dispositivo ni reglas de login de Interbank porque no pertenecen al contrato actual. Se conserva el JWT de 8 horas con `sub`, `companyId` y `permissions`, y la respuesta `{ data: ... }`. La ruta `/api/auth/session` consulta los permisos actuales una sola vez, sin confiar en los permisos antiguos contenidos en el token.

## Ejecución local

Usa el `.env` existente en la raíz. Se requieren `SUPABASE_DATABASE_URL` (URL pooler para runtime) y `JWT_SECRET` (mínimo 32 caracteres). `WEB_ORIGIN` es opcional. `NEST_PORT` es opcional y por defecto vale `3002`; no puede coincidir con el puerto Express. El servicio no usa `SUPABASE_DIRECT_URL`, reservado para migraciones. Si la URL es del pooler compartido de Supabase en el puerto 6543, el servicio persistente utiliza su modo sesión en 5432, con cinco conexiones por proceso como máximo. `NEST_DATABASE_POOL_MODE=transaction` restaura el comportamiento anterior; `NEST_DATABASE_CONNECTION_LIMIT` permite ajustar el límite.

```powershell
npm run nest:build
npm run nest:start
```

- Login: `POST http://localhost:3002/api/auth/login`
- Sesión: `GET http://localhost:3002/api/auth/session` con Bearer JWT
- Swagger: `http://localhost:3002/docs`
- Especificación OpenAPI: `http://localhost:3002/docs-json`

Para desarrollo con compilación y reinicio automáticos: `npm run nest:dev`.

## Verificación y latencia

`npm run nest:test` ejecuta pruebas HTTP con repositorio simulado, sin escribir en la base. Cubre login, expiración de 8 horas, interoperabilidad JWT con Express, recarga de permisos, usuario inactivo, errores y OpenAPI. `npm run nest:verify:db` compara, en lectura, los roles y permisos del repositorio nuevo con Prisma sobre usuarios reales. `npm run nest:benchmark` hace solicitudes de login con una dirección inexistente; consulta la BD pero no modifica datos. Acepta `NEST_BENCHMARK_BASE_URL`, `NEST_BENCHMARK_REQUESTS` (1–100), `NEST_BENCHMARK_CONCURRENCY` y opcionalmente `EXPRESS_BENCHMARK_BASE_URL` para comparar ambos servicios contra la misma Supabase. `npm run nest:diagnose` mide tiempos de conexión y consultas sin modificar datos.

Medición local del 10–11/10/2026, 20 solicitudes tras 3 de calentamiento, login con correo inexistente (sin bcrypt): con pooler de transacción, Nest p50 559.3 ms/p95 566.6 ms y Express p50 543.4 ms/p95 548.8 ms. Con pooler de sesión y una consulta en Nest, en una medición simultánea Nest p50 202.9 ms/p95 207.1 ms y Express p50 204.0 ms/p95 207.0 ms. En otra ventana ambos estuvieron cerca de 112 ms; la red varía. Son tiempos desde la máquina local, no garantías para producción ni tiempos de login completo. El inicio en frío y el hash de contraseña requieren mediciones separadas.

En Express se puede activar `API_SLOW_REQUEST_MS=500` para registrar solicitudes lentas sin imprimir parámetros, datos personales ni tokens. Este registro permite identificar la ruta y el estado de las escrituras lentas antes de optimizarlas. No se han ejecutado escrituras de prueba sobre la base operativa. Un fallo DNS del host de Supabase puede impedir las comprobaciones en vivo; eso debe reportarse por separado de un fallo de aplicación.

## Siguiente fase

Migrar cada módulo con pruebas de contrato y permisos antes de cambiar el enrutamiento. Solo después de cubrir todos los módulos y probar una ventana de convivencia se debe cambiar la web o la infraestructura para apuntar a Nest. No despliegues `server-nest` en el servicio Express actual como reemplazo: aún contiene únicamente Auth.
