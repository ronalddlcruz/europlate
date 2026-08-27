import { Prisma, ImportStatus, ProductStatus, SupplierType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { importRepository } from '../repositories/import.repository.js'
import type { ImportInput, UpdateImportInput } from '../schemas/import.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const nextNumber = () => `IMP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
const totalOf = (items: { quantity: number; unitCostUsd: number }[]) => items.reduce((sum, line) => sum.plus(decimal(line.quantity).mul(decimal(line.unitCostUsd))), new Prisma.Decimal(0))
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

async function validateReferences(companyId: string, input: Pick<ImportInput, 'supplierId' | 'customsAgentId' | 'items'>) {
  const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, companyId, type: SupplierType.FOREIGN, status: ProductStatus.ACTIVE } })
  if (!supplier) throw new AppError('FOREIGN_SUPPLIER_NOT_AVAILABLE', 'Selecciona un proveedor extranjero activo.', 422)
  if (input.customsAgentId) { const agent = await prisma.customsAgent.findFirst({ where: { id: input.customsAgentId, companyId, status: ProductStatus.ACTIVE } }); if (!agent) throw new AppError('CUSTOMS_AGENT_NOT_AVAILABLE', 'Selecciona un agente de aduanas activo.', 422) }
  const presentationIds = [...new Set(input.items.map(line => line.presentationId))]
  const warehouseIds = [...new Set(input.items.map(line => line.warehouseId))]
  const [presentations, warehouses] = await Promise.all([prisma.productPresentation.findMany({ where: { id: { in: presentationIds }, status: ProductStatus.ACTIVE } }), prisma.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId, status: ProductStatus.ACTIVE } })])
  if (presentations.length !== presentationIds.length || warehouses.length !== warehouseIds.length) throw new AppError('IMPORT_REFERENCE_INVALID', 'Producto, presentación o almacén no disponible.', 422)
  for (const line of input.items) { const presentation = presentations.find(value => value.id === line.presentationId); if (!presentation || presentation.productId !== line.productId) throw new AppError('IMPORT_PRODUCT_MISMATCH', 'La presentación no corresponde al producto seleccionado.', 422) }
}

async function applyReceipt(db: Prisma.TransactionClient, record: { number: string; items: { productId: string; presentationId: string; warehouseId: string; quantity: Prisma.Decimal; presentation: { factor: Prisma.Decimal } }[] }) {
  for (const line of record.items) {
    const baseQuantity = line.quantity.mul(line.presentation.factor)
    await db.stock.upsert({ where: { productId_warehouseId: { productId: line.productId, warehouseId: line.warehouseId } }, create: { productId: line.productId, warehouseId: line.warehouseId, quantity: baseQuantity }, update: { quantity: { increment: baseQuantity } } })
    await db.productPresentation.update({ where: { id: line.presentationId }, data: { currentStock: { increment: line.quantity } } })
    await db.inventoryMovement.create({ data: { productId: line.productId, warehouseId: line.warehouseId, type: 'IMPORT_RECEIPT', quantity: baseQuantity, reference: record.number, note: `Recepción de importación ${record.number}` } })
  }
}
const receiptInclude = { items: { include: { presentation: true } } } satisfies Prisma.ImportInclude

export const importService = {
  list(companyId: string, filters: { status?: ImportStatus; supplierId?: string; search?: string }) {
    const where: Prisma.ImportWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.supplierId && { supplierId: filters.supplierId }), ...(filters.search && { OR: [{ number: { contains: filters.search, mode: 'insensitive' } }, { duaNumber: { contains: filters.search, mode: 'insensitive' } }, { containerNumber: { contains: filters.search, mode: 'insensitive' } }, { supplier: { name: { contains: filters.search, mode: 'insensitive' } } }] }) }
    return importRepository.findMany(where)
  },
  async getById(companyId: string, id: string) { const record = await importRepository.findById(id, companyId); if (!record) throw new AppError('IMPORT_NOT_FOUND', 'Importación no encontrada.', 404); return record },
  catalog: (companyId: string) => importRepository.catalog(companyId),
  async create(companyId: string, input: ImportInput) {
    await validateReferences(companyId, input)
    if (await importRepository.findDuplicateDua(companyId, input.duaNumber)) throw new AppError('IMPORT_DUA_EXISTS', 'Ese número de DUA ya fue registrado.', 409)
    return transaction(async db => {
      const created = await importRepository.create(db, { company: { connect: { id: companyId } }, supplier: { connect: { id: input.supplierId } }, ...(input.customsAgentId && { customsAgent: { connect: { id: input.customsAgentId } } }), number: nextNumber(), containerNumber: input.containerNumber, duaNumber: input.duaNumber, purchaseOrderNumber: input.purchaseOrderNumber, countryOfOrigin: input.countryOfOrigin, status: input.status, currency: input.currency, arrivalDate: input.arrivalDate, customsCostUsd: decimal(input.customsCostUsd), customsCostPen: decimal(input.customsCostPen), totalUsd: totalOf(input.items), items: { create: input.items.map(line => ({ product: { connect: { id: line.productId } }, presentation: { connect: { id: line.presentationId } }, warehouse: { connect: { id: line.warehouseId } }, quantity: decimal(line.quantity), unitCostUsd: decimal(line.unitCostUsd) })) }, documents: { create: input.documents.map(document => ({ ...document, storageKey: `pending://imports/${document.fileName}` })) } })
      if (created.status === ImportStatus.RECEIVED) { const receipt = await db.import.findUniqueOrThrow({ where: { id: created.id }, include: receiptInclude }); await applyReceipt(db, receipt) }
      return created
    })
  },
  async update(companyId: string, id: string, input: UpdateImportInput) {
    const current = await this.getById(companyId, id)
    if (current.status === ImportStatus.RECEIVED) throw new AppError('IMPORT_LOCKED', 'Una importación recibida no se puede editar.', 409)
    if (input.status === ImportStatus.RECEIVED && current.status === ImportStatus.CANCELLED) throw new AppError('IMPORT_NOT_RECEIVABLE', 'Una importación cancelada no se puede recibir.', 409)
    const items = input.items ?? current.items.map(line => ({ productId: line.productId, presentationId: line.presentationId, warehouseId: line.warehouseId, quantity: Number(line.quantity), unitCostUsd: Number(line.unitCostUsd) }))
    const supplierId = input.supplierId ?? current.supplierId
    const customsAgentId = input.customsAgentId === undefined ? current.customsAgentId : input.customsAgentId
    await validateReferences(companyId, { supplierId, customsAgentId, items })
    if (input.duaNumber && input.duaNumber !== current.duaNumber) { const duplicate = await importRepository.findDuplicateDua(companyId, input.duaNumber); if (duplicate) throw new AppError('IMPORT_DUA_EXISTS', 'Ese número de DUA ya fue registrado.', 409) }
    const shouldReceive = input.status === ImportStatus.RECEIVED && current.status === ImportStatus.IN_TRANSIT
    return transaction(async db => {
      const updated = await importRepository.update(db, id, { ...(input.supplierId && { supplier: { connect: { id: input.supplierId } } }), ...(input.customsAgentId !== undefined && { customsAgent: input.customsAgentId ? { connect: { id: input.customsAgentId } } : { disconnect: true } }), ...(input.containerNumber && { containerNumber: input.containerNumber }), ...(input.duaNumber && { duaNumber: input.duaNumber }), ...(input.purchaseOrderNumber && { purchaseOrderNumber: input.purchaseOrderNumber }), ...(input.countryOfOrigin && { countryOfOrigin: input.countryOfOrigin }), ...(input.status && { status: input.status }), ...(input.currency && { currency: input.currency }), ...(input.arrivalDate !== undefined && { arrivalDate: input.arrivalDate }), ...(input.customsCostUsd !== undefined && { customsCostUsd: decimal(input.customsCostUsd) }), ...(input.customsCostPen !== undefined && { customsCostPen: decimal(input.customsCostPen) }), ...(input.items && { totalUsd: totalOf(input.items), items: { deleteMany: {}, create: input.items.map(line => ({ product: { connect: { id: line.productId } }, presentation: { connect: { id: line.presentationId } }, warehouse: { connect: { id: line.warehouseId } }, quantity: decimal(line.quantity), unitCostUsd: decimal(line.unitCostUsd) })) } }), ...(input.documents && { documents: { deleteMany: {}, create: input.documents.map(document => ({ ...document, storageKey: `pending://imports/${document.fileName}` })) } }) })
      if (!shouldReceive) return updated
      const receipt = await db.import.findUniqueOrThrow({ where: { id }, include: receiptInclude })
      await applyReceipt(db, receipt)
      return importRepository.update(db, id, { status: ImportStatus.RECEIVED })
    })
  },
  async receive(companyId: string, id: string) {
    const current = await this.getById(companyId, id)
    if (current.status !== ImportStatus.IN_TRANSIT) throw new AppError('IMPORT_NOT_RECEIVABLE', 'Solo se pueden recibir importaciones en tránsito.', 409)
    return transaction(async db => { const receipt = await db.import.findUniqueOrThrow({ where: { id }, include: receiptInclude }); await applyReceipt(db, receipt); return importRepository.update(db, id, { status: ImportStatus.RECEIVED }) })
  },
  async remove(companyId: string, id: string) { const current = await this.getById(companyId, id); if (current.status === ImportStatus.RECEIVED) throw new AppError('IMPORT_LOCKED', 'No se puede eliminar una importación recibida.', 409); await importRepository.remove(prisma, id) },
}
