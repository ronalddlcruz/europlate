import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
type Database = PrismaClient | Prisma.TransactionClient
export const customsAgentRepository = {
  findMany: (where: Prisma.CustomsAgentWhereInput) => prisma.customsAgent.findMany({ where, orderBy: { name: 'asc' } }),
  findById: (id: string, companyId: string) => prisma.customsAgent.findFirst({ where: { id, companyId } }),
  findByRuc: (companyId: string, ruc: string) => prisma.customsAgent.findFirst({ where: { companyId, ruc } }),
  create: (db: Database, data: Prisma.CustomsAgentCreateInput) => db.customsAgent.create({ data }),
  update: (db: Database, id: string, data: Prisma.CustomsAgentUpdateInput) => db.customsAgent.update({ where: { id }, data }),
  remove: (db: Database, id: string) => db.customsAgent.delete({ where: { id } }),
}
