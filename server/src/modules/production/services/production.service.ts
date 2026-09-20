import { Prisma, ProductionMaterialStatus, ProductionStatus, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productionRepository } from '../repositories/production.repository.js'
import type { CompleteProductionOrderInput, ProductionOrderInput, UpdateProductionOrderInput } from '../schemas/production.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const nextNumber = () => `OP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) =>
  prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

type Database = typeof prisma | Prisma.TransactionClient
type MaterialInput = ProductionOrderInput['materials'][number]

async function activePresentations(db: Database, productIds: string[]) {
  const presentations = await db.productPresentation.findMany({
    where: { productId: { in: [...new Set(productIds)] }, status: ProductStatus.ACTIVE },
    orderBy: { name: 'asc' },
    include: { unit: true },
  })
  const byProduct = new Map<string, (typeof presentations)[number]>()
  for (const presentation of presentations) {
    if (!byProduct.has(presentation.productId)) byProduct.set(presentation.productId, presentation)
  }
  return byProduct
}

async function validateReferences(companyId: string, input: Pick<ProductionOrderInput, 'productId' | 'warehouseId' | 'materials'>) {
  const materialProductIds = [...new Set(input.materials.map(line => line.productId))]
  const warehouseIds = [...new Set([input.warehouseId, ...input.materials.map(line => line.warehouseId)])]
  const [output, materials, warehouses, presentations] = await Promise.all([
    prisma.product.findFirst({ where: { id: input.productId, status: ProductStatus.ACTIVE, roles: { has: 'FINISHED_PRODUCT' } } }),
    prisma.product.findMany({ where: { id: { in: materialProductIds }, status: ProductStatus.ACTIVE, roles: { has: 'SUPPLY' } } }),
    prisma.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId, status: ProductStatus.ACTIVE } }),
    activePresentations(prisma, [input.productId, ...materialProductIds]),
  ])
  if (!output) throw new AppError('PRODUCTION_PRODUCT_NOT_AVAILABLE', 'Selecciona un producto terminado activo.', 422)
  if (materials.length !== materialProductIds.length) throw new AppError('PRODUCTION_MATERIAL_NOT_AVAILABLE', 'Selecciona únicamente insumos activos.', 422)
  if (warehouses.length !== warehouseIds.length) throw new AppError('PRODUCTION_WAREHOUSE_INVALID', 'El almacén seleccionado no está disponible.', 422)
  if (!presentations.has(input.productId)) throw new AppError('PRODUCTION_OUTPUT_UNIT_INVALID', 'El producto terminado no tiene una unidad de inventario activa.', 422)
  if (materialProductIds.some(id => !presentations.has(id))) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos no tiene una unidad de inventario activa.', 422)
}

async function validateStock(companyId: string, materials: MaterialInput[]) {
  const factors = await activePresentations(prisma, materials.map(line => line.productId))
  const reservations = new Map<string, Prisma.Decimal>()
  for (const material of materials) {
    if (material.immediateConsumption) continue
    const presentation = factors.get(material.productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos no tiene una unidad de inventario activa.', 422)
    const key = `${material.productId}:${material.warehouseId}`
    reservations.set(key, (reservations.get(key) ?? new Prisma.Decimal(0)).plus(decimal(material.quantity).mul(presentation.factor)))
  }
  for (const [key, requested] of reservations) {
    const [productId, warehouseId] = key.split(':')
    const presentation = factors.get(productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos no tiene una unidad de inventario activa.', 422)
    const stock = await prisma.stock.findFirst({ where: { productId, warehouseId, warehouse: { companyId } } })
    const available = stock?.quantity ?? presentation.currentStock.mul(presentation.factor)
    if (available.lessThan(requested)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para reservar los insumos de esta orden.', 422)
  }
}

async function consumeMaterials(db: Prisma.TransactionClient, order: { number: string; materials: { id: string; productId: string; warehouseId: string; quantity: Prisma.Decimal; status: ProductionMaterialStatus }[] }) {
  const pending = order.materials.filter(item => item.status === ProductionMaterialStatus.RESERVED)
  const presentations = await activePresentations(db, pending.map(item => item.productId))
  for (const material of pending) {
    const presentation = presentations.get(material.productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos ya no tiene una unidad de inventario activa.', 409)
    const baseQuantity = material.quantity.mul(presentation.factor)
    const stock = await db.stock.findUnique({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } } })
    const available = stock?.quantity ?? presentation.currentStock.mul(presentation.factor)
    if (available.lessThan(baseQuantity)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para completar esta orden.', 422)
    if (stock) await db.stock.update({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } }, data: { quantity: { decrement: baseQuantity } } })
    else await db.stock.create({ data: { productId: material.productId, warehouseId: material.warehouseId, quantity: available.minus(baseQuantity) } })
    await db.productPresentation.update({ where: { id: presentation.id }, data: { currentStock: { decrement: material.quantity } } })
    await db.inventoryMovement.create({ data: { productId: material.productId, warehouseId: material.warehouseId, type: 'PRODUCTION_CONSUMPTION', quantity: baseQuantity.negated(), reference: order.number, note: `Consumo de producción ${order.number}` } })
    await db.productionMaterial.update({ where: { id: material.id }, data: { status: ProductionMaterialStatus.CONSUMED, consumedAt: new Date() } })
  }
}

const materialData = (line: MaterialInput) => ({
  product: { connect: { id: line.productId } },
  warehouse: { connect: { id: line.warehouseId } },
  quantity: decimal(line.quantity),
  immediateConsumption: line.immediateConsumption,
  status: line.immediateConsumption ? ProductionMaterialStatus.CONSUMED : ProductionMaterialStatus.RESERVED,
  ...(line.immediateConsumption && { consumedAt: new Date() }),
})

export const productionService = {
  list(companyId: string, filters: { status?: ProductionStatus; search?: string }) {
    const where: Prisma.ProductionOrderWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.search && { OR: [{ number: { contains: filters.search, mode: 'insensitive' } }, { product: { name: { contains: filters.search, mode: 'insensitive' } } }] }) }
    return productionRepository.findMany(where)
  },
  async getById(companyId: string, id: string) {
    const order = await productionRepository.findById(id, companyId)
    if (!order) throw new AppError('PRODUCTION_ORDER_NOT_FOUND', 'La orden de producción no existe.', 404)
    return order
  },
  async catalog(companyId: string) {
    const [products, materials, warehouses, stocks] = await productionRepository.catalog(companyId)
    const stockTotals = new Map<string, number>()
    for (const stock of stocks) {
      stockTotals.set(stock.productId, (stockTotals.get(stock.productId) ?? 0) + Number(stock.quantity))
    }
    const mapProduct = (product: (typeof products)[number]) => {
      const presentation = product.presentations[0]
      const factor = Number(presentation?.factor ?? 1)
      const baseQuantity = stockTotals.get(product.id) ?? Number(presentation?.currentStock ?? 0) * factor
      return { id: product.id, code: product.code, name: product.name, unit: presentation?.unit.code ?? null, available: baseQuantity / factor }
    }
    return { products: products.map(mapProduct), materials: materials.map(mapProduct), warehouses, stocks }
  },
  async create(companyId: string, input: ProductionOrderInput) {
    await validateReferences(companyId, input)
    await validateStock(companyId, input.materials)
    return transaction(async db => {
      const created = await productionRepository.create(db, {
        company: { connect: { id: companyId } },
        number: nextNumber(),
        product: { connect: { id: input.productId } },
        warehouse: { connect: { id: input.warehouseId } },
        quantity: decimal(input.quantity),
        scheduledAt: input.scheduledAt,
        status: input.status,
        note: input.note || null,
        materials: { create: input.materials.map(materialData) },
      })
      const immediate = created.materials.filter(line => line.immediateConsumption).map(line => ({ ...line, status: ProductionMaterialStatus.RESERVED }))
      if (immediate.length) await consumeMaterials(db, { number: created.number, materials: immediate })
      return productionRepository.findById(created.id, companyId, db).then(result => result!)
    })
  },
  async update(companyId: string, id: string, input: UpdateProductionOrderInput) {
    const current = await this.getById(companyId, id)
    if (current.status !== ProductionStatus.PLANNED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden editar órdenes planificadas.', 409)
    const full: ProductionOrderInput = {
      productId: input.productId ?? current.productId,
      warehouseId: input.warehouseId ?? current.warehouseId,
      quantity: input.quantity ?? Number(current.quantity),
      scheduledAt: input.scheduledAt ?? current.scheduledAt,
      note: input.note === undefined ? current.note : input.note,
      status: input.status ?? ProductionStatus.PLANNED,
      materials: input.materials ?? current.materials.map(line => ({ productId: line.productId, warehouseId: line.warehouseId, quantity: Number(line.quantity), immediateConsumption: line.immediateConsumption })),
    }
    await validateReferences(companyId, full)
    await validateStock(companyId, full.materials)
    return productionRepository.update(prisma, id, {
      product: { connect: { id: full.productId } },
      warehouse: { connect: { id: full.warehouseId } },
      quantity: decimal(full.quantity),
      scheduledAt: full.scheduledAt,
      note: full.note || null,
      status: full.status,
      materials: { deleteMany: {}, create: full.materials.map(materialData) },
    })
  },
  async complete(companyId: string, id: string, input: CompleteProductionOrderInput) {
    const current = await this.getById(companyId, id)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.IN_PROGRESS) throw new AppError('PRODUCTION_NOT_COMPLETABLE', 'La orden no está disponible para completar.', 409)
    return transaction(async db => {
      const order = await db.productionOrder.findUniqueOrThrow({ where: { id }, include: { materials: true } })
      await consumeMaterials(db, order)
      const outputPresentation = (await activePresentations(db, [order.productId])).get(order.productId)
      if (!outputPresentation) throw new AppError('PRODUCTION_OUTPUT_UNIT_INVALID', 'El producto terminado ya no tiene una unidad de inventario activa.', 409)
      const outputQuantity = order.quantity.mul(outputPresentation.factor)
      await db.stock.upsert({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, create: { productId: order.productId, warehouseId: order.warehouseId, quantity: outputQuantity }, update: { quantity: { increment: outputQuantity } } })
      await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { increment: order.quantity } } })
      await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, type: 'PRODUCTION_OUTPUT', quantity: outputQuantity, reference: order.number, note: `Ingreso por producción ${order.number}` } })
      if (input.outputDispatched) {
        await db.stock.update({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, data: { quantity: { decrement: outputQuantity } } })
        await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { decrement: order.quantity } } })
        await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, type: 'ADJUSTMENT_OUT', quantity: outputQuantity.negated(), reference: order.number, note: input.outputJustification! } })
      }
      return productionRepository.update(db, id, { status: ProductionStatus.COMPLETED, completedAt: new Date(), outputDispatched: input.outputDispatched, outputJustification: input.outputDispatched ? input.outputJustification : null })
    })
  },
  async consumeMaterial(companyId: string, orderId: string, materialId: string) {
    const current = await this.getById(companyId, orderId)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.IN_PROGRESS) throw new AppError('PRODUCTION_MATERIAL_LOCKED', 'Solo puedes consumir insumos de órdenes activas.', 409)
    const material = current.materials.find(item => item.id === materialId)
    if (!material) throw new AppError('PRODUCTION_MATERIAL_NOT_FOUND', 'El insumo no pertenece a esta orden.', 404)
    if (material.status === ProductionMaterialStatus.CONSUMED) return current
    return transaction(async db => {
      await consumeMaterials(db, { number: current.number, materials: [material] })
      return productionRepository.findById(orderId, companyId, db).then(result => result!)
    })
  },
  async remove(companyId: string, id: string) {
    const current = await this.getById(companyId, id)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.CANCELLED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden eliminar órdenes planificadas o canceladas.', 409)
    await productionRepository.remove(prisma, id)
  },
}
