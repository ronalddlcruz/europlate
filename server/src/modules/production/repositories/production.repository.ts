import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

const activePresentation = {
  where: { status: 'ACTIVE' },
  orderBy: { name: 'asc' },
  take: 1,
  include: { unit: true },
} satisfies Prisma.Product$presentationsArgs

const productInclude = { presentations: activePresentation } satisfies Prisma.ProductInclude
const include = {
  product: { include: productInclude },
  warehouse: true,
  materials: {
    include: { product: { include: productInclude }, warehouse: true },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.ProductionOrderInclude

type Database = PrismaClient | Prisma.TransactionClient

export const productionRepository = {
  findMany: (where: Prisma.ProductionOrderWhereInput) =>
    prisma.productionOrder.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
  findById: (id: string, companyId: string, db: Database = prisma) =>
    db.productionOrder.findFirst({ where: { id, companyId }, include }),
  create: (db: Database, data: Prisma.ProductionOrderCreateInput) =>
    db.productionOrder.create({ data, include }),
  update: (db: Database, id: string, data: Prisma.ProductionOrderUpdateInput) =>
    db.productionOrder.update({ where: { id }, data, include }),
  remove: (db: Database, id: string) => db.productionOrder.delete({ where: { id } }),
  catalog: (companyId: string) =>
    Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE', roles: { has: 'FINISHED_PRODUCT' }, presentations: { some: { status: 'ACTIVE' } } },
        orderBy: { name: 'asc' },
        include: productInclude,
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', roles: { has: 'SUPPLY' }, presentations: { some: { status: 'ACTIVE' } } },
        orderBy: { name: 'asc' },
        include: productInclude,
      }),
      prisma.warehouse.findMany({
        where: { companyId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      }),
      prisma.stock.findMany({
        where: { warehouse: { companyId } },
        select: { productId: true, warehouseId: true, quantity: true },
      }),
      prisma.customer.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.productionMaterial.findMany({ where: { status: 'RESERVED', shareReservation: false, order: { companyId } }, select: { productId: true, warehouseId: true } }),
    ]),
}
