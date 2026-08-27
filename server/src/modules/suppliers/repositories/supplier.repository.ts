import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

type Database = PrismaClient | Prisma.TransactionClient

export const supplierRepository = {
  findMany: (where: Prisma.SupplierWhereInput) => prisma.supplier.findMany({ where, orderBy: { name: 'asc' } }),
  findById: (id: string, companyId: string) => prisma.supplier.findFirst({ where: { id, companyId } }),
  findByTaxId: (companyId: string, taxId: string) => prisma.supplier.findFirst({ where: { companyId, taxId } }),
  create: (db: Database, data: Prisma.SupplierCreateInput) => db.supplier.create({ data }),
  update: (db: Database, id: string, data: Prisma.SupplierUpdateInput) => db.supplier.update({ where: { id }, data }),
  remove: (db: Database, id: string) => db.supplier.delete({ where: { id } }),
}
