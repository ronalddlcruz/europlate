import { prisma } from '../../../infrastructure/database/prisma.client.js'

// El login y la restauración de sesión sólo necesitan identidad, estado y claves
// de permisos. Evitamos cargar timestamps y columnas no usadas en cada acceso.
const userWithPermissions = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  status: true,
  passwordHash: true,
  roles: {
    select: {
      role: {
        select: {
          key: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  },
  permissions: { select: { permission: { select: { key: true } } } },
} as const

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email }, select: userWithPermissions }),
  findUserById: (id: string) => prisma.user.findUnique({ where: { id }, select: userWithPermissions }),
}
