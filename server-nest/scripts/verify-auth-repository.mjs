import 'dotenv/config'
import assert from 'node:assert/strict'
import { PrismaClient, UserStatus } from '@prisma/client'
import repositoryModule from '../dist/modules/auth/repositories/auth.repository.js'
import databaseUrlModule from '../dist/config/database/database-url.js'

const { AuthRepository } = repositoryModule
const { resolveDatabaseUrl } = databaseUrlModule
const baseUrl = process.env.SUPABASE_DATABASE_URL
if (!baseUrl) throw new Error('Falta SUPABASE_DATABASE_URL')
const prisma = new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl(baseUrl) } } })

try {
  await prisma.$connect()
  const users = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    take: 20,
    select: {
      id: true,
      email: true,
      companyId: true,
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
    },
  })
  if (!users.length) throw new Error('No hay usuarios activos para la comparación')
  const repository = new AuthRepository(prisma)
  for (const current of users) {
    const login = await repository.findUserByEmail(current.email)
    const session = await repository.findAuthorizationById(current.id)
    assert.ok(login)
    assert.ok(session)
    assert.equal(login.id, current.id)
    assert.equal(session.companyId, current.companyId)
    assert.equal('passwordHash' in session, false)
    const roles = current.roles.map((item) => item.role.key).sort()
    const rolePermissions = current.roles
      .flatMap((item) => item.role.permissions.map((permission) => permission.permission.key))
      .sort()
    const directPermissions = current.permissions.map((item) => item.permission.key).sort()
    for (const result of [login, session]) {
      assert.deepEqual(result.roleKeys, roles)
      assert.deepEqual(result.rolePermissionKeys, rolePermissions)
      assert.deepEqual(result.directPermissionKeys, directPermissions)
    }
  }
  await prisma.$transaction(async (db) => {
    await db.$queryRaw`SELECT 1`
    await db.$queryRaw`SELECT 2`
  })
  console.log(
    `Repositorio Auth Nest: permisos idénticos en ${users.length} usuarios; transacción de lectura correcta; 0 escrituras.`,
  )
} finally {
  await prisma.$disconnect()
}
