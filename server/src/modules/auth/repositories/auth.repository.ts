import { prisma } from '../../../infrastructure/database/prisma.client.js'
const userWithPermissions = { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }, permissions: { include: { permission: true } } } as const
export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email }, include: userWithPermissions }),
  findUserById: (id: string) => prisma.user.findUnique({ where: { id }, include: userWithPermissions }),
}
