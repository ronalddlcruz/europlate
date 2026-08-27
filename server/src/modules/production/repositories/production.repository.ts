import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

const include = { product: true, presentation: { include: { unit: true } }, warehouse: true, materials: { include: { product: true, presentation: { include: { unit: true } }, warehouse: true }, orderBy: { id: 'asc' } } } satisfies Prisma.ProductionOrderInclude
type Database = PrismaClient | Prisma.TransactionClient
export const productionRepository = {
  findMany: (where: Prisma.ProductionOrderWhereInput) => prisma.productionOrder.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
  findById: (id: string, companyId: string) => prisma.productionOrder.findFirst({ where: { id, companyId }, include }),
  create: (db: Database, data: Prisma.ProductionOrderCreateInput) => db.productionOrder.create({ data, include }),
  update: (db: Database, id: string, data: Prisma.ProductionOrderUpdateInput) => db.productionOrder.update({ where: { id }, data, include }),
  remove: (db: Database, id: string) => db.productionOrder.delete({ where: { id } }),
  catalog: (companyId: string) => Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE', roles: { has: 'FINISHED_PRODUCT' }, presentations: { some: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }),
    prisma.product.findMany({ where: { status: 'ACTIVE', roles: { has: 'SUPPLY' }, presentations: { some: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }),
    prisma.warehouse.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.stock.findMany({ where: { warehouse: { companyId } }, select: { productId: true, warehouseId: true, quantity: true } }),
  ]),
}
