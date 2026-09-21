import { inventoryService } from '../../inventory/services/inventory.service.js'
import { reportRepository } from '../repositories/report.repository.js'

const amount = (value: { toString(): string } | number) => Number(value)

export const reportService = {
  async dashboard(companyId: string) {
    const [stock, [movements, purchases, imports, production]] = await Promise.all([
      inventoryService.stock(companyId, {}),
      reportRepository.dashboard(companyId),
    ])

    return {
      stock: stock.map(row => ({ ...row, roles: row.roles })),
      movements: movements.map(row => ({
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
      })),
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
        currency: row.currency,
        total: amount(row.totalUsd),
        status: row.status,
      })),
      production: production.map(row => ({
        id: row.id,
        number: row.number,
        product: row.product.name,
        warehouse: row.warehouse.name,
        quantity: amount(row.quantity),
        date: row.scheduledAt,
        status: row.status,
        outputDispatched: row.outputDispatched,
      })),
    }
  },
}
