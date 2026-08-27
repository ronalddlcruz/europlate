import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
type Database = PrismaClient | Prisma.TransactionClient
const userInclude = { roles: { include: { role: true } }, permissions: { include: { permission: true } } } satisfies Prisma.UserInclude
export const userRepository = {
  findMany: (companyId: string) => prisma.user.findMany({ where: { companyId }, include: userInclude, orderBy: { name: 'asc' } }),
  findById: (companyId: string, id: string) => prisma.user.findFirst({ where: { id, companyId }, include: userInclude }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findRole: (id: string) => prisma.role.findUnique({ where: { id } }),
  findRoles: () => prisma.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { name: 'asc' } }),
  findPermissions: () => prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }),
  create: (db: Database, data: Prisma.UserCreateInput) => db.user.create({ data, include: userInclude }),
  update: (db: Database, id: string, data: Prisma.UserUpdateInput) => db.user.update({ where: { id }, data, include: userInclude }),
  remove: (db: Database, id: string) => db.user.delete({ where: { id } }),
  replaceRolePermissions: (db: Database, roleId: string, permissionIds: string[]) => db.role.update({ where: { id: roleId }, data: { permissions: { deleteMany: {}, create: permissionIds.map(permissionId => ({ permissionId })) } }, include: { permissions: { include: { permission: true } } } }),
  audit: (db: Database, data: Prisma.AuditLogCreateInput) => db.auditLog.create({ data }),
  auditLogs: (companyId: string) => prisma.auditLog.findMany({ where: { user: { is: { companyId } } }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
}
