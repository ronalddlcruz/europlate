import { prisma } from '../../../infrastructure/database/prisma.client.js'
export const authRepository = { findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }, permissions: { include: { permission: true } } } }) }
