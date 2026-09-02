import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

const productInclude = { category: true, subcategory: true, brand: true, attributes: { orderBy: { position: 'asc' } }, presentations: { include: { unit: true }, orderBy: { name: 'asc' } }, identifiers: true } satisfies Prisma.ProductInclude
type Database = PrismaClient | Prisma.TransactionClient

export const productRepository = {
  findMany: (where: Prisma.ProductWhereInput) => prisma.product.findMany({ where, include: productInclude, orderBy: { name: 'asc' } }),
  findById: (id: string) => prisma.product.findUnique({ where: { id }, include: productInclude }),
  findByCode: (code: string) => prisma.product.findUnique({ where: { code } }),
  listCodes: () => prisma.product.findMany({ select: { code: true } }),
  create: (db: Database, data: Prisma.ProductCreateInput) => db.product.create({ data, include: productInclude }),
  update: (db: Database, id: string, data: Prisma.ProductUpdateInput) => db.product.update({ where: { id }, data, include: productInclude }),
  delete: (id: string) => prisma.product.delete({ where: { id } }),
  listUnits: () => prisma.unit.findMany({ orderBy: { code: 'asc' } }),
  listCategories: () => prisma.category.findMany({ include: { subcategories: { orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }),
  findUnit: (id: string) => prisma.unit.findUnique({ where: { id } }),
  findUnitByCode: (code: string) => prisma.unit.findUnique({ where: { code } }),
  createUnit: (data: Prisma.UnitCreateInput) => prisma.unit.create({ data }),
  updateUnit: (id: string, data: Prisma.UnitUpdateInput) => prisma.unit.update({ where: { id }, data }),
  deleteUnit: (id: string) => prisma.unit.delete({ where: { id } }),
}
