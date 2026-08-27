import { Prisma, ProductionMaterialStatus, ProductionStatus, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productionRepository } from '../repositories/production.repository.js'
import type { CompleteProductionOrderInput, ProductionOrderInput, UpdateProductionOrderInput } from '../schemas/production.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const nextNumber = () => `OP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

type MaterialInput = ProductionOrderInput['materials'][number]

async function validateReferences(companyId: string, input: Pick<ProductionOrderInput, 'productId' | 'presentationId' | 'warehouseId' | 'materials'>) {
  const ids = [...new Set([input.presentationId, ...input.materials.map(line => line.presentationId)])]
  const warehouseIds = [...new Set([input.warehouseId, ...input.materials.map(line => line.warehouseId)])]
  const [product, presentations, warehouses] = await Promise.all([
    prisma.product.findFirst({ where: { id: input.productId, status: ProductStatus.ACTIVE, roles: { has: 'FINISHED_PRODUCT' } } }),
    prisma.productPresentation.findMany({ where: { id: { in: ids }, status: ProductStatus.ACTIVE } }),
    prisma.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId, status: ProductStatus.ACTIVE } }),
  ])
  if (!product) throw new AppError('PRODUCTION_PRODUCT_NOT_AVAILABLE', 'Selecciona un producto terminado activo.', 422)
  if (presentations.length !== ids.length || warehouses.length !== warehouseIds.length) throw new AppError('PRODUCTION_REFERENCE_INVALID', 'La presentación o el almacén seleccionado no está disponible.', 422)
  const outputPresentation = presentations.find(item => item.id === input.presentationId)
  if (!outputPresentation || outputPresentation.productId !== input.productId) throw new AppError('PRODUCTION_OUTPUT_MISMATCH', 'La presentación no corresponde al producto terminado.', 422)
  const materialProductIds = [...new Set(input.materials.map(line => line.productId))]
  const materialProducts = await prisma.product.findMany({ where: { id: { in: materialProductIds }, status: ProductStatus.ACTIVE, roles: { has: 'SUPPLY' } } })
  if (materialProducts.length !== materialProductIds.length) throw new AppError('PRODUCTION_MATERIAL_NOT_AVAILABLE', 'Selecciona únicamente insumos activos.', 422)
  for (const line of input.materials) {
    const presentation = presentations.find(item => item.id === line.presentationId)
    if (!presentation || presentation.productId !== line.productId) throw new AppError('PRODUCTION_MATERIAL_MISMATCH', 'Una presentación no corresponde al insumo seleccionado.', 422)
  }
}

async function validateStock(companyId: string, materials: MaterialInput[]) {
  const reservations = new Map<string, Prisma.Decimal>()
  for (const material of materials) {
    if (material.immediateConsumption) continue
    const presentation = await prisma.productPresentation.findUniqueOrThrow({ where: { id: material.presentationId }, select: { factor: true } })
    const key = `${material.productId}:${material.warehouseId}`
    reservations.set(key, (reservations.get(key) ?? new Prisma.Decimal(0)).plus(decimal(material.quantity).mul(presentation.factor)))
  }
  for (const [key, requested] of reservations) {
    const [productId, warehouseId] = key.split(':')
    const stock = await prisma.stock.findFirst({ where: { productId, warehouseId, warehouse: { companyId } } })
    if (!stock || stock.quantity.lessThan(requested)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para reservar los insumos de esta orden.', 422)
  }
}

async function consumeMaterials(db: Prisma.TransactionClient, order: { number: string; materials: { id: string; productId: string; presentationId: string; warehouseId: string; quantity: Prisma.Decimal; status: ProductionMaterialStatus; presentation: { factor: Prisma.Decimal } | null }[] }) {
  for (const material of order.materials.filter(item => item.status === ProductionMaterialStatus.RESERVED)) {
    if (!material.presentation) throw new AppError('PRODUCTION_MATERIAL_INVALID', 'La presentación de un insumo ya no está disponible.', 409)
    const baseQuantity = material.quantity.mul(material.presentation.factor)
    const stock = await db.stock.findUnique({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } } })
    if (!stock || stock.quantity.lessThan(baseQuantity)) throw new AppError('PRODUCTION_INSUFFICIENT_STOCK', 'No hay stock suficiente para completar esta orden.', 422)
    await db.stock.update({ where: { productId_warehouseId: { productId: material.productId, warehouseId: material.warehouseId } }, data: { quantity: { decrement: baseQuantity } } })
    await db.productPresentation.update({ where: { id: material.presentationId }, data: { currentStock: { decrement: material.quantity } } })
    await db.inventoryMovement.create({ data: { productId: material.productId, warehouseId: material.warehouseId, type: 'PRODUCTION_CONSUMPTION', quantity: baseQuantity.negated(), reference: order.number, note: `Consumo de producción ${order.number}` } })
    await db.productionMaterial.update({ where: { id: material.id }, data: { status: ProductionMaterialStatus.CONSUMED, consumedAt: new Date() } })
  }
}

export const productionService = {
  list(companyId: string, filters: { status?: ProductionStatus; search?: string }) {
    const where: Prisma.ProductionOrderWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.search && { OR: [{ number: { contains: filters.search, mode: 'insensitive' } }, { product: { name: { contains: filters.search, mode: 'insensitive' } } }] }) }
    return productionRepository.findMany(where)
  },
  async getById(companyId: string, id: string) { const order = await productionRepository.findById(id, companyId); if (!order) throw new AppError('PRODUCTION_ORDER_NOT_FOUND', 'La orden de producción no existe.', 404); return order },
  catalog: (companyId: string) => productionRepository.catalog(companyId),
  async create(companyId: string, input: ProductionOrderInput) {
    await validateReferences(companyId, input)
    await validateStock(companyId, input.materials)
    return transaction(async db => {
      const created = await productionRepository.create(db, { company: { connect: { id: companyId } }, number: nextNumber(), product: { connect: { id: input.productId } }, presentation: { connect: { id: input.presentationId } }, warehouse: { connect: { id: input.warehouseId } }, quantity: decimal(input.quantity), scheduledAt: input.scheduledAt, status: input.status, note: input.note || null, materials: { create: input.materials.map(line => ({ product: { connect: { id: line.productId } }, presentation: { connect: { id: line.presentationId } }, warehouse: { connect: { id: line.warehouseId } }, quantity: decimal(line.quantity), immediateConsumption: line.immediateConsumption, status: line.immediateConsumption ? ProductionMaterialStatus.CONSUMED : ProductionMaterialStatus.RESERVED, ...(line.immediateConsumption && { consumedAt: new Date() }) })) } })
      const immediate = created.materials.filter(line => line.immediateConsumption)
      if (immediate.length) await consumeMaterials(db, { number: created.number, materials: immediate.map(line => ({ ...line, status: ProductionMaterialStatus.RESERVED })) })
      return productionRepository.findById(created.id, companyId).then(result => result!)
    })
  },
  async update(companyId: string, id: string, input: UpdateProductionOrderInput) {
    const current = await this.getById(companyId, id)
    if (current.status !== ProductionStatus.PLANNED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden editar órdenes planificadas.', 409)
    const full: ProductionOrderInput = { productId: input.productId ?? current.productId, presentationId: input.presentationId ?? current.presentationId, warehouseId: input.warehouseId ?? current.warehouseId, quantity: input.quantity ?? Number(current.quantity), scheduledAt: input.scheduledAt ?? current.scheduledAt, note: input.note === undefined ? current.note : input.note, status: input.status ?? ProductionStatus.PLANNED, materials: input.materials ?? current.materials.map(line => ({ productId: line.productId, presentationId: line.presentationId!, warehouseId: line.warehouseId, quantity: Number(line.quantity), immediateConsumption: line.immediateConsumption })) }
    await validateReferences(companyId, full); await validateStock(companyId, full.materials)
    return productionRepository.update(prisma, id, { product: { connect: { id: full.productId } }, presentation: { connect: { id: full.presentationId } }, warehouse: { connect: { id: full.warehouseId } }, quantity: decimal(full.quantity), scheduledAt: full.scheduledAt, note: full.note || null, status: full.status, materials: { deleteMany: {}, create: full.materials.map(line => ({ product: { connect: { id: line.productId } }, presentation: { connect: { id: line.presentationId } }, warehouse: { connect: { id: line.warehouseId } }, quantity: decimal(line.quantity), immediateConsumption: line.immediateConsumption })) } })
  },
  async complete(companyId: string, id: string, input: CompleteProductionOrderInput) {
    const current = await this.getById(companyId, id)
    if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.IN_PROGRESS) throw new AppError('PRODUCTION_NOT_COMPLETABLE', 'La orden no está disponible para completar.', 409)
    return transaction(async db => {
      const order = await db.productionOrder.findUniqueOrThrow({ where: { id }, include: { presentation: true, materials: { include: { presentation: true } } } })
      await consumeMaterials(db, order)
      const outputQuantity = order.quantity.mul(order.presentation.factor)
      await db.stock.upsert({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, create: { productId: order.productId, warehouseId: order.warehouseId, quantity: outputQuantity }, update: { quantity: { increment: outputQuantity } } })
      await db.productPresentation.update({ where: { id: order.presentationId }, data: { currentStock: { increment: order.quantity } } })
      await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, type: 'PRODUCTION_OUTPUT', quantity: outputQuantity, reference: order.number, note: `Ingreso por producción ${order.number}` } })
      if (input.outputDispatched) {
        await db.stock.update({ where: { productId_warehouseId: { productId: order.productId, warehouseId: order.warehouseId } }, data: { quantity: { decrement: outputQuantity } } })
        await db.productPresentation.update({ where: { id: order.presentationId }, data: { currentStock: { decrement: order.quantity } } })
        await db.inventoryMovement.create({ data: { productId: order.productId, warehouseId: order.warehouseId, type: 'ADJUSTMENT_OUT', quantity: outputQuantity.negated(), reference: order.number, note: input.outputJustification! } })
      }
      return productionRepository.update(db, id, { status: ProductionStatus.COMPLETED, completedAt: new Date(), outputDispatched: input.outputDispatched, outputJustification: input.outputDispatched ? input.outputJustification : null })
    })
  },
  async remove(companyId: string, id: string) { const current = await this.getById(companyId, id); if (current.status !== ProductionStatus.PLANNED && current.status !== ProductionStatus.CANCELLED) throw new AppError('PRODUCTION_ORDER_LOCKED', 'Solo se pueden eliminar órdenes planificadas o canceladas.', 409); await productionRepository.remove(prisma, id) },
}
