import assert from 'node:assert/strict'
import test from 'node:test'
import { sessionUser } from './session-user.js'
import { authService } from '../services/auth.service.js'

test('conserva permisos de roles y permisos directos sin duplicados', () => {
  const user = sessionUser({
    id: 'user-1', companyId: 'company-1', name: 'Lenin', email: 'lenin@example.com',
    roles: [{ role: { key: 'warehouse_manager', permissions: [{ permission: { key: 'products.read' } }, { permission: { key: 'inventory.read' } }] } }],
    permissions: [{ permission: { key: 'products.read' } }],
  })
  assert.deepEqual(user.permissions, ['products.read', 'inventory.read'])
  assert.deepEqual(authService.getSession(user), { user })
})

test('el rol administrador conserva el comodín de permisos', () => {
  const user = sessionUser({
    id: 'user-2', companyId: 'company-1', name: 'Admin', email: 'admin@example.com',
    roles: [{ role: { key: 'admin', permissions: [] } }], permissions: [],
  })
  assert.deepEqual(user.permissions, ['*'])
})
