import type { Request } from 'express'
import type { UserStatus } from '@prisma/client'

export type AuthorizationRecord = {
  id: string
  companyId: string
  name: string
  email: string
  status: UserStatus
  roleKeys: string[]
  rolePermissionKeys: string[]
  directPermissionKeys: string[]
}

export type LoginRecord = AuthorizationRecord & { passwordHash: string }

export type SessionUser = {
  id: string
  name: string
  email: string
  companyId: string
  permissions: string[]
}

export type AuthenticatedRequest = Request & { auth?: SessionUser }

export type AccessTokenPayload = {
  sub: string
  companyId: string
  permissions: string[]
  iat?: number
  exp?: number
}
