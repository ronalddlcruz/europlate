import { PrismaClient, ProductStatus, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.upsert({ where: { taxId: 'DEMO-EUROPLATE' }, update: {}, create: { name: 'Europlate Demo', taxId: 'DEMO-EUROPLATE' } })
  await prisma.role.createMany({ data: [{ key: 'admin', name: 'Administrador' }, { key: 'vendedor', name: 'Vendedor' }, { key: 'operador', name: 'Operador' }], skipDuplicates: true })
  await prisma.unit.createMany({ data: [{ code: 'UND', description: 'Unidad', status: ProductStatus.ACTIVE }, { code: 'PLN', description: 'Plancha', status: ProductStatus.ACTIVE }, { code: 'MTR', description: 'Metro', status: ProductStatus.ACTIVE }, { code: 'CJA', description: 'Caja', status: ProductStatus.ACTIVE }], skipDuplicates: true })
  await prisma.warehouse.upsert({ where: { companyId_name: { companyId: company.id, name: 'Almacén Principal' } }, update: {}, create: { companyId: company.id, name: 'Almacén Principal', status: ProductStatus.ACTIVE } })
  const passwordHash = await bcrypt.hash('Europlate123!', 12)
  const admin = await prisma.user.upsert({ where: { email: 'admin@europlate.pe' }, update: { companyId: company.id, name: 'Administrador Demo', passwordHash, status: UserStatus.ACTIVE }, create: { companyId: company.id, name: 'Administrador Demo', email: 'admin@europlate.pe', passwordHash, status: UserStatus.ACTIVE } })
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'admin' } })
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, update: {}, create: { userId: admin.id, roleId: adminRole.id } })
}
main().finally(() => prisma.$disconnect())
