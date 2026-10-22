import type { Permission, Role, SystemUser } from '../services/user-api.service'

/** La lista de usuarios y el catálogo pueden llegar en solicitudes distintas. */
export function permissionsForUser(user: SystemUser, catalogRoles: Role[]): Permission[] {
  const catalogById = new Map(catalogRoles.map(role => [role.id, role]))
  const rolePermissions = user.roles.flatMap(role =>
    (role.permissions ?? catalogById.get(role.id)?.permissions ?? []).map(entry => entry.permission),
  )

  return [...new Map([...rolePermissions, ...(user.directPermissions ?? [])].map(permission => [permission.key, permission])).values()]
}
