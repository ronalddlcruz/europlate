# Preservación de reglas de negocio

Invariantes que protegen la refactorización:

- Auth: mismo contrato de `/login` y `/session`, vigencia JWT de 8 horas, hash bcrypt, respuesta de usuario y permisos actuales leídos de la base; administrador mantiene `*`.
- Productos: códigos y orden existentes, atributos históricos, factor de conversión, stock inicial y ajuste de existencias al editar conservan sus escrituras y transacciones.
- Compras/importaciones: recepción escribe stock, saldo de presentación y movimiento dentro de la transacción existente; las reglas monetarias no se comparten artificialmente.
- Inventario/producción: reservas, consumo, merma, transferencia y trazabilidad mantienen sus estados, cálculos y signos de movimiento.
- Permisos: el alcance por almacén y el acceso global de administrador/gerencia no cambian.

La tanda piloto cubre con pruebas unitarias el cálculo de permisos, configuración de categorías, nombre de producto variable y presencia de las 20 rutas de Auth/Productos en el reporte de métricas. Una prueba HTTP con repositorios simulados compara login/sesión y verifica la lectura única de autorización. La compilación y estas pruebas **no sustituyen** pruebas de integración con BD aislada ni una comparación HTTP completa de productos. No se harán escrituras de prueba en la base operativa.
