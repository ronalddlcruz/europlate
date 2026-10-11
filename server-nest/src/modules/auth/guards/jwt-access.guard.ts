import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { UserStatus } from '@prisma/client'
import { ApiErrorCode, ApiException } from '../../../common/errors/api.exception'
import { toSessionUser } from '../mappers/session-user.mapper'
import { AuthRepository } from '../repositories/auth.repository'
import { TokenService } from '../services/token.service'
import type { AuthenticatedRequest } from '../types/auth.types'

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token)
      throw new ApiException(
        ApiErrorCode.AUTH_REQUIRED,
        'Debes iniciar sesión para acceder a este recurso.',
        401,
      )

    let payload
    try {
      payload = await this.tokenService.verifyAccessToken(token)
      if (!payload || typeof payload.sub !== 'string' || typeof payload.companyId !== 'string')
        throw new Error('Invalid payload')
    } catch {
      throw new ApiException(ApiErrorCode.INVALID_TOKEN, 'La sesión no es válida o expiró.', 401)
    }

    const user = await this.repository.findAuthorizationById(payload.sub)
    if (!user || user.companyId !== payload.companyId || user.status !== UserStatus.ACTIVE) {
      throw new ApiException(
        ApiErrorCode.INVALID_SESSION,
        'La sesión no es válida o el usuario ya no está activo.',
        401,
      )
    }
    request.auth = toSessionUser(user)
    return true
  }
}
