import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../../config/env.js'
import { AppError } from '../errors/app-error.js'
import type { AuthenticatedUser } from '../types/auth.js'

export function requireAuthentication(request: Request, _response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next(new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para acceder a este recurso.', 401))
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    if (typeof payload === 'string' || !payload.sub || typeof payload.companyId !== 'string' || !Array.isArray(payload.permissions)) throw new Error('Token inválido')
    request.auth = { id: payload.sub, companyId: payload.companyId, permissions: payload.permissions } satisfies AuthenticatedUser
    next()
  } catch { next(new AppError('INVALID_TOKEN', 'La sesión no es válida o expiró.', 401)) }
}
