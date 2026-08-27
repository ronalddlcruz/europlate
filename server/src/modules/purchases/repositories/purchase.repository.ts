import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
const include = { supplier: true, documents: true, items: { include: { product: true, presentation: { include: { unit: true } }, warehouse: true } } } satisfies Prisma.PurchaseInclude
type Database = PrismaClient | Prisma.TransactionClient
export const purchaseRepository = {
  findMany: (where: Prisma.PurchaseWhereInput) => prisma.purchase.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
  findById: (id: string, companyId: string) => prisma.purchase.findFirst({ where: { id, companyId }, include }),
  findDuplicateInvoice: (companyId: string, supplierId: string, supplierInvoiceNumber: string) => prisma.purchase.findFirst({ where: { companyId, supplierId, supplierInvoiceNumber } }),
  create: (db: Database, data: Prisma.PurchaseCreateInput) => db.purchase.create({ data, include }),
  update: (db: Database, id: string, data: Prisma.PurchaseUpdateInput) => db.purchase.update({ where: { id }, data, include }),
  remove: (db: Database, id: string) => db.purchase.delete({ where: { id } }),
  catalog: (companyId: string) => Promise.all([prisma.supplier.findMany({ where: { companyId, type: 'NATIONAL', status: 'ACTIVE' }, orderBy: { name: 'asc' } }), prisma.product.findMany({ where: { status: 'ACTIVE', presentations: { some: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }), prisma.warehouse.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } })]),
}
