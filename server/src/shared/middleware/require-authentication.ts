import jwt from 'jsonwebtoken'
import { UserStatus } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../../config/env.js'
import { AppError } from '../errors/app-error.js'
import type { AuthenticatedUser } from '../types/auth.js'
import { authRepository } from '../../modules/auth/repositories/auth.repository.js'

export async function requireAuthentication(request: Request, _response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next(new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para acceder a este recurso.', 401))
  let payload: jwt.JwtPayload
  try {
    const verified = jwt.verify(token, env.JWT_SECRET)
    if (typeof verified === 'string' || !verified.sub || typeof verified.companyId !== 'string') throw new Error('Token inválido')
    payload = verified
  } catch { return next(new AppError('INVALID_TOKEN', 'La sesión no es válida o expiró.', 401)) }
  // Los roles/permisos se leen de la BD: cambiar a un responsable de almacén
  // revoca inmediatamente privilegios antiguos, incluso con un JWT vigente.
  const user = await authRepository.findAuthorizationById(payload.sub!)
  if (!user || user.companyId !== payload.companyId || user.status !== UserStatus.ACTIVE) {
    return next(new AppError('INVALID_SESSION', 'La sesión no es válida o el usuario ya no está activo.', 401))
  }
  const roles = user.roles.map(entry => entry.role.key)
  const permissions = roles.includes('admin') ? ['*'] : [...new Set([
    ...user.roles.flatMap(entry => entry.role.permissions.map(item => item.permission.key)),
    ...user.permissions.map(entry => entry.permission.key),
  ])]
  request.auth = { id: user.id, companyId: user.companyId, permissions } satisfies AuthenticatedUser
  next()
}
