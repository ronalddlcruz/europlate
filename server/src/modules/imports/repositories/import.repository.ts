import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

const include = {
  supplier: true,
  customsAgent: true,
  documents: true,
  items: { include: { product: true, presentation: { include: { unit: true } }, warehouse: true } },
} satisfies Prisma.ImportInclude
type Database = PrismaClient | Prisma.TransactionClient

export const importRepository = {
  findMany: (where: Prisma.ImportWhereInput) => prisma.import.findMany({ where, include, orderBy: { createdAt: 'desc' } }),
  findById: (id: string, companyId: string) => prisma.import.findFirst({ where: { id, companyId }, include }),
  findDuplicateDua: (companyId: string, duaNumber: string) => prisma.import.findFirst({ where: { companyId, duaNumber } }),
  create: (db: Database, data: Prisma.ImportCreateInput) => db.import.create({ data, include }),
  update: (db: Database, id: string, data: Prisma.ImportUpdateInput) => db.import.update({ where: { id }, data, include }),
  remove: (db: Database, id: string) => db.import.delete({ where: { id } }),
  catalog: (companyId: string) => Promise.all([
    prisma.supplier.findMany({ where: { companyId, type: 'FOREIGN', status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.customsAgent.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { status: 'ACTIVE', presentations: { some: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }),
    prisma.warehouse.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
  ]),
}
