import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    include: { attributes: true, subcategories: true, products: { include: { attributes: { orderBy: { position: 'asc' } } }, orderBy: { name: 'asc' } } },
  })

  await prisma.$transaction(async (db) => {
    for (const category of categories) {
      // Nunca reemplaza una configuración existente: completa únicamente categorías vacías.
      if (category.attributes.length || category.subcategories.length) continue
      const products = category.products
      const first = products[0]?.attributes ?? []
      const commonNames = first
        .filter(attribute => products.every(product => product.attributes.some(candidate => candidate.name === attribute.name)))
        .map(attribute => attribute.name)
      const representative = new Map(first.map(attribute => [attribute.name, attribute]))

      await db.category.update({ where: { id: category.id }, data: {
        code: category.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || null,
        description: `Definición de atributos para ${category.name}.`,
        attributes: { create: commonNames.map((name, position) => {
          const attribute = representative.get(name)!
          return { name, dataType: attribute.dataType, suffix: attribute.suffix, required: attribute.required, status: attribute.status, position }
        }) },
        subcategories: { create: products.map((product) => ({
          code: product.code,
          name: product.name,
          description: `Tipo ${product.name} de ${category.name}.`,
          status: product.status,
          attributes: { create: product.attributes.filter(attribute => !commonNames.includes(attribute.name)).map((attribute, position) => ({ name: attribute.name, dataType: attribute.dataType, suffix: attribute.suffix, required: attribute.required, status: attribute.status, position })) },
          products: { connect: { id: product.id } },
        })) },
      } })
    }
  }, { timeout: 60_000 })

  const [categoryLinks, subcategoryLinks] = await Promise.all([
    prisma.categoryAttribute.findMany(),
    prisma.subcategoryAttribute.findMany(),
  ])
  const links = [...categoryLinks, ...subcategoryLinks]
  const definitions = new Map<string, string>()
  for (const link of links) {
    let definitionId = definitions.get(link.name)
    if (!definitionId) {
      const code = link.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30).toUpperCase()
      const definition = await prisma.attributeDefinition.upsert({
        where: { name: link.name },
        update: {},
        create: { code, name: link.name, dataType: link.dataType, suffix: link.suffix, status: link.status },
      })
      definitionId = definition.id
      definitions.set(link.name, definitionId)
    }
    if ('categoryId' in link) await prisma.categoryAttribute.update({ where: { id: link.id }, data: { attributeDefinitionId: definitionId } })
    else await prisma.subcategoryAttribute.update({ where: { id: link.id }, data: { attributeDefinitionId: definitionId } })
  }

  console.log(`Configuración creada para ${categories.length} categorías y ${definitions.size} atributos globales.`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
