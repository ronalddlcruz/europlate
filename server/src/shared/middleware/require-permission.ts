import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/app-error.js'

export const requirePermission = (permission: string) => (request: Request, _response: Response, next: NextFunction) => {
  if (!request.auth) return next(new AppError('AUTH_REQUIRED', 'Debes iniciar sesión para acceder a este recurso.', 401))
  if (!request.auth.permissions.includes('*') && !request.auth.permissions.includes(permission)) return next(new AppError('FORBIDDEN', 'No tienes permiso para realizar esta acción.', 403))
  next()
}
