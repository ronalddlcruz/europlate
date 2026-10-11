import { Injectable } from '@nestjs/common'
import { UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ApiErrorCode, ApiException } from '../../../common/errors/api.exception'
import type { LoginDto } from '../dto/login.dto'
import { toSessionUser } from '../mappers/session-user.mapper'
import { AuthRepository } from '../repositories/auth.repository'
import { TokenService } from './token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async login(input: LoginDto) {
    const user = await this.repository.findUserByEmail(input.email.toLowerCase())
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !(await bcrypt.compare(input.password, user.passwordHash))
    ) {
      throw new ApiException(
        ApiErrorCode.INVALID_CREDENTIALS,
        'Correo o contraseña incorrectos.',
        401,
      )
    }
    const sessionUser = toSessionUser(user)
    const accessToken = await this.tokenService.signAccessToken(sessionUser)
    return { accessToken, user: sessionUser }
  }
}
