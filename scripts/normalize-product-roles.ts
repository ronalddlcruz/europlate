import { PrismaClient, ProductRoleType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, category: { select: { name: true } }, subcategory: { select: { name: true } } },
  })

  await prisma.$transaction(products.map(product => {
    const isPizza = product.category?.name === 'Cajas' && product.subcategory?.name === 'Pizza'
    const roles = isPizza
      ? [ProductRoleType.MERCHANDISE, ProductRoleType.FINISHED_PRODUCT]
      : [ProductRoleType.MERCHANDISE, ProductRoleType.SUPPLY]
    return prisma.product.update({ where: { id: product.id }, data: { roles } })
  }))

  console.log(`Tipos normalizados en ${products.length} productos.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
