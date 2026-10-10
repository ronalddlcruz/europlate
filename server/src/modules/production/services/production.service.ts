import { Prisma, ProductionMaterialStatus, ProductionStatus, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productionRepository } from '../repositories/production.repository.js'
import { assertWarehouseScope, productionScopeWhere, resolveOperationScope } from '../../../shared/security/operation-scope.js'
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

async function validateStock(companyId: string, materials: MaterialInput[], excludeOrderId?: string) {
  const factors = await activePresentations(prisma, materials.map(line => line.productId))
  const reservations = new Map<string, Prisma.Decimal>()
  for (const material of materials) {
    if (material.shareReservation) continue
    const presentation = factors.get(material.productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos no tiene una unidad de inventario activa.', 422)
    const key = `${material.productId}:${material.warehouseId}`
    reservations.set(key, (reservations.get(key) ?? new Prisma.Decimal(0)).plus(decimal(material.quantity).mul(presentation.factor)))
  }
  const pendingReservations = await prisma.productionMaterial.findMany({
    where: {
      status: ProductionMaterialStatus.RESERVED,
      shareReservation: false,
      warehouse: { companyId },
      ...(excludeOrderId && { orderId: { not: excludeOrderId } }),
      OR: [...reservations.keys()].map(key => {
        const [productId, warehouseId] = key.split(':')
        return { productId, warehouseId }
      }),
    },
    select: { productId: true, warehouseId: true, quantity: true },
  })
  const alreadyReserved = new Map<string, Prisma.Decimal>()
  for (const material of pendingReservations) {
    const presentation = factors.get(material.productId)
    if (!presentation) continue
    const key = `${material.productId}:${material.warehouseId}`
    alreadyReserved.set(key, (alreadyReserved.get(key) ?? new Prisma.Decimal(0)).plus(material.quantity.mul(presentation.factor)))
  }
  for (const [key, requested] of reservations) {
    const [productId, warehouseId] = key.split(':')
    const presentation = factors.get(productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos no tiene una unidad de inventario activa.', 422)
    const stock = await prisma.stock.findFirst({ where: { productId, warehouseId, warehouse: { companyId } } })
    const physical = stock?.quantity ?? new Prisma.Decimal(0)
    const available = Prisma.Decimal.max(physical.minus(alreadyReserved.get(key) ?? 0), 0)
    if (available.lessThan(requested)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para reservar los insumos de esta orden.', 422)
  }
}

async function validateSharedReservations(companyId: string, materials: MaterialInput[]) {
  const shared = materials.filter(material => material.shareReservation)
  if (!shared.length) return
  const newSourceKeys = new Set(
    materials
      .filter(material => !material.shareReservation)
      .map(material => `${material.productId}:${material.warehouseId}`),
  )
  const sources = await prisma.productionMaterial.findMany({
    where: {
      status: ProductionMaterialStatus.RESERVED,
      shareReservation: false,
      order: { companyId },
      OR: shared.map(material => ({ productId: material.productId, warehouseId: material.warehouseId })),
    },
    select: { productId: true, warehouseId: true },
  })
  for (const material of shared) {
    const key = `${material.productId}:${material.warehouseId}`
    const hasPersistedSource = sources.some(source => source.productId === material.productId && source.warehouseId === material.warehouseId)
    if (!newSourceKeys.has(key) && !hasPersistedSource) throw new AppError('PRODUCTION_SHARED_RESERVATION_NOT_FOUND', 'El insumo seleccionado ya no tiene una reserva activa para compartir.', 422)
  }
}

/**
 * Una reserva pendiente representa una unidad física de insumo. Las órdenes
 * posteriores que usan el mismo insumo y almacén se enlazan a esa reserva en
 * lugar de reservarla y descontarla una segunda vez.
 */
async function sharePendingReservations(companyId: string, materials: MaterialInput[]) {
  const candidates = materials.filter(material => !material.immediateConsumption && !material.shareReservation)
  if (!candidates.length) return materials
  const existing = await prisma.productionMaterial.findMany({
    where: {
      status: ProductionMaterialStatus.RESERVED,
      shareReservation: false,
      order: { companyId },
      OR: candidates.map(material => ({ productId: material.productId, warehouseId: material.warehouseId })),
    },
    select: { productId: true, warehouseId: true },
  })
  const reservedKeys = new Set(existing.map(material => `${material.productId}:${material.warehouseId}`))
  return materials.map(material => {
    const key = `${material.productId}:${material.warehouseId}`
    if (material.immediateConsumption || material.shareReservation) return material
    if (reservedKeys.has(key)) return { ...material, shareReservation: true }
    reservedKeys.add(key)
    return material
  })
}

async function consumeMaterials(db: Prisma.TransactionClient, order: { number: string; materials: { id: string; productId: string; warehouseId: string; quantity: Prisma.Decimal; status: ProductionMaterialStatus; shareReservation: boolean }[] }, userId: string) {
  const pending = order.materials.filter(item => item.status === ProductionMaterialStatus.RESERVED)
  const presentations = await activePresentations(db, pending.map(item => item.productId))
  for (const material of pending) {
    if (material.shareReservation) {
      await db.productionMaterial.update({ where: { id: material.id }, data: { status: ProductionMaterialStatus.CONSUMED, consumedAt: new Date() } })
      continue
    }
    const presentation = presentations.get(material.productId)
    if (!presentation) throw new AppError('PRODUCTION_MATERIAL_UNIT_INVALID', 'Uno de los insumos ya no tiene una unidad de inventario activa.', 409)
    const baseQuantity = material.quantity.mul(presentation.factor)
    const stock = await db.stock.findUnique({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } } })
    const available = stock?.quantity ?? new Prisma.Decimal(0)
    if (available.lessThan(baseQuantity)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para completar esta orden.', 422)
    if (stock) await db.stock.update({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } }, data: { quantity: { decrement: baseQuantity } } })
    else await db.stock.create({ data: { productId: material.productId, warehouseId: material.warehouseId, quantity: available.minus(baseQuantity) } })
    await db.productPresentation.update({ where: { id: presentation.id }, data: { currentStock: { decrement: material.quantity } } })
    await db.inventoryMovement.create({ data: { productId: material.productId, warehouseId: material.warehouseId, createdByUserId: userId, type: 'PRODUCTION_CONSUMPTION', quantity: baseQuantity.negated(), reference: order.number, note: `Consumo de producción ${order.number}` } })
    await db.productionMaterial.update({ where: { id: material.id }, data: { status: ProductionMaterialStatus.CONSUMED, consumedAt: new Date() } })
  }
}

const materialData = (line: MaterialInput) => ({
  product: { connect: { id: line.productId } },
  warehouse: { connect: { id: line.warehouseId } },
  quantity: decimal(line.quantity),
  immediateConsumption: line.immediateConsumption,
  shareReservation: line.shareReservation,
  status: ProductionMaterialStatus.RESERVED,
})

export const productionService = {
  async list(companyId: string, actorId: string, filters: { status?: ProductionStatus; search?: string }) {
    const scope = await resolveOperationScope(companyId, actorId)
    const where: Prisma.ProductionOrderWhereInput = { companyId, ...productionScopeWhere(scope), ...(filters.status && { status: filters.status }), ...(filters.search && { OR: [{ number: { contains: filters.search, mode: 'insensitive' } }, { product: { name: { contains: filters.search, mode: 'insensitive' } } }] }) }
    return productionRepository.findMany(where)
  },
  async getById(companyId: string, actorId: string, id: string) {
    const scope = await resolveOperationScope(companyId, actorId)
    const order = await productionRepository.findById(id, companyId, prisma, productionScopeWhere(scope))
    if (!order) throw new AppError('PRODUCTION_ORDER_NOT_FOUND', 'La orden de producción no existe.', 404)
    return order
  },
  async catalog(companyId: string, actorId: string) {
    const scope = await resolveOperationScope(companyId, actorId)
    const [products, materials, warehouses, stocks, customers, sharedReservations] = await productionRepository.catalog(companyId, scope?.warehouseIds)
    const stockTotals = new Map<string, number>()
    for (const stock of stocks) {
      stockTotals.set(stock.productId, (stockTotals.get(stock.productId) ?? 0) + Number(stock.quantity))
    }
    const mapProduct = (product: (typeof products)[number]) => {
      const presentation = product.presentations[0]
      const factor = Number(presentation?.factor ?? 1)
      const baseQuantity = stockTotals.get(product.id) ?? Number(presentation?.currentStock ?? 0) * factor
      return { id: product.id, code: product.code, name: product.name, unit: presentation?.unit.code ?? null, unitName: presentation?.unit.description ?? presentation?.unit.code ?? null, factor, available: baseQuantity / factor }
    }
    return { products: products.map(mapProduct), materials: materials.map(mapProduct), warehouses, stocks, customers, sharedReservations }
  },
  async create(companyId: string, input: ProductionOrderInput, userId: string) {
    const scope = await resolveOperationScope(companyId, userId)
    assertWarehouseScope(scope, [input.warehouseId, ...input.materials.map(item => item.warehouseId)])
    const materials = await sharePendingReservations(companyId, input.materials)
    const resolvedInput = { ...input, materials }
    await validateReferences(companyId, resolvedInput)
    await validateStock(companyId, resolvedInput.materials)
    await validateSharedReservations(companyId, resolvedInput.materials)
    const outputCustomer = input.outputDispatched ? await prisma.customer.findFirst({ where: { id: input.outputCustomerId!, companyId, status: ProductStatus.ACTIVE }, select: { name: true } }) : null
    if (input.outputDispatched && !outputCustomer) throw new AppError('PRODUCTION_OUTPUT_CUSTOMER_INVALID', 'Selecciona un cliente activo para la salida de inventario.', 422)
    return transaction(async db => {
      const created = await productionRepository.create(db, {
        company: { connect: { id: companyId } },
        createdBy: { connect: { id: userId } },
        number: nextNumber(),
        product: { connect: { id: input.productId } },
        warehouse: { connect: { id: input.warehouseId } },
        quantity: decimal(input.quantity),
        scheduledAt: input.scheduledAt,
        // La producción terminada se registra de inmediato. Los insumos no
        // inmediatos permanecen como reservas hasta que se marquen consumidos.
        status: ProductionStatus.COMPLETED,
        note: input.note || null,
        outputDispatched: input.outputDispatched,
        outputJustification: input.outputDispatched ? input.outputJustification : null,
        ...(input.outputDispatched && { outputCustomer: { connect: { id: input.outputCustomerId! } } }),
        materials: { create: resolvedInput.materials.map(materialData) },
      })
      const immediate = created.materials.filter(line => line.immediateConsumption)
      if (immediate.length) await consumeMaterials(db, { number: created.number, materials: immediate }, userId)
      const outputPresentation = (await activePresentations(db, [created.productId])).get(created.productId)
      if (!outputPresentation) throw new AppError('PRODUCTION_OUTPUT_UNIT_INVALID', 'El producto terminado ya no tiene una unidad de inventario activa.', 409)
      const outputQuantity = created.quantity.mul(outputPresentation.factor)
      await db.stock.upsert({ where: { productId_warehouseId: { productId: created.productId, warehouseId: created.warehouseId } }, create: { productId: created.productId, warehouseId: created.warehouseId, quantity: outputQuantity }, update: { quantity: { increment: outputQuantity } } })
      await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { increment: created.quantity } } })
      await db.inventoryMovement.create({ data: { productId: created.productId, warehouseId: created.warehouseId, createdByUserId: userId, type: 'PRODUCTION_OUTPUT', quantity: outputQuantity, reference: created.number, note: `Ingreso por producción ${created.number}` } })
      if (input.outputDispatched) {
        await db.stock.update({ where: { productId_warehouseId: { productId: created.productId, warehouseId: created.warehouseId } }, data: { quantity: { decrement: outputQuantity } } })
        await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { decrement: created.quantity } } })
        await db.inventoryMovement.create({ data: { productId: created.productId, warehouseId: created.warehouseId, createdByUserId: userId, type: 'ADJUSTMENT_OUT', quantity: outputQuantity.negated(), reference: created.number, note: `${input.outputJustification} · Cliente: ${outputCustomer!.name}` } })
      }
      await db.productionOrder.update({ where: { id: created.id }, data: { completedAt: new Date() } })
      return productionRepository.findById(created.id, companyId, db).then(result => result!)
    })
  },
  async update(companyId: string, actorId: string, id: string, input: UpdateProductionOrderInput) {
    const current = await this.getById(companyId, actorId, id)
    if (current.status !== ProductionStatus.PLANNED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden editar órdenes planificadas.', 409)
    const full: ProductionOrderInput = {
      productId: input.productId ?? current.productId,
      warehouseId: input.warehouseId ?? current.warehouseId,
      quantity: input.quantity ?? Number(current.quantity),
      scheduledAt: input.scheduledAt ?? current.scheduledAt,
      note: input.note === undefined ? current.note : input.note,
      outputDispatched: input.outputDispatched ?? current.outputDispatched,
      outputJustification: input.outputJustification === undefined ? current.outputJustification : input.outputJustification,
      outputCustomerId: input.outputCustomerId === undefined ? current.outputCustomerId : input.outputCustomerId,
      materials: input.materials ?? current.materials.map(line => ({ productId: line.productId, warehouseId: line.warehouseId, quantity: Number(line.quantity), immediateConsumption: line.immediateConsumption, shareReservation: line.shareReservation })),
    }
    assertWarehouseScope(await resolveOperationScope(companyId, actorId), [full.warehouseId, ...full.materials.map(item => item.warehouseId)])
    await validateReferences(companyId, full)
    await validateStock(companyId, full.materials, current.id)
    await validateSharedReservations(companyId, full.materials)
    return productionRepository.update(prisma, id, {
      product: { connect: { id: full.productId } },
      warehouse: { connect: { id: full.warehouseId } },
      quantity: decimal(full.quantity),
      scheduledAt: full.scheduledAt,
      note: full.note || null,
      materials: { deleteMany: {}, create: full.materials.map(materialData) },
    })
  },
  async complete(companyId: string, id: string, input: CompleteProductionOrderInput, userId: string) {
    const current = await this.getById(companyId, userId, id)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.IN_PROGRESS) throw new AppError('PRODUCTION_NOT_COMPLETABLE', 'La orden no está disponible para completar.', 409)
    return transaction(async db => {
      const order = await db.productionOrder.findUniqueOrThrow({ where: { id }, include: { materials: true } })
      await consumeMaterials(db, order, userId)
      const outputPresentation = (await activePresentations(db, [order.productId])).get(order.productId)
      if (!outputPresentation) throw new AppError('PRODUCTION_OUTPUT_UNIT_INVALID', 'El producto terminado ya no tiene una unidad de inventario activa.', 409)
      const outputQuantity = order.quantity.mul(outputPresentation.factor)
      await db.stock.upsert({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, create: { productId: order.productId, warehouseId: order.warehouseId, quantity: outputQuantity }, update: { quantity: { increment: outputQuantity } } })
      await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { increment: order.quantity } } })
      await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, createdByUserId: userId, type: 'PRODUCTION_OUTPUT', quantity: outputQuantity, reference: order.number, note: `Ingreso por producción ${order.number}` } })
      if (input.outputDispatched) {
        await db.stock.update({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, data: { quantity: { decrement: outputQuantity } } })
        await db.productPresentation.update({ where: { id: outputPresentation.id }, data: { currentStock: { decrement: order.quantity } } })
        await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, createdByUserId: userId, type: 'ADJUSTMENT_OUT', quantity: outputQuantity.negated(), reference: order.number, note: input.outputJustification! } })
      }
      return productionRepository.update(db, id, { status: ProductionStatus.COMPLETED, completedAt: new Date(), outputDispatched: input.outputDispatched, outputJustification: input.outputDispatched ? input.outputJustification : null })
    })
  },
  async consumeMaterial(companyId: string, orderId: string, materialId: string, userId: string) {
    const current = await this.getById(companyId, userId, orderId)
    const material = current.materials.find(item => item.id === materialId)
    if (!material) throw new AppError('PRODUCTION_MATERIAL_NOT_FOUND', 'El insumo no pertenece a esta orden.', 404)
    if (material.status === ProductionMaterialStatus.CONSUMED) return current
    return transaction(async db => {
      const related = await db.productionMaterial.findMany({ where: { productId: material.productId, warehouseId: material.warehouseId, status: ProductionMaterialStatus.RESERVED, order: { companyId } } })
      await consumeMaterials(db, { number: current.number, materials: related }, userId)
      return productionRepository.findById(orderId, companyId, db).then(result => result!)
    })
  },
  async remove(companyId: string, actorId: string, id: string) {
    const current = await this.getById(companyId, actorId, id)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.CANCELLED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden eliminar órdenes planificadas o canceladas.', 409)
    await productionRepository.remove(prisma, id)
  },
}
