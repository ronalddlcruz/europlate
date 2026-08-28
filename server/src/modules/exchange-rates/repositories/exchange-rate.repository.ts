import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { withDatabaseRetry } from '../../../infrastructure/database/with-database-retry.js'
type Database = PrismaClient | Prisma.TransactionClient
const include = { createdBy: { select: { name: true, email: true } } } satisfies Prisma.ExchangeRateInclude
export const exchangeRateRepository = {
  list: (companyId: string) => withDatabaseRetry(() => prisma.exchangeRate.findMany({ where: { companyId }, include, orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }] })),
  current: (companyId: string) => withDatabaseRetry(() => prisma.exchangeRate.findFirst({ where: { companyId }, include, orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }] })),
  findById: (companyId: string, id: string) => withDatabaseRetry(() => prisma.exchangeRate.findFirst({ where: { id, companyId }, include })),
  create: (db: Database, data: Prisma.ExchangeRateCreateInput) => db.exchangeRate.create({ data, include }),
  update: (db: Database, id: string, data: Prisma.ExchangeRateUpdateInput) => db.exchangeRate.update({ where: { id }, data, include }),
  remove: (db: Database, id: string) => db.exchangeRate.delete({ where: { id } }),
  upsertForDate: (db: Database, companyId: string, effectiveDate: Date, data: Omit<Prisma.ExchangeRateUncheckedCreateInput, 'id' | 'companyId' | 'effectiveDate'>) => db.exchangeRate.upsert({ where: { companyId_effectiveDate: { companyId, effectiveDate } }, create: { ...data, companyId, effectiveDate }, update: data, include }),
}
