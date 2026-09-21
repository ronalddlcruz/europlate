import { prisma } from '../../../infrastructure/database/prisma.client.js'

export const reportRepository = {
  dashboard: (companyId: string) => Promise.all([
    prisma.inventoryMovement.findMany({
      where: { warehouse: { companyId } },
      include: { product: true, presentation: { include: { unit: true } }, warehouse: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchase.findMany({
      where: { companyId },
      include: { supplier: true },
      orderBy: { purchaseDate: 'desc' },
    }),
    prisma.import.findMany({
      where: { companyId },
      include: { supplier: true },
      orderBy: { arrivalDate: 'desc' },
    }),
    prisma.productionOrder.findMany({
      where: { companyId },
      include: { product: true, warehouse: true },
      orderBy: { scheduledAt: 'desc' },
    }),
  ]),
}
