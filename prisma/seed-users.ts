import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { PrismaClient, UserStatus } from '@prisma/client'

dotenv.config({ path: '.seed-users.env' })

const prisma = new PrismaClient()

const requiredSecret = (name: string) => {
  const value = process.env[name]
  if (!value || value.length < 12) throw new Error(`Define ${name} con al menos 12 caracteres en .seed-users.env.`)
  return value
}

const users = [
  { name: 'Ronald De la Cruz', email: 'ronald.delacruz@europlate.pe', passwordEnv: 'SEED_RONALD_PASSWORD' },
  { name: 'Sebastian Mercado', email: 'sebastian.mercado@europlate.pe', passwordEnv: 'SEED_SEBASTIAN_PASSWORD' },
] as const

async function main() {
  const company = await prisma.company.findFirst({ select: { id: true } })
  if (!company) throw new Error('No se encontró una empresa para asociar los usuarios administrativos.')

  const adminRole = await prisma.role.upsert({
    where: { key: 'admin' },
    update: { name: 'Administrador' },
    create: { key: 'admin', name: 'Administrador' },
  })

  const passwordHashes = await Promise.all(users.map(async user => ({ ...user, passwordHash: await bcrypt.hash(requiredSecret(user.passwordEnv), 12) })))

  await prisma.$transaction(async db => {
    await db.session.deleteMany()
    await db.user.deleteMany()
    await db.user.createMany({
      data: passwordHashes.map(user => ({ companyId: company.id, name: user.name, email: user.email, passwordHash: user.passwordHash, status: UserStatus.ACTIVE })),
    })
    const created = await db.user.findMany({ where: { email: { in: users.map(user => user.email) } }, select: { id: true } })
    await db.userRole.createMany({ data: created.map(user => ({ userId: user.id, roleId: adminRole.id })) })
  })

  console.log('Usuarios administrativos creados: Ronald De la Cruz y Sebastian Mercado.')
}

main()
  .catch(error => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
