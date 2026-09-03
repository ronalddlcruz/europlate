import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'

type Database = PrismaClient | Prisma.TransactionClient

export const customerRepository = {
  findMany: (where: Prisma.CustomerWhereInput) => prisma.customer.findMany({ where, orderBy: { name: 'asc' } }),
  findById: (id: string, companyId: string) => prisma.customer.findFirst({ where: { id, companyId } }),
  create: (db: Database, data: Prisma.CustomerCreateInput) => db.customer.create({ data }),
  update: (db: Database, id: string, data: Prisma.CustomerUpdateInput) => db.customer.update({ where: { id }, data }),
  remove: (db: Database, id: string) => db.customer.delete({ where: { id } }),
}
