import assert from 'node:assert/strict'
import test from 'node:test'
import { assertWarehouseScope, importScopeWhere, productionScopeWhere, purchaseScopeWhere, scopeForUserPermissions } from './operation-scope.js'

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

test('el alcance se determina por permisos de la base, no por el nombre del rol', () => {
  assert.equal(scopeForUserPermissions(['operations.global'], 'admin-1', ['warehouse-1']), null)
  assert.equal(scopeForUserPermissions(['operations.global', 'operations.scoped'], 'manager-1', ['warehouse-1']), null)
  assert.deepEqual(scopeForUserPermissions(['operations.scoped'], 'employee-1', ['warehouse-1']), { userId: 'employee-1', warehouseIds: ['warehouse-1'] })
  assert.deepEqual(scopeForUserPermissions(['operations.scoped'], 'employee-2', []), { userId: 'employee-2', warehouseIds: [] })
})
