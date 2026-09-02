import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserStatus } from '@prisma/client'
import { env } from '../../../config/env.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { authRepository } from '../repositories/auth.repository.js'
import type { LoginInput } from '../schemas/auth.schema.js'

const sessionUser = (user: NonNullable<Awaited<ReturnType<typeof authRepository.findUserByEmail>>>) => {
  const roleKeys = user.roles.map(entry => entry.role.key)
  const permissions = roleKeys.includes('admin') ? ['*'] : [...new Set([...user.roles.flatMap(entry => entry.role.permissions.map(item => item.permission.key)), ...user.permissions.map(item => item.permission.key)])]
  return { id: user.id, name: user.name, email: user.email, companyId: user.companyId, permissions }
}

export const authService = {
  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email.toLowerCase())
    if (!user || user.status !== UserStatus.ACTIVE || !await bcrypt.compare(input.password, user.passwordHash)) throw new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401)
    const session = sessionUser(user)
    const accessToken = jwt.sign({ companyId: user.companyId, permissions: session.permissions }, env.JWT_SECRET, { subject: user.id, expiresIn: '8h' })
    return { accessToken, user: session }
  },
  async getSession(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user || user.status !== UserStatus.ACTIVE) throw new AppError('INVALID_SESSION', 'La sesión no es válida o el usuario ya no está activo.', 401)
    return { user: sessionUser(user) }
  },
}
