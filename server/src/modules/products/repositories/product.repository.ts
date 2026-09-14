import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

const categoryInclude = { attributes: { include: { attributeDefinition: true }, orderBy: { position: 'asc' } }, subcategories: { include: { attributes: { include: { attributeDefinition: true }, orderBy: { position: 'asc' } } }, orderBy: { name: 'asc' } } } satisfies Prisma.CategoryInclude
const productInclude = { category: { include: categoryInclude }, subcategory: { include: { attributes: { orderBy: { position: 'asc' } } } }, brand: true, attributes: { orderBy: { position: 'asc' } }, presentations: { include: { unit: true }, orderBy: { name: 'asc' } }, identifiers: true } satisfies Prisma.ProductInclude
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
  listCategories: () => prisma.category.findMany({ include: categoryInclude, orderBy: { name: 'asc' } }),
  findCategory: (id: string) => prisma.category.findUnique({ where: { id }, include: categoryInclude }),
  findCategoryByName: (name: string) => prisma.category.findUnique({ where: { name }, include: categoryInclude }),
  createCategory: (data: Prisma.CategoryCreateInput) => prisma.category.create({ data, include: categoryInclude }),
  updateCategory: (id: string, data: Prisma.CategoryUpdateInput) => prisma.category.update({ where: { id }, data, include: categoryInclude }),
  deleteCategory: (id: string) => prisma.category.delete({ where: { id } }),
  listAttributeDefinitions: () => prisma.attributeDefinition.findMany({ orderBy: { name: 'asc' } }),
  findAttributeDefinition: (id: string) => prisma.attributeDefinition.findUnique({ where: { id } }),
  findAttributeDefinitionByCode: (code: string) => prisma.attributeDefinition.findUnique({ where: { code } }),
  findAttributeDefinitionByName: (name: string) => prisma.attributeDefinition.findUnique({ where: { name } }),
  createAttributeDefinition: (data: Prisma.AttributeDefinitionCreateInput) => prisma.attributeDefinition.create({ data }),
  updateAttributeDefinition: (id: string, data: Prisma.AttributeDefinitionUpdateInput) => prisma.attributeDefinition.update({ where: { id }, data }),
  deleteAttributeDefinition: (id: string) => prisma.attributeDefinition.delete({ where: { id } }),
  findUnit: (id: string) => prisma.unit.findUnique({ where: { id } }),
  findUnitByCode: (code: string) => prisma.unit.findUnique({ where: { code } }),
  createUnit: (data: Prisma.UnitCreateInput) => prisma.unit.create({ data }),
  updateUnit: (id: string, data: Prisma.UnitUpdateInput) => prisma.unit.update({ where: { id }, data }),
  deleteUnit: (id: string) => prisma.unit.delete({ where: { id } }),
}
