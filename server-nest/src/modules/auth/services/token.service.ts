import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AUTH_TOKEN_TTL } from '../constants/auth.constants'
import type { AccessTokenPayload, SessionUser } from '../types/auth.types'

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(user: SessionUser): Promise<string> {
    return this.jwt.signAsync(
      { companyId: user.companyId, permissions: user.permissions },
      { subject: user.id, expiresIn: AUTH_TOKEN_TTL },
    )
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token)
  }
}
