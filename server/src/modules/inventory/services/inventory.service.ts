import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { inventoryRepository } from '../repositories/inventory.repository.js'
import type { InventoryAdjustmentInput, StockTransferInput, WarehouseInput } from '../schemas/inventory.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

async function validateProductLine(companyId: string, input: { productId: string; presentationId: string; warehouseId: string }) {
  const [product, presentation, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: input.productId, status: ProductStatus.ACTIVE } }),
    prisma.productPresentation.findFirst({ where: { id: input.presentationId, status: ProductStatus.ACTIVE } }),
    prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId, status: ProductStatus.ACTIVE } }),
  ])
  if (!product || !presentation || !warehouse || presentation.productId !== product.id) throw new AppError('INVENTORY_REFERENCE_INVALID', 'El producto, presentación o almacén no está disponible.', 422)
  return { product, presentation, warehouse }
}
const account = (userId: string, companyId: string) => ({ createdBy: { connect: { id: userId } }, company: { connect: { id: companyId } } })

export const inventoryService = {
  async stock(companyId: string, filters: { search?: string; warehouseId?: string }) {
    const [stocks, reserved] = await Promise.all([inventoryRepository.stock(companyId), inventoryRepository.reserved(companyId)])
    const grouped = new Map<string, { product: typeof stocks[number]['product']; entries: typeof stocks; reserved: Prisma.Decimal }>()
    for (const entry of stocks) { const current = grouped.get(entry.productId) ?? { product: entry.product, entries: [] as typeof stocks, reserved: new Prisma.Decimal(0) }; current.entries.push(entry); grouped.set(entry.productId, current) }
    for (const material of reserved) { const current = grouped.get(material.productId); if (current) current.reserved = current.reserved.plus(material.quantity.mul(material.presentation.factor)) }
    return [...grouped.values()].map(({ product, entries, reserved: reservedQuantity }) => {
      const presentation = product.presentations[0]; const visibleEntries = filters.warehouseId ? entries.filter(entry => entry.warehouseId === filters.warehouseId) : entries
      const total = visibleEntries.reduce((sum, entry) => sum.plus(entry.quantity), new Prisma.Decimal(0)); const reservedValue = filters.warehouseId ? reserved.filter(item => item.warehouseId === filters.warehouseId && item.productId === product.id).reduce((sum, item) => sum.plus(item.quantity.mul(item.presentation.factor)), new Prisma.Decimal(0)) : reservedQuantity
      return { productId: product.id, code: product.code, product: product.name, presentation: presentation?.name ?? '—', presentationId: presentation?.id ?? null, unit: presentation?.unit.code ?? '—', minimum: Number(presentation?.minimumStock ?? 0), total: Number(total), available: Number(Prisma.Decimal.max(total.minus(reservedValue), 0)), inProduction: Number(reservedValue), costUsd: 0, costPen: 0, warehouses: entries.map(entry => ({ id: entry.warehouseId, name: entry.warehouse.name, quantity: Number(entry.quantity) })) }
    }).filter(item => !filters.search || `${item.code} ${item.product} ${item.presentation}`.toLowerCase().includes(filters.search.toLowerCase()))
  },
  movements: (companyId: string) => inventoryRepository.movements(companyId),
  transfers: (companyId: string) => inventoryRepository.transfers(companyId),
  adjustments: (companyId: string) => inventoryRepository.adjustments(companyId),
  warehouses: (companyId: string) => inventoryRepository.warehouses(companyId),
  catalog: (companyId: string) => inventoryRepository.catalog(companyId),
  async createTransfer(companyId: string, userId: string, input: StockTransferInput) {
    const [{ presentation }] = await Promise.all([validateProductLine(companyId, { productId: input.productId, presentationId: input.presentationId, warehouseId: input.fromWarehouseId }), validateProductLine(companyId, { productId: input.productId, presentationId: input.presentationId, warehouseId: input.toWarehouseId })])
    const baseQuantity = decimal(input.quantity).mul(presentation.factor)
    return transaction(async db => {
      const source = await db.stock.findUnique({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.fromWarehouseId } } })
      if (!source || source.quantity.lessThan(baseQuantity)) throw new AppError('INVENTORY_INSUFFICIENT_STOCK', 'El almacén origen no tiene stock suficiente para esta transferencia.', 422)
      await db.stock.update({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.fromWarehouseId } }, data: { quantity: { decrement: baseQuantity } } })
      await db.stock.upsert({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.toWarehouseId } }, create: { productId: input.productId, warehouseId: input.toWarehouseId, quantity: baseQuantity }, update: { quantity: { increment: baseQuantity } } })
      const transfer = await inventoryRepository.createTransfer(db, { ...account(userId, companyId), product: { connect: { id: input.productId } }, presentation: { connect: { id: input.presentationId } }, fromWarehouse: { connect: { id: input.fromWarehouseId } }, toWarehouse: { connect: { id: input.toWarehouseId } }, quantity: decimal(input.quantity), note: input.note || null })
      await db.inventoryMovement.createMany({ data: [{ productId: input.productId, presentationId: input.presentationId, warehouseId: input.fromWarehouseId, createdByUserId: userId, type: 'TRANSFER_OUT', quantity: baseQuantity.negated(), reference: transfer.id, note: `→ ${transfer.toWarehouse.name}${input.note ? ` · ${input.note}` : ''}` }, { productId: input.productId, presentationId: input.presentationId, warehouseId: input.toWarehouseId, createdByUserId: userId, type: 'TRANSFER_IN', quantity: baseQuantity, reference: transfer.id, note: `← ${transfer.fromWarehouse.name}${input.note ? ` · ${input.note}` : ''}` }] })
      return transfer
    })
  },
  async createAdjustment(companyId: string, userId: string, input: InventoryAdjustmentInput) {
    const { presentation } = await validateProductLine(companyId, input)
    const baseDelta = decimal(input.delta).mul(presentation.factor)
    return transaction(async db => {
      const current = await db.stock.findUnique({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } } }); const previous = current?.quantity ?? new Prisma.Decimal(0); const next = previous.plus(baseDelta)
      if (next.isNegative()) throw new AppError('INVENTORY_NEGATIVE_STOCK', 'El ajuste no puede dejar el stock en negativo.', 422)
      await db.stock.upsert({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } }, create: { productId: input.productId, warehouseId: input.warehouseId, quantity: next }, update: { quantity: next } })
      await db.productPresentation.update({ where: { id: input.presentationId }, data: { currentStock: { increment: decimal(input.delta) } } })
      const adjustment = await inventoryRepository.createAdjustment(db, { ...account(userId, companyId), product: { connect: { id: input.productId } }, presentation: { connect: { id: input.presentationId } }, warehouse: { connect: { id: input.warehouseId } }, previousQuantity: previous, newQuantity: next, reason: input.reason })
      await db.inventoryMovement.create({ data: { productId: input.productId, presentationId: input.presentationId, warehouseId: input.warehouseId, createdByUserId: userId, type: input.delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', quantity: baseDelta, reference: adjustment.id, note: input.reason } })
      return adjustment
    })
  },
  async createWarehouse(companyId: string, input: WarehouseInput) { const duplicate = await prisma.warehouse.findFirst({ where: { companyId, name: { equals: input.name, mode: 'insensitive' } } }); if (duplicate) throw new AppError('WAREHOUSE_EXISTS', 'Ya existe un almacén con ese nombre.', 409); return inventoryRepository.createWarehouse({ company: { connect: { id: companyId } }, name: input.name, location: input.location || null, description: input.description || null, status: input.status }) },
  async updateWarehouse(companyId: string, id: string, input: Partial<WarehouseInput>) { if (!await inventoryRepository.findWarehouse(id, companyId)) throw new AppError('WAREHOUSE_NOT_FOUND', 'El almacén no existe.', 404); if (input.name) { const duplicate = await prisma.warehouse.findFirst({ where: { companyId, name: { equals: input.name, mode: 'insensitive' }, NOT: { id } } }); if (duplicate) throw new AppError('WAREHOUSE_EXISTS', 'Ya existe un almacén con ese nombre.', 409) }; return inventoryRepository.updateWarehouse(id, { ...input, ...(input.location !== undefined && { location: input.location || null }), ...(input.description !== undefined && { description: input.description || null }) }) },
  async removeWarehouse(companyId: string, id: string) { if (!await inventoryRepository.findWarehouse(id, companyId)) throw new AppError('WAREHOUSE_NOT_FOUND', 'El almacén no existe.', 404); const [stock, movements, transfers, adjustments] = await Promise.all([prisma.stock.count({ where: { warehouseId: id, quantity: { not: 0 } } }), prisma.inventoryMovement.count({ where: { warehouseId: id } }), prisma.stockTransfer.count({ where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] } }), prisma.inventoryAdjustment.count({ where: { warehouseId: id } })]); if (stock || movements || transfers || adjustments) throw new AppError('WAREHOUSE_IN_USE', 'No se puede eliminar un almacén con stock o historial. Desactívalo en su lugar.', 409); await inventoryRepository.removeWarehouse(id) },
}
