# Dependencias entre módulos

Mapa de importaciones y uso operacional observado:

| Consumidor | Proveedor | Motivo actual |
| --- | --- | --- |
| Compras, Importaciones | Productos | Crear productos variables en la transacción existente |
| Importaciones, Inventario | Tipo de cambio | Valorización de importaciones y existencias |
| Reportes | Inventario | Obtener vista de stock |
| Dashboard | Reportes, Tipo de cambio | Agregar indicadores del período |
| Middleware de autenticación | Auth | Leer permisos y estado vigentes |
| Compras, Importaciones, Producción, Inventario | Alcance por almacén | Validar y filtrar operaciones del usuario |

Además de las importaciones TypeScript, varios repositorios leen tablas de otros dominios mediante Prisma. Esto no implica que sus reglas sean idénticas. En particular, recepciones nacionales e importadas comparten patrón de escritura de stock, pero difieren en documentos, moneda, validaciones y tipo de movimiento.

No se detectó un ciclo directo entre las importaciones de módulos revisadas. El objetivo es hacer explícitos contratos entre módulos y reducir accesos a detalles internos sin cambiar quién escribe ni cuándo se confirma cada transacción.
