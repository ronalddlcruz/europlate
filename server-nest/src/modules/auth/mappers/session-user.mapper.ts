import { ADMIN_ROLE_KEY } from '../constants/auth.constants'
import type { AuthorizationRecord, SessionUser } from '../types/auth.types'

export function toSessionUser(user: AuthorizationRecord): SessionUser {
  const permissions = user.roleKeys.includes(ADMIN_ROLE_KEY)
    ? ['*']
    : [...new Set([...user.rolePermissionKeys, ...user.directPermissionKeys])]
  return { id: user.id, name: user.name, email: user.email, companyId: user.companyId, permissions }
}
