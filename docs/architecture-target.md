# Arquitectura objetivo

Se conserva Express, Prisma y PostgreSQL como monolito modular. Cada módulo expone rutas y contratos de aplicación explícitos; solo los módulos complejos se subdividen en presentación HTTP, casos de uso, dominio e infraestructura. No se crean capas vacías ni un framework paralelo.

- **Presentación:** rutas, controladores, Zod, serialización y errores HTTP.
- **Aplicación:** coordinación de casos de uso, transacciones y límites entre módulos.
- **Dominio:** cálculos y políticas que pueden probarse sin Express ni Prisma cuando su extracción conserve exactamente la semántica.
- **Infraestructura:** repositorios Prisma, almacenamiento y proveedores externos.

Los enums persistidos provienen de Prisma; los esquemas HTTP conservan el comportamiento de validación mediante listas tipadas derivadas de esos enums. Constantes y tipos propios de cada módulo viven junto al módulo. `shared/` queda reservado a mecanismos transversales (autenticación HTTP, errores, observabilidad), no a reglas comerciales.

La integración se hará módulo por módulo. Las API, transacciones, mensajes, permisos, resultados y datos persistidos no cambian por una extracción arquitectónica. Una mejora de rendimiento requiere medición antes/después y pruebas de equivalencia; no se añade caché a existencias ni autorizaciones sin una estrategia aprobada.
