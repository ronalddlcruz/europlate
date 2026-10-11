import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserStatus } from '@prisma/client'
import { env } from '../../../config/env.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { authRepository } from '../repositories/auth.repository.js'
import { AUTH_TOKEN_TTL } from '../constants/auth.constants.js'
import { sessionUser } from '../domain/session-user.js'
import type { LoginInput } from '../schemas/auth.schema.js'
import type { SessionUser } from '../types/auth.types.js'

export const authService = {
  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email.toLowerCase())
    if (!user || user.status !== UserStatus.ACTIVE || !await bcrypt.compare(input.password, user.passwordHash)) throw new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401)
    const session = sessionUser(user)
    const accessToken = jwt.sign({ companyId: user.companyId, permissions: session.permissions }, env.JWT_SECRET, { subject: user.id, expiresIn: AUTH_TOKEN_TTL })
    return { accessToken, user: session }
  },
  getSession(user: SessionUser) {
    return { user }
  },
}
