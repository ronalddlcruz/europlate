import assert from 'node:assert/strict'
import test from 'node:test'
import { permissionsForUser } from './user-permissions'
import type { Role, SystemUser } from '../services/user-api.service'

const permission = { id: 'permission-1', key: 'inventory.manage', module: 'inventory', action: 'manage' }
const catalogRole: Role = {
  id: 'role-1', key: 'admin', name: 'Administrador',
  permissions: [{ permission }],
}
const user: SystemUser = {
  id: 'user-1', name: 'Lenin', email: 'lenin@example.com', status: 'ACTIVE',
  roles: [{ id: 'role-1', key: 'admin', name: 'Administrador' } as Role],
  directPermissions: [],
}

test('resuelve permisos desde el catálogo cuando el listado trae roles incompletos', () => {
  assert.deepEqual(permissionsForUser(user, [catalogRole]), [permission])
  assert.deepEqual(permissionsForUser(user, []), [])
})

test('combina permisos del rol y permisos directos sin duplicados', () => {
  assert.deepEqual(permissionsForUser({
    ...user,
    roles: [catalogRole],
    directPermissions: [permission],
  }, []), [permission])
})
