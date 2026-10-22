import type { AuthorizationUser, SessionUser } from '../types/auth.types.js'

export function permissionsFor(user: Pick<AuthorizationUser, 'roles' | 'permissions'>): string[] {
  return [...new Set([
    ...user.roles.flatMap(entry => entry.role.permissions.map(item => item.permission.key)),
    ...user.permissions.map(item => item.permission.key),
  ])]
}

export function sessionUser(user: AuthorizationUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: user.companyId,
    permissions: permissionsFor(user),
  }
}
