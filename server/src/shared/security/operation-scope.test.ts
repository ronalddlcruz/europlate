import assert from 'node:assert/strict'
import test from 'node:test'
import { assertWarehouseScope, importScopeWhere, productionScopeWhere, purchaseScopeWhere, scopeForUserRoles } from './operation-scope.js'

const scope = { userId: 'user-1', warehouseIds: ['warehouse-1', 'warehouse-2'] }

test('Gerencia no tiene filtro adicional sobre documentos', () => {
  assert.deepEqual(purchaseScopeWhere(null), {})
  assert.deepEqual(importScopeWhere(null), {})
  assert.deepEqual(productionScopeWhere(null), {})
})

test('Responsable ve solo sus documentos íntegramente dentro de sus almacenes', () => {
  assert.deepEqual(purchaseScopeWhere(scope), {
    createdByUserId: 'user-1',
    items: { some: {}, every: { warehouseId: { in: scope.warehouseIds } } },
  })
  assert.deepEqual(importScopeWhere(scope), purchaseScopeWhere(scope))
  assert.deepEqual(productionScopeWhere(scope), {
    createdByUserId: 'user-1', warehouseId: { in: scope.warehouseIds },
    materials: { every: { warehouseId: { in: scope.warehouseIds } } },
  })
})

test('sin almacenes asignados no puede operar en otro almacén', () => {
  assert.throws(() => assertWarehouseScope({ userId: 'user-1', warehouseIds: [] }, ['warehouse-1']))
  assert.doesNotThrow(() => assertWarehouseScope(scope, ['warehouse-1']))
})

test('un administrador asignado conserva acceso global y un empleado responsable queda limitado', () => {
  assert.equal(scopeForUserRoles(['admin'], 'admin-1', ['warehouse-1']), null)
  assert.equal(scopeForUserRoles(['general_manager', 'warehouse_manager'], 'manager-1', ['warehouse-1']), null)
  assert.deepEqual(scopeForUserRoles(['operador', 'warehouse_manager'], 'employee-1', ['warehouse-1']), { userId: 'employee-1', warehouseIds: ['warehouse-1'] })
  assert.deepEqual(scopeForUserRoles(['warehouse_manager'], 'employee-2', []), { userId: 'employee-2', warehouseIds: [] })
})
