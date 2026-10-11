# Rendimiento: siguiente fase

La métrica HTTP existente registra duración por método y plantilla de ruta, errores y p50/p95/p99 de las últimas 512 muestras por ruta y proceso. Para Auth y Productos, ejecutar `npm run performance:modules` con `EUROPLATE_ACCESS_TOKEN` de administrador global y, si corresponde, `EUROPLATE_API_URL`. La salida marca explícitamente rutas sin muestras. No registrar ni compartir el token. `npm run performance:pilot:login` mide exclusivamente solicitudes 401 de correo inexistente y no modifica datos.

Primero comparar ventanas equivalentes de uso real; después examinar las rutas con peor p95, separando latencia de red, consultas, validación y transacción. Candidatos conocidos: múltiples viajes a BD al guardar productos, lecturas de catálogos completos, valorización de inventario, consultas sin paginación y llamadas al proveedor externo de tipo de cambio. Son hipótesis hasta medir cada operación.

No se introduce Redis, colas ni cambios de índices/esquema en esta fase. `docs/backend-performance.md` contiene las mediciones históricas de autenticación y las limitaciones de esa muestra.
