import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserStatus } from '@prisma/client'
import { env } from '../../../config/env.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { authRepository } from '../repositories/auth.repository.js'
import type { LoginInput } from '../schemas/auth.schema.js'

export const authService = { async login(input: LoginInput) { const user = await authRepository.findUserByEmail(input.email.toLowerCase()); if (!user || user.status !== UserStatus.ACTIVE || !await bcrypt.compare(input.password, user.passwordHash)) throw new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401); const roleKeys = user.roles.map(entry => entry.role.key); const permissions = roleKeys.includes('admin') ? ['*'] : [...new Set([...user.roles.flatMap(entry => entry.role.permissions.map(item => item.permission.key)), ...user.permissions.map(item => item.permission.key)])]; const accessToken = jwt.sign({ companyId: user.companyId, permissions }, env.JWT_SECRET, { subject: user.id, expiresIn: '8h' }); return { accessToken, user: { id: user.id, name: user.name, email: user.email, companyId: user.companyId, permissions } } } }
