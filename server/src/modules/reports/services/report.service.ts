import { inventoryService } from '../../inventory/services/inventory.service.js'
import { reportRepository } from '../repositories/report.repository.js'
import type { OperationScope } from '../../../shared/security/operation-scope.js'

const amount = (value: { toString(): string } | number) => Number(value)

export const reportService = {
  stock: (companyId: string) => inventoryService.stock(companyId, { includeValuation: false }),
  async movements(companyId: string, scope: OperationScope) {
    const movements = await reportRepository.movements(companyId, scope)
    return movements.map(row => ({
        id: row.id,
        createdAt: row.createdAt,
        type: row.type,
        productId: row.productId,
        code: row.product.code,
        product: row.product.name,
        presentation: row.presentation?.name ?? row.product.name,
        unit: row.presentation?.unit.code ?? 'UND',
        warehouse: row.warehouse.name,
        quantity: amount(row.quantity),
        reference: row.reference ?? '—',
        note: row.note ?? null,
        user: row.createdBy?.name ?? row.createdBy?.email ?? 'Sistema',
      }))
  },
  async purchases(companyId: string, scope: OperationScope) {
    const [purchases, imports] = await Promise.all([reportRepository.purchases(companyId, scope), reportRepository.imports(companyId, scope)])
    return {
      purchases: purchases.map(row => ({
        id: row.id,
        number: row.number,
        type: 'Compra nacional',
        supplier: row.supplier.name,
        date: row.purchaseDate,
        currency: row.currency,
        total: amount(row.total),
        status: row.status,
      })),
      imports: imports.map(row => ({
        id: row.id,
        number: row.number,
        type: 'Importación',
        supplier: row.supplier.name,
        date: row.arrivalDate ?? row.createdAt,
        registeredAt: row.createdAt,
        currency: row.currency,
        total: amount(row.totalUsd),
        status: row.status,
      })),
    }
  },
  async production(companyId: string, scope: OperationScope) {
    const production = await reportRepository.production(companyId, scope)
    return production.map(row => ({
        id: row.id,
        number: row.number,
        product: row.product.name,
        warehouse: row.warehouse.name,
        quantity: amount(row.quantity),
        date: row.scheduledAt,
        status: row.status,
        outputDispatched: row.outputDispatched,
      }))
  },
  async dashboard(companyId: string, scope: OperationScope) {
    // Compatibilidad con el resumen principal; la pantalla de reportes usa
    // los endpoints individuales y no espera cálculos de otras secciones.
    const [stock, movements, { purchases, imports }, production] = await Promise.all([
      this.stock(companyId), this.movements(companyId, scope), this.purchases(companyId, scope), this.production(companyId, scope),
    ])
    return {
      stock, movements, purchases, imports, production,
    }
  },
}
