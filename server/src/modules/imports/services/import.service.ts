import { Prisma, ImportCalculationType, ImportStatus, ProductStatus, SupplierType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { getImportDocumentUrl, removeImportDocument, uploadImportDocument } from '../../../infrastructure/storage/purchase-document.storage.js'
import { importRepository } from '../repositories/import.repository.js'
import type { ImportInput, UpdateImportInput } from '../schemas/import.schema.js'
import { productService } from '../../products/services/product.service.js'
import { exchangeRateService } from '../../exchange-rates/services/exchange-rate.service.js'
import { calculateImportLineSubtotal } from './import-line-calculator.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const nextNumber = () => `IMP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
const transaction = <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(callback, { maxWait: 10_000, timeout: 30_000 })

type ResolvedItem = {
  productId: string
  presentationId: string
  warehouseId: string
  quantity: number
  unitCostUsd: number
  requestedWeightAttributeId?: string
  requestedWeightValue?: number
  calculationType: ImportCalculationType
  weightAttributeId?: string
  weightValue?: number
  weightUnit?: string
  subtotalUsd: Prisma.Decimal
}

type ImportedItemInput = ImportInput['items'][number]
const isVariableItem = (item: ImportedItemInput): item is Extract<ImportedItemInput, { variableSubcategoryId: string }> => 'variableSubcategoryId' in item
const numericValue = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function totalOf(items: Pick<ResolvedItem, 'subtotalUsd'>[]) {
  return items.reduce((sum, line) => sum.plus(line.subtotalUsd), new Prisma.Decimal(0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}

async function validateSupplierAndWarehouses(db: Prisma.TransactionClient | typeof prisma, companyId: string, input: { supplierId: string; customsAgentId?: string | null; warehouseIds: string[] }) {
  const supplier = await db.supplier.findFirst({ where: { id: input.supplierId, companyId, type: SupplierType.FOREIGN, status: ProductStatus.ACTIVE } })
  if (!supplier) throw new AppError('FOREIGN_SUPPLIER_NOT_AVAILABLE', 'Selecciona un proveedor extranjero activo.', 422)
  if (input.customsAgentId) {
    const agent = await db.customsAgent.findFirst({ where: { id: input.customsAgentId, companyId, status: ProductStatus.ACTIVE } })
    if (!agent) throw new AppError('CUSTOMS_AGENT_NOT_AVAILABLE', 'Selecciona un agente de aduanas activo.', 422)
  }
  const warehouseIds = [...new Set(input.warehouseIds)]
  const warehouses = await db.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId, status: ProductStatus.ACTIVE }, select: { id: true } })
  if (warehouses.length !== warehouseIds.length) throw new AppError('IMPORT_REFERENCE_INVALID', 'Selecciona un almacén disponible para cada producto.', 422)
}

async function resolveItems(db: Prisma.TransactionClient, input: ImportInput): Promise<ResolvedItem[]> {
  const resolved: ResolvedItem[] = []
  // Las líneas variables deben crearse en orden: cada producto toma el siguiente
  // correlativo visible dentro de esta misma transacción.
  for (const item of input.items) {
    if (!isVariableItem(item)) {
      resolved.push({
        productId: item.productId,
        presentationId: item.presentationId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        unitCostUsd: item.unitCostUsd,
        requestedWeightAttributeId: item.weightAttributeId,
        requestedWeightValue: item.weightValue,
        calculationType: ImportCalculationType.STANDARD,
        subtotalUsd: calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: item.quantity, unitCostUsd: item.unitCostUsd }),
      })
      continue
    }

    const unit = await db.unit.findFirst({ where: { code: { equals: item.unitCode, mode: 'insensitive' }, status: ProductStatus.ACTIVE } })
    if (!unit) throw new AppError('VARIABLE_UNIT_INVALID', 'La unidad de inventario del producto variable no está disponible.', 422)
    const product = await productService.createFromVariableSubcategory({ subcategoryId: item.variableSubcategoryId, name: item.name, values: item.values, unitId: unit.id, factor: item.factor, minimumStock: item.minimumStock, currentStock: 0, roles: item.roles, status: ProductStatus.ACTIVE }, db)
    const presentation = product.presentations[0]
    if (!presentation) throw new AppError('VARIABLE_PRODUCT_INVALID', 'No se pudo crear la presentación del producto variable.', 422)
    resolved.push({
      productId: product.id,
      presentationId: presentation.id,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      unitCostUsd: item.unitCostUsd,
      requestedWeightValue: item.weightValue,
      calculationType: ImportCalculationType.STANDARD,
      subtotalUsd: calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: item.quantity, unitCostUsd: item.unitCostUsd }),
    })
  }
  return resolved
}

/** Resuelve la estrategia desde el atributo persistido; el cliente nunca decide el subtotal final. */
async function applyCalculationStrategy(db: Prisma.TransactionClient, items: ResolvedItem[]) {
  const presentationIds = [...new Set(items.map(item => item.presentationId))]
  const presentations = await db.productPresentation.findMany({
    where: { id: { in: presentationIds }, status: ProductStatus.ACTIVE },
    include: { product: { include: { attributes: { where: { isWeight: true, status: ProductStatus.ACTIVE } } } } },
  })
  if (presentations.length !== presentationIds.length) throw new AppError('IMPORT_REFERENCE_INVALID', 'Producto o presentación no disponible.', 422)

  return items.map(item => {
    const presentation = presentations.find(value => value.id === item.presentationId)
    if (!presentation || presentation.productId !== item.productId) throw new AppError('IMPORT_PRODUCT_MISMATCH', 'La presentación no corresponde al producto seleccionado.', 422)
    const weightAttributes = presentation.product.attributes
    if (weightAttributes.length > 1) throw new AppError('PRODUCT_WEIGHT_ATTRIBUTE_DUPLICATE', 'El producto tiene más de un atributo de peso configurado.', 422)
    const weightAttribute = weightAttributes[0]
    if (!weightAttribute) return item
    if (weightAttribute.dataType !== 'NUMBER') throw new AppError('WEIGHT_ATTRIBUTE_NOT_NUMERIC', 'El atributo de peso del producto debe ser numérico.', 422)
    if (item.requestedWeightAttributeId && item.requestedWeightAttributeId !== weightAttribute.id) throw new AppError('WEIGHT_ATTRIBUTE_MISMATCH', 'El atributo de peso no corresponde al producto seleccionado.', 422)

    const storedWeight = numericValue((presentation.attributeValues as Record<string, unknown> | null)?.[weightAttribute.id])
    const weightValue = item.requestedWeightValue ?? storedWeight
    if (!weightValue || weightValue <= 0) throw new AppError('WEIGHT_VALUE_REQUIRED', `Ingresa un valor de peso mayor que cero para ${presentation.product.name}.`, 422)
    const subtotalUsd = calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: item.quantity, unitCostUsd: item.unitCostUsd })
    return { ...item, calculationType: ImportCalculationType.STANDARD, weightAttributeId: weightAttribute.id, weightValue, weightUnit: weightAttribute.suffix ?? '', subtotalUsd }
  })
}

async function applyReceipt(db: Prisma.TransactionClient, record: { number: string; items: { productId: string; presentationId: string; warehouseId: string; quantity: Prisma.Decimal; presentation: { factor: Prisma.Decimal } }[] }, userId: string) {
  for (const line of record.items) {
    const baseQuantity = line.quantity.mul(line.presentation.factor)
    await db.stock.upsert({ where: { productId_warehouseId: { productId: line.productId, warehouseId: line.warehouseId } }, create: { productId: line.productId, warehouseId: line.warehouseId, quantity: baseQuantity }, update: { quantity: { increment: baseQuantity } } })
    await db.productPresentation.update({ where: { id: line.presentationId }, data: { currentStock: { increment: line.quantity } } })
    await db.inventoryMovement.create({ data: { productId: line.productId, warehouseId: line.warehouseId, createdByUserId: userId, type: 'IMPORT_RECEIPT', quantity: baseQuantity, reference: record.number, note: `Recepción de importación ${record.number}` } })
  }
}

const receiptInclude = { items: { include: { presentation: true } } } satisfies Prisma.ImportInclude
const withDocumentLinks = async <T extends { documents: { storageKey: string | null }[] }>(record: T) => ({ ...record, documents: await Promise.all(record.documents.map(async document => ({ ...document, linkUrl: document.storageKey ? await getImportDocumentUrl(document.storageKey) : null }))) })
const itemCreateData = (line: ResolvedItem) => ({ product: { connect: { id: line.productId } }, presentation: { connect: { id: line.presentationId } }, warehouse: { connect: { id: line.warehouseId } }, quantity: decimal(line.quantity), unitCostUsd: decimal(line.unitCostUsd), calculationType: line.calculationType, weightAttributeId: line.weightAttributeId ?? null, weightValue: line.weightValue === undefined ? null : decimal(line.weightValue), weightUnit: line.weightUnit ?? null, subtotalUsd: line.subtotalUsd })

export const importService = {
  list(companyId: string, filters: { status?: ImportStatus; supplierId?: string; search?: string }) {
    const where: Prisma.ImportWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.supplierId && { supplierId: filters.supplierId }), ...(filters.search && { OR: [{ number: { contains: filters.search, mode: 'insensitive' } }, { duaNumber: { contains: filters.search, mode: 'insensitive' } }, { containerNumber: { contains: filters.search, mode: 'insensitive' } }, { supplier: { name: { contains: filters.search, mode: 'insensitive' } } }] }) }
    return importRepository.findMany(where)
  },
  async getById(companyId: string, id: string) { const record = await importRepository.findById(id, companyId); if (!record) throw new AppError('IMPORT_NOT_FOUND', 'Importación no encontrada.', 404); return withDocumentLinks(record) },
  catalog: (companyId: string) => importRepository.catalog(companyId),
  async uploadDocument(companyId: string, fileName: string, content: Buffer) { return uploadImportDocument(companyId, fileName, content) },
  async removeDocument(companyId: string, storageKey: string) { if (!storageKey.startsWith(`imports/${companyId}/`)) throw new AppError('IMPORT_DOCUMENT_INVALID', 'El archivo no pertenece a esta empresa.', 403); await removeImportDocument(storageKey) },
  async create(companyId: string, input: ImportInput, userId: string) {
    if (await importRepository.findDuplicateDua(companyId, input.duaNumber)) throw new AppError('IMPORT_DUA_EXISTS', 'Ese número de DUA ya fue registrado.', 409)
    if (input.documents.some(document => document.storageKey && !document.storageKey.startsWith(`imports/${companyId}/`))) throw new AppError('IMPORT_DOCUMENT_INVALID', 'El documento adjunto no pertenece a esta empresa.', 422)
    // Sin una tasa USD → PEN el valor recibido se registraba correctamente,
    // pero su valorización en soles quedaba en cero. Se obtiene una sola vez y
    // queda disponible para esta y las siguientes importaciones.
    if (input.currency === 'USD') await exchangeRateService.ensureCurrent(companyId, userId)
    return transaction(async db => {
      const unresolvedItems = await resolveItems(db, input)
      await validateSupplierAndWarehouses(db, companyId, { supplierId: input.supplierId, customsAgentId: input.customsAgentId, warehouseIds: unresolvedItems.map(item => item.warehouseId) })
      const items = await applyCalculationStrategy(db, unresolvedItems)
      const created = await importRepository.create(db, { company: { connect: { id: companyId } }, supplier: { connect: { id: input.supplierId } }, ...(input.customsAgentId && { customsAgent: { connect: { id: input.customsAgentId } } }), number: nextNumber(), containerNumber: input.containerNumber, duaNumber: input.duaNumber, purchaseOrderNumber: input.purchaseOrderNumber, countryOfOrigin: input.countryOfOrigin, status: input.status, currency: input.currency, arrivalDate: input.arrivalDate, customsCostUsd: decimal(input.customsCostUsd), customsCostPen: decimal(input.customsCostPen), totalUsd: totalOf(items), items: { create: items.map(itemCreateData) }, documents: { create: input.documents } })
      if (created.status === ImportStatus.RECEIVED) { const receipt = await db.import.findUniqueOrThrow({ where: { id: created.id }, include: receiptInclude }); await applyReceipt(db, receipt, userId) }
      return created
    })
  },
  async update(companyId: string, id: string, input: UpdateImportInput, userId: string) {
    const current = await this.getById(companyId, id)
    if (current.status === ImportStatus.RECEIVED) throw new AppError('IMPORT_LOCKED', 'Una importación recibida no se puede editar.', 409)
    if (input.status === ImportStatus.RECEIVED && current.status === ImportStatus.CANCELLED) throw new AppError('IMPORT_NOT_RECEIVABLE', 'Una importación cancelada no se puede recibir.', 409)
    if (input.items?.some(isVariableItem)) throw new AppError('VARIABLE_IMPORT_UPDATE_UNSUPPORTED', 'Los productos variables se definen al registrar una nueva importación.', 422)
    const inputItems = input.items?.map(item => {
      if (isVariableItem(item)) throw new AppError('VARIABLE_IMPORT_UPDATE_UNSUPPORTED', 'Los productos variables se definen al registrar una nueva importación.', 422)
      return { productId: item.productId, presentationId: item.presentationId, warehouseId: item.warehouseId, quantity: item.quantity, unitCostUsd: item.unitCostUsd, requestedWeightAttributeId: item.weightAttributeId, requestedWeightValue: item.weightValue, calculationType: ImportCalculationType.STANDARD, subtotalUsd: calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: item.quantity, unitCostUsd: item.unitCostUsd }) }
    })
    const supplierId = input.supplierId ?? current.supplierId
    const customsAgentId = input.customsAgentId === undefined ? current.customsAgentId : input.customsAgentId
    if (input.duaNumber && input.duaNumber !== current.duaNumber) { const duplicate = await importRepository.findDuplicateDua(companyId, input.duaNumber); if (duplicate) throw new AppError('IMPORT_DUA_EXISTS', 'Ese número de DUA ya fue registrado.', 409) }
    if (input.documents?.some(document => document.storageKey && !document.storageKey.startsWith(`imports/${companyId}/`))) throw new AppError('IMPORT_DOCUMENT_INVALID', 'El documento adjunto no pertenece a esta empresa.', 422)
    const shouldReceive = input.status === ImportStatus.RECEIVED && current.status === ImportStatus.IN_TRANSIT
    if (shouldReceive && (input.currency ?? current.currency) === 'USD') await exchangeRateService.ensureCurrent(companyId, userId)
    return transaction(async db => {
      const items = inputItems ? await applyCalculationStrategy(db, inputItems) : undefined
      await validateSupplierAndWarehouses(db, companyId, { supplierId, customsAgentId, warehouseIds: (items ?? current.items).map(item => item.warehouseId) })
      const updated = await importRepository.update(db, id, { ...(input.supplierId && { supplier: { connect: { id: input.supplierId } } }), ...(input.customsAgentId !== undefined && { customsAgent: input.customsAgentId ? { connect: { id: input.customsAgentId } } : { disconnect: true } }), ...(input.containerNumber && { containerNumber: input.containerNumber }), ...(input.duaNumber && { duaNumber: input.duaNumber }), ...(input.purchaseOrderNumber && { purchaseOrderNumber: input.purchaseOrderNumber }), ...(input.countryOfOrigin && { countryOfOrigin: input.countryOfOrigin }), ...(input.status && { status: input.status }), ...(input.currency && { currency: input.currency }), ...(input.arrivalDate !== undefined && { arrivalDate: input.arrivalDate }), ...(input.customsCostUsd !== undefined && { customsCostUsd: decimal(input.customsCostUsd) }), ...(input.customsCostPen !== undefined && { customsCostPen: decimal(input.customsCostPen) }), ...(items && { totalUsd: totalOf(items), items: { deleteMany: {}, create: items.map(itemCreateData) } }), ...(input.documents && { documents: { deleteMany: {}, create: input.documents.map(document => ({ ...document, storageKey: `pending://imports/${document.fileName}` })) } }) })
      if (!shouldReceive) return updated
      const receipt = await db.import.findUniqueOrThrow({ where: { id }, include: receiptInclude })
      await applyReceipt(db, receipt, userId)
      return importRepository.update(db, id, { status: ImportStatus.RECEIVED })
    })
  },
  async receive(companyId: string, id: string, userId: string) {
    const current = await this.getById(companyId, id)
    if (current.status !== ImportStatus.IN_TRANSIT) throw new AppError('IMPORT_NOT_RECEIVABLE', 'Solo se pueden recibir importaciones en tránsito.', 409)
    if (current.currency === 'USD') await exchangeRateService.ensureCurrent(companyId, userId)
    return transaction(async db => { const receipt = await db.import.findUniqueOrThrow({ where: { id }, include: receiptInclude }); await applyReceipt(db, receipt, userId); return importRepository.update(db, id, { status: ImportStatus.RECEIVED }) })
  },
  async remove(companyId: string, id: string) { const current = await this.getById(companyId, id); if (current.status === ImportStatus.RECEIVED) throw new AppError('IMPORT_LOCKED', 'No se puede eliminar una importación recibida.', 409); await importRepository.remove(prisma, id) },
}
