import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { inventoryRepository } from '../repositories/inventory.repository.js'
import { exchangeRateService } from '../../exchange-rates/services/exchange-rate.service.js'
import type { InventoryAdjustmentInput, StockTransferInput, WarehouseInput } from '../schemas/inventory.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

type ProductCost = { quantity: number; usd: number; pen: number }

function receivedCosts(
  purchases: Awaited<ReturnType<typeof inventoryRepository.costSources>>[0],
  imports: Awaited<ReturnType<typeof inventoryRepository.costSources>>[1],
) {
  const byProduct = new Map<string, ProductCost>()
  const add = (productId: string, quantity: number, usd: number, pen: number) => {
    if (quantity <= 0) return
    const current = byProduct.get(productId) ?? { quantity: 0, usd: 0, pen: 0 }
    byProduct.set(productId, { quantity: current.quantity + quantity, usd: current.usd + usd, pen: current.pen + pen })
  }

  for (const item of purchases) {
    // Los documentos compran unidades de inventario (por ejemplo, Resmas).
    // No se usa el factor actual porque puede editarse después de la compra.
    const quantity = Number(item.quantity)
    const value = Number(item.quantity) * Number(item.unitPrice)
    add(item.productId, quantity, item.purchase.currency === 'USD' ? value : 0, item.purchase.currency === 'PEN' ? value : 0)
  }
  const importTotals = new Map<string, number>()
  for (const item of imports) {
    const lineValue = Number(item.quantity) * Number(item.unitCostUsd)
    importTotals.set(item.importId, (importTotals.get(item.importId) ?? 0) + lineValue)
  }
  for (const item of imports) {
    const quantity = Number(item.quantity)
    const lineValue = Number(item.quantity) * Number(item.unitCostUsd)
    const documentTotal = importTotals.get(item.importId) ?? 0
    const share = documentTotal > 0 ? lineValue / documentTotal : 0
    const usd = (item.import.currency === 'USD' ? lineValue : 0) + Number(item.import.customsCostUsd) * share
    const pen = (item.import.currency === 'PEN' ? lineValue : 0) + Number(item.import.customsCostPen) * share
    add(item.productId, quantity, usd, pen)
  }
  return byProduct
}

async function validateProductLine(companyId: string, input: { productId: string; presentationId: string; warehouseId: string }) {
  const [product, presentation, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: input.productId, status: ProductStatus.ACTIVE } }),
    prisma.productPresentation.findFirst({ where: { id: input.presentationId, status: ProductStatus.ACTIVE } }),
    prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId, status: ProductStatus.ACTIVE } }),
  ])
  if (!product || !presentation || !warehouse || presentation.productId !== product.id) throw new AppError('INVENTORY_REFERENCE_INVALID', 'El producto, presentación o almacén no está disponible.', 422)
  return { product, presentation, warehouse }
}
async function validateAdjustmentLine(companyId: string, input: { productId: string; warehouseId: string }) {
  const [product, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: input.productId, status: ProductStatus.ACTIVE }, include: { presentations: { where: { status: ProductStatus.ACTIVE }, orderBy: { name: 'asc' }, take: 1 } } }),
    prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId, status: ProductStatus.ACTIVE } }),
  ])
  const presentation = product?.presentations[0]
  if (!product || !presentation || !warehouse) throw new AppError('INVENTORY_REFERENCE_INVALID', 'El producto o almacén no está disponible.', 422)
  return { product, presentation, warehouse }
}
const account = (userId: string, companyId: string) => ({ createdBy: { connect: { id: userId } }, company: { connect: { id: companyId } } })
const reservationFactor = (material: { product: { presentations: { factor: Prisma.Decimal }[] } }) => material.product.presentations[0]?.factor ?? new Prisma.Decimal(1)

export const inventoryService = {
  async stock(companyId: string, filters: { search?: string; warehouseId?: string }) {
    const [stocks, reserved, products, [purchases, imports], currentExchangeRate] = await Promise.all([
      inventoryRepository.stock(companyId),
      inventoryRepository.reserved(companyId),
      inventoryRepository.stockProducts(),
      inventoryRepository.costSources(companyId),
      inventoryRepository.currentExchangeRate(companyId),
    ])
    const costsByProduct = receivedCosts(purchases, imports)
    const hasUsdCosts = purchases.some(item => item.purchase.currency === 'USD') || imports.some(item => item.import.currency === 'USD')
    // Reparación transparente para importaciones históricas: si existen costos
    // en USD y aún no hay tasa, se registra una sola tasa vigente. Después de
    // ello las siguientes lecturas quedan locales y la valorización no vuelve
    // a mostrarse en cero.
    let exchangeValue = Number(currentExchangeRate?.value ?? 0)
    if (hasUsdCosts && exchangeValue <= 0) {
      try {
        exchangeValue = Number((await exchangeRateService.ensureCurrent(companyId)).value)
      } catch {
        // Stock debe seguir disponible aun si el proveedor de tasas está caído.
        // La próxima lectura volverá a intentar la reparación automáticamente.
        exchangeValue = 0
      }
    }
    const entriesByProduct = new Map<string, typeof stocks>()
    for (const entry of stocks) entriesByProduct.set(entry.productId, [...(entriesByProduct.get(entry.productId) ?? []), entry])
    const reservedByProduct = new Map<string, Prisma.Decimal>()
    for (const material of reserved) reservedByProduct.set(material.productId, (reservedByProduct.get(material.productId) ?? new Prisma.Decimal(0)).plus(material.quantity.mul(reservationFactor(material))))
    return products.map(product => {
      const presentation = product.presentations.find(item => item.status === ProductStatus.ACTIVE) ?? product.presentations[0]
      const entries = entriesByProduct.get(product.id) ?? []
      const visibleEntries = filters.warehouseId ? entries.filter(entry => entry.warehouseId === filters.warehouseId) : entries
      const recordedTotal = visibleEntries.reduce((sum, entry) => sum.plus(entry.quantity), new Prisma.Decimal(0))
      const total = visibleEntries.length ? recordedTotal : new Prisma.Decimal(presentation?.currentStock ?? 0).mul(presentation?.factor ?? 1)
      const reservedValue = filters.warehouseId
        ? reserved.filter(item => item.warehouseId === filters.warehouseId && item.productId === product.id).reduce((sum, item) => sum.plus(item.quantity.mul(reservationFactor(item))), new Prisma.Decimal(0))
        : reservedByProduct.get(product.id) ?? new Prisma.Decimal(0)
      const cost = costsByProduct.get(product.id)
      const averageUsd = cost && cost.quantity > 0 ? cost.usd / cost.quantity : 0
      const averagePen = cost && cost.quantity > 0 ? cost.pen / cost.quantity : 0
      const totalQuantity = Number(total)
      const factor = presentation?.factor ?? new Prisma.Decimal(1)
      const inventoryQuantity = Number(total.div(factor))
      return { productId: product.id, code: product.code, product: product.name, category: product.category?.name ?? 'Sin categoría', subcategory: product.subcategory?.name ?? '—', roles: product.roles, presentationId: presentation?.id ?? null, unit: presentation?.unit.code ?? '—', unitName: presentation?.unit.description ?? presentation?.unit.code ?? '—', factor: Number(factor), minimum: Number(presentation?.minimumStock ?? 0), total: totalQuantity, available: Number(Prisma.Decimal.max(total.minus(reservedValue), 0)), inProduction: Number(reservedValue), costUsd: inventoryQuantity * averageUsd, costPen: inventoryQuantity * (averagePen + averageUsd * exchangeValue), status: product.status, warehouses: entries.map(entry => ({ id: entry.warehouseId, name: entry.warehouse.name, quantity: Number(entry.quantity) })) }
    }).filter(item => !filters.search || `${item.code} ${item.product}`.toLowerCase().includes(filters.search.toLowerCase()))
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
    const { presentation } = await validateAdjustmentLine(companyId, input)
    const baseDelta = decimal(input.delta).mul(presentation.factor)
    return transaction(async db => {
      const current = await db.stock.findUnique({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } } }); const previous = current?.quantity ?? new Prisma.Decimal(0); const next = previous.plus(baseDelta)
      if (input.delta < 0 && previous.isZero()) throw new AppError('INVENTORY_ZERO_STOCK', 'No se puede registrar una salida porque el producto no tiene stock disponible.', 422)
      if (next.isNegative()) throw new AppError('INVENTORY_NEGATIVE_STOCK', 'El ajuste no puede dejar el stock en negativo.', 422)
      if (input.delta < 0) {
        const customer = await db.customer.findFirst({ where: { id: input.customerId!, companyId, status: ProductStatus.ACTIVE }, select: { id: true } })
        if (!customer) throw new AppError('INVENTORY_CUSTOMER_INVALID', 'Selecciona un cliente activo para la salida.', 422)
      }
      await db.stock.upsert({ where: { productId_warehouseId: { productId: input.productId, warehouseId: input.warehouseId } }, create: { productId: input.productId, warehouseId: input.warehouseId, quantity: next }, update: { quantity: next } })
      await db.productPresentation.update({ where: { id: presentation.id }, data: { currentStock: { increment: decimal(input.delta) } } })
      const adjustment = await inventoryRepository.createAdjustment(db, { ...account(userId, companyId), product: { connect: { id: input.productId } }, presentation: { connect: { id: presentation.id } }, warehouse: { connect: { id: input.warehouseId } }, ...(input.customerId && { customer: { connect: { id: input.customerId } } }), previousQuantity: previous, newQuantity: next, reason: input.reason })
      await db.inventoryMovement.create({ data: { productId: input.productId, presentationId: presentation.id, warehouseId: input.warehouseId, createdByUserId: userId, type: input.delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', quantity: baseDelta, reference: adjustment.id, note: input.reason } })
      return adjustment
    })
  },
  async createWarehouse(companyId: string, input: WarehouseInput) { const duplicate = await prisma.warehouse.findFirst({ where: { companyId, name: { equals: input.name, mode: 'insensitive' } } }); if (duplicate) throw new AppError('WAREHOUSE_EXISTS', 'Ya existe un almacén con ese nombre.', 409); return inventoryRepository.createWarehouse({ company: { connect: { id: companyId } }, name: input.name, location: input.location || null, description: input.description || null, status: input.status }) },
  async updateWarehouse(companyId: string, id: string, input: Partial<WarehouseInput>) { if (!await inventoryRepository.findWarehouse(id, companyId)) throw new AppError('WAREHOUSE_NOT_FOUND', 'El almacén no existe.', 404); if (input.name) { const duplicate = await prisma.warehouse.findFirst({ where: { companyId, name: { equals: input.name, mode: 'insensitive' }, NOT: { id } } }); if (duplicate) throw new AppError('WAREHOUSE_EXISTS', 'Ya existe un almacén con ese nombre.', 409) }; return inventoryRepository.updateWarehouse(id, { ...input, ...(input.location !== undefined && { location: input.location || null }), ...(input.description !== undefined && { description: input.description || null }) }) },
  async removeWarehouse(companyId: string, id: string) { if (!await inventoryRepository.findWarehouse(id, companyId)) throw new AppError('WAREHOUSE_NOT_FOUND', 'El almacén no existe.', 404); const [stock, movements, transfers, adjustments] = await Promise.all([prisma.stock.count({ where: { warehouseId: id, quantity: { not: 0 } } }), prisma.inventoryMovement.count({ where: { warehouseId: id } }), prisma.stockTransfer.count({ where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] } }), prisma.inventoryAdjustment.count({ where: { warehouseId: id } })]); if (stock || movements || transfers || adjustments) throw new AppError('WAREHOUSE_IN_USE', 'No se puede eliminar un almacén con stock o historial. Desactívalo en su lugar.', 409); await inventoryRepository.removeWarehouse(id) },
}
