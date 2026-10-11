# Diagnóstico de rendimiento del backend

## Alcance y línea base

Mediciones locales del 10–11 de octubre de 2026 contra la base Supabase existente, sin modificar datos. Las pruebas HTTP emplearon 20 solicitudes de login con correo inexistente y 3 de calentamiento; ese caso **no** incluye la verificación bcrypt de una contraseña válida. El p95 de solo 20 muestras es orientativo, no un SLO de producción.

| Etapa                                                    |       Modo transacción 6543 |            Modo sesión 5432 |
| -------------------------------------------------------- | --------------------------: | --------------------------: |
| `SELECT 1`, conexión reutilizada                         |                 ~570 ms p50 |             ~110–116 ms p50 |
| Usuario con roles/permisos vía relaciones Prisma         |                     ~1.72 s |                ~0.68–1.04 s |
| Usuario con roles/permisos en una consulta parametrizada |                     ~790 ms |                 ~117–196 ms |
| Login HTTP, correo inexistente: Nest                     | 559.3 ms p50 / 566.6 ms p95 | 202.9 ms p50 / 207.1 ms p95 |
| Login HTTP, correo inexistente: Express                  | 543.4 ms p50 / 548.8 ms p95 | 204.0 ms p50 / 207.0 ms p95 |

La última pareja HTTP se midió con ambos servidores en la misma ventana. Otra ventana produjo cerca de 112 ms en ambos, señal de variabilidad de red. El plan `EXPLAIN ANALYZE` de la consulta de autorización ejecutó ~1.1 ms en PostgreSQL y la búsqueda indexada por correo ~0.04 ms. Por tanto, en este flujo el coste dominante es el viaje a la base y el número de consultas, no el cómputo SQL. `bcrypt.compare` de un hash existente tomó ~273 ms en la máquina de prueba: es trabajo de seguridad deliberado y no se debe omitir ni reducir sin una política de contraseñas.

## Cambios aplicados

- Express y Nest reutilizan una única instancia Prisma por proceso. Para el pooler compartido de Supabase en 6543, los procesos persistentes usan el modo sesión en 5432 y limitan el pool a cinco conexiones por proceso. No se cambia la base ni el esquema.
- El repositorio Auth de Nest obtiene identidad, roles y permisos en una consulta SQL parametrizada, con la misma deduplicación y prioridad de rol administrador que el contrato existente. Se verificó por lectura contra Prisma para los tres usuarios activos disponibles.
- En Express se añadió un registro opcional de solicitudes lentas. `API_SLOW_REQUEST_MS=500` registra método, plantilla de ruta, estado y duración; no guarda cuerpo, parámetros, URL completa, contraseña ni token.
- Express reúne métricas HTTP de todas las llamadas, incluidas las del frontend, por método y plantilla de ruta. La vista protegida `GET /internal/performance` exige sesión, `users.manage` y acceso global; entrega cantidad, estados, errores 5xx, promedio histórico y p50/p95/p99 de las últimas 512 muestras por ruta. Son datos en memoria de **un proceso**, no métricas persistentes ni consolidadas entre réplicas.
- Swagger Express está en `/docs` y su JSON en `/openapi.json` en desarrollo. En producción ambos están cerrados por defecto (`API_DOCS_ENABLED=true` los habilita explícitamente). Swagger muestra la duración de _Try it out_, que incluye el viaje desde el navegador; la métrica de Express mide el tiempo dentro del servidor. El inventario cubre las rutas actuales y una prueba comprueba su correspondencia con los routers. Los cuerpos no Auth siguen genéricos: se documentarán con los esquemas reales por módulo antes de considerar la especificación un contrato completo.
- `EXPRESS_DATABASE_POOL_MODE=transaction` y `NEST_DATABASE_POOL_MODE=transaction` revierten el cambio de modo sin editar la cadena de conexión. Los límites pueden ajustarse con `EXPRESS_DATABASE_CONNECTION_LIMIT` y `NEST_DATABASE_CONNECTION_LIMIT`.

## Plan de trabajo acordado

**Decisión:** Express continúa como backend operativo. Nest Auth queda en el repositorio local como referencia aislada; no se conecta el frontend a Nest ni se duplica el resto de módulos por razones de velocidad.

Uso local inmediato: arrancar `npm run dev:api`, abrir `http://localhost:3001/docs` y probar una ruta de lectura con **Authorize** si requiere JWT. Swagger muestra el tiempo total de esa solicitud. La operación `GET /internal/performance`, visible en la sección Observabilidad, devuelve las estadísticas del servidor solo a una cuenta con `users.manage` y acceso global. Para repetir el análisis tras un reinicio, debe generarse tráfico nuevamente: la memoria no es persistente. Nunca usar _Try it out_ con POST/PATCH/DELETE en la base operativa solo para obtener muestras.

1. **Línea base real por endpoint.** En una ventana representativa, capturar volumen, p50/p95/p99, errores y duración por ruta desde Express; comparar la misma operación vista en Swagger y en la pestaña Network del navegador. Swagger es un probador funcional, no una prueba de carga. No lanzar mutaciones repetidas contra datos operativos para producir estadísticas.
2. **Trazas por etapas en los guardados lentos.** Elegir las rutas que los datos señalen (por ejemplo, productos o transferencias) y medir validación, lecturas, transacción, escritura, consultas de confirmación y trabajo externo. Añadir un identificador de solicitud compartido entre frontend y backend, sin enviar datos sensibles a los logs. Si hay varias instancias, enviar métricas/trazas a un colector central en vez de sumar contadores locales como si fueran globales.
3. **Optimización con seguridad funcional.** Reducir viajes y lecturas repetidas, revisar índices/locks y mantener transacciones breves, con pruebas de permisos, saldos, movimientos e historial. Medir antes y después con el mismo escenario y disponer de reversión.
4. **Experiencia del frontend.** Una vez identificada la latencia del servidor, distinguir tiempo de red, renderizado y refetch; corregir solicitudes duplicadas, estados de guardado y actualizaciones visuales sin ocultar fallos ni duplicar operaciones. Los cambios de diseño quedan separados de esta medición.
5. **Validación en despliegue.** Repetir p95 y tasa de errores desde Render, con su región y concurrencia real, antes de declarar la mejora cerrada.

## Escrituras: hipótesis, no conclusión

`pg_stat_statements` mostró históricamente 3095 `INSERT` (~1.74 ms de ejecución media), 1298 `UPDATE` (~104.61 ms) y 534 `DELETE` (~237.78 ms). Dentro de esa muestra histórica, 26 `DELETE` de `Product` promediaron ~4.86 s y 55 `UPDATE` de `Category` ~2.28 s. Son agregados desde el último reinicio de estadísticas: no indican qué solicitud concreta demoró, cuánto esperó por red o locks, ni prueban que todas las eliminaciones o guardados actuales sean lentos. **No se ejecutaron escrituras de prueba sobre la base operativa.**

La revisión estática de `productService.update` muestra lecturas previas, validación y varias operaciones potenciales dentro de una transacción. Con la latencia por viaje observada, es un candidato para medición por etapas, pero no hay todavía una traza de un guardado concreto que justifique cambiar esa lógica de inventario.

Para localizar el siguiente cuello de botella sin arriesgar datos:

1. Activar temporalmente `API_SLOW_REQUEST_MS=500` en un entorno controlado y reproducir un guardado real autorizado. Correlacionar ruta, estado y duración con la operación realizada.
2. Medir en esa ruta, por separado, validación, consultas Prisma, tiempo de transacción, llamadas externas y respuesta HTTP. Recoger p50/p95/p99, concurrencia y tasa de errores durante una ventana representativa; no decidir por una sola muestra.
3. Consultar `pg_stat_statements`, esperas y locks para la sentencia implicada. Revisar su plan en una copia de prueba: `EXPLAIN ANALYZE` **ejecuta** la sentencia, por lo que no debe aplicarse a escrituras en producción.
4. Optimizar solo la ruta confirmada: evitar lecturas o escrituras redundantes, acortar transacciones y comprobar índices de filtros/joins. Comparar resultado funcional, plan y métricas antes/después, y conservar una vía de rollback.
5. Repetir la medición desde Render y comprobar la cercanía de región con Supabase. Los tiempos de una PC local no sustituyen la observabilidad del despliegue.

La migración a Nest es independiente: no se debe cambiar el frontend ni retirar Express hasta migrar y validar los demás módulos. Nest contiene Auth en esta fase; mover todo ahora no resolvería automáticamente una ruta de guardado lenta.

## Referencias técnicas

- [Supabase: conexiones Postgres y modos del pooler](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: límites del pool de conexiones](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits)
- [Prisma: optimización de consultas](https://www.prisma.io/docs/orm/v6/prisma-client/queries/query-optimization-performance)
- [PostgreSQL: comportamiento de `EXPLAIN ANALYZE`](https://www.postgresql.org/docs/current/sql-explain.html)
