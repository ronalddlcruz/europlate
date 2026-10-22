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

test('el rol administrador utiliza solo los permisos asignados en la base', () => {
  const user = sessionUser({
    id: 'user-2', companyId: 'company-1', name: 'Admin', email: 'admin@example.com',
    roles: [{ role: { key: 'admin', permissions: [
      { permission: { key: 'products.manage' } },
      { permission: { key: 'inventory.manage' } },
      { permission: { key: 'operations.global' } },
    ] } }], permissions: [],
  })
  assert.deepEqual(user.permissions, ['products.manage', 'inventory.manage', 'operations.global'])
  assert.deepEqual(sessionUser({
    id: 'user-3', companyId: 'company-1', name: 'Admin', email: 'admin-without-permissions@example.com',
    roles: [{ role: { key: 'admin', permissions: [] } }], permissions: [],
  }).permissions, [])
})
