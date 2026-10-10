import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { importScopeWhere, productionScopeWhere, purchaseScopeWhere, type OperationScope } from '../../../shared/security/operation-scope.js'

export const reportRepository = {
  movements: (companyId: string, scope: OperationScope) => prisma.inventoryMovement.findMany({
    where: { warehouse: { companyId }, ...(scope && { warehouseId: { in: scope.warehouseIds }, createdByUserId: scope.userId }) },
    select: { id: true, createdAt: true, type: true, productId: true, quantity: true, reference: true, note: true, product: { select: { code: true, name: true } }, presentation: { select: { name: true, unit: { select: { code: true } } } }, warehouse: { select: { name: true } }, createdBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  }),
  purchases: (companyId: string, scope: OperationScope) => prisma.purchase.findMany({
    where: { companyId, ...purchaseScopeWhere(scope) },
    select: { id: true, number: true, purchaseDate: true, currency: true, total: true, status: true, supplier: { select: { name: true } } },
    orderBy: { purchaseDate: 'desc' },
  }),
  imports: (companyId: string, scope: OperationScope) => prisma.import.findMany({
    where: { companyId, ...importScopeWhere(scope) },
    select: { id: true, number: true, arrivalDate: true, createdAt: true, currency: true, totalUsd: true, status: true, supplier: { select: { name: true } } },
    orderBy: { arrivalDate: 'desc' },
  }),
  production: (companyId: string, scope: OperationScope) => prisma.productionOrder.findMany({
    where: { companyId, ...productionScopeWhere(scope) },
    select: { id: true, number: true, quantity: true, scheduledAt: true, status: true, outputDispatched: true, product: { select: { name: true } }, warehouse: { select: { name: true } } },
    orderBy: { scheduledAt: 'desc' },
  }),
}
