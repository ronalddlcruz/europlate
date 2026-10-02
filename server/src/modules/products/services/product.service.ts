import { Prisma, ProductRoleType, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productRepository } from '../repositories/product.repository.js'
import type { CreateAttributeDefinitionInput, CreateCategoryInput, CreateProductInput, CreateUnitInput, CreateVariableProductInput, UpdateProductInput } from '../schemas/product.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
/** El código de presentación se ancla al código único de su producto. */
const presentationCode = (productCode: string, index: number) => `PRE-${productCode}-${index + 1}`
const codePart = (value: string, length: number) => {
  const words = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().match(/[A-Z0-9]+/g) ?? []
  const initials = words.map(word => word[0]).join('')
  const compact = words.join('')
  return (initials.length >= length ? initials : compact).slice(0, length).padEnd(length, 'X')
}
const configuredCodePart = (configuredCode: string | null | undefined, name: string, fallbackLength: number) => {
  const configured = configuredCode?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return configured || codePart(name, fallbackLength)
}
const escapeExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const attributeCodeBase = (name: string) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 24) || 'ATRIBUTO'
async function nextAttributeDefinitionCode(name: string) {
  const base = attributeCodeBase(name)
  const codes = new Set((await productRepository.listAttributeDefinitionCodes()).map(item => item.code))
  if (!codes.has(base)) return base
  let suffix = 2
  while (codes.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}
type ProductMutationContext = { companyId: string; userId: string }
async function nextProductCode(db: Prisma.TransactionClient, categoryId?: string | null, subcategoryId?: string | null) {
  const category = categoryId ? await db.category.findUnique({ where: { id: categoryId }, include: { subcategories: true } }) : null
  const subcategory = category?.subcategories.find(item => item.id === subcategoryId)
  const categoryCode = category ? configuredCodePart(category.code, category.name, 2) : 'PRO'
  const subcategoryCode = subcategory ? configuredCodePart(subcategory.code, subcategory.name, 2) : 'GEN'
  const prefix = `${categoryCode}-${subcategoryCode}`
  const expression = new RegExp(`^${escapeExpression(prefix)}-(\\d+)$`)
  const latestProduct = await db.product.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: 'desc' }, select: { code: true } })
  const latest = Number(latestProduct?.code.match(expression)?.[1]) || 0
  return `${prefix}-${String(latest + 1).padStart(3, '0')}`
}
const presentationData = (presentation: CreateProductInput['presentations'][number], index: number, productCode?: string) => ({
  code: presentation.code ?? (productCode ? presentationCode(productCode, index) : `PRE-${Date.now().toString().slice(-8)}-${index + 1}`), name: presentation.name,
  unit: { connect: presentation.unitId ? { id: presentation.unitId } : { code: presentation.unitCode! } },
  attributeValues: presentation.attributeValues, factor: decimal(presentation.factor),
  minimumStock: decimal(presentation.minimumStock), currentStock: decimal(presentation.currentStock), status: presentation.status,
})
/**
 * La tabla Stock guarda unidades físicas. Si cambia el factor de conversión,
 * ajustamos ese saldo con la misma proporción para conservar la cantidad que
 * el usuario ve y administra en su unidad de inventario.
 */
async function preserveInventoryQuantityOnFactorChange(
  db: Prisma.TransactionClient,
  productId: string,
  previousFactor: Prisma.Decimal,
  nextFactor: number,
) {
  const next = decimal(nextFactor)
  if (previousFactor.equals(next)) return

  const stocks = await db.stock.findMany({ where: { productId }, select: { id: true, quantity: true } })
  await Promise.all(stocks.map(stock => db.stock.update({
    where: { id: stock.id },
    data: { quantity: stock.quantity.div(previousFactor).mul(next) },
  })))
}
const attributeData = (attribute: CreateProductInput['attributes'][number], position: number) => {
  const { id: _id, ...data } = attribute
  return { ...data, suffix: data.suffix ?? null, position }
}
function productData(input: CreateProductInput | UpdateProductInput): Prisma.ProductUpdateInput {
  const data: Prisma.ProductUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.status !== undefined) data.status = input.status
  if (input.variantType !== undefined) data.variantType = input.variantType
  if (input.immediateConsumption !== undefined) data.immediateConsumption = input.immediateConsumption
  if (input.roles !== undefined) data.roles = { set: input.roles }
  if (input.categoryId !== undefined) data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }
  if (input.subcategoryId !== undefined) data.subcategory = input.subcategoryId ? { connect: { id: input.subcategoryId } } : { disconnect: true }
  if (input.brandId !== undefined) data.brand = input.brandId ? { connect: { id: input.brandId } } : { disconnect: true }
  return data
}
const configuredAttributeData = (attribute: { attributeDefinitionId?: string | null; name: string; dataType: 'TEXT' | 'NUMBER'; suffix?: string | null; required: boolean; status: ProductStatus }, position: number) => {
  const { attributeDefinitionId, attributeDefinition: _definition, id: _id, ...data } = attribute as typeof attribute & { id?: string; attributeDefinition?: unknown }
  return { ...data, suffix: data.suffix ?? null, position, ...(attributeDefinitionId && { attributeDefinition: { connect: { id: attributeDefinitionId } } }) }
}
const validateWeightAttributes = (attributes: { dataType: 'TEXT' | 'NUMBER'; isWeight?: boolean }[]) => {
  const weights = attributes.filter(attribute => attribute.isWeight)
  if (weights.some(attribute => attribute.dataType !== 'NUMBER')) throw new AppError('WEIGHT_ATTRIBUTE_NOT_NUMERIC', 'El atributo configurado como peso debe ser numérico.', 422)
  if (weights.length > 1) throw new AppError('PRODUCT_WEIGHT_ATTRIBUTE_DUPLICATE', 'Un producto solo puede tener un atributo configurado como peso.', 422)
}
const subcategoryCodes = (subcategories: CreateCategoryInput['subcategories']) => {
  const used = new Set<string>()
  return subcategories.map(subcategory => {
    const base = subcategory.code || codePart(subcategory.name, 3)
    let code = base; let suffix = 2
    while (used.has(code)) code = `${base}-${suffix++}`
    used.add(code)
    return code
  })
}
function categoryCreateData(input: CreateCategoryInput): Prisma.CategoryCreateInput {
  const codes = subcategoryCodes(input.subcategories)
  return {
    code: input.code ?? null, name: input.name, description: input.description ?? null, status: input.status,
    attributes: { create: input.attributes.map(configuredAttributeData) },
    subcategories: { create: input.subcategories.map((subcategory, index) => ({
      code: codes[index], name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
      attributes: { create: subcategory.attributes.map(configuredAttributeData) },
    })) },
  }
}
function categoryUpdateData(input: CreateCategoryInput): Prisma.CategoryUpdateInput {
  const codes = subcategoryCodes(input.subcategories)
  const retainedAttributes = input.attributes.flatMap(attribute => attribute.id ? [attribute.id] : [])
  const retainedSubcategories = input.subcategories.flatMap(subcategory => subcategory.id ? [subcategory.id] : [])
  return {
    code: input.code ?? null, name: input.name, description: input.description ?? null, status: input.status,
    attributes: {
      deleteMany: retainedAttributes.length ? { id: { notIn: retainedAttributes } } : {},
      update: input.attributes.flatMap((attribute, position) => attribute.id ? [{ where: { id: attribute.id }, data: configuredAttributeData(attribute, position) }] : []),
      create: input.attributes.filter(attribute => !attribute.id).map(configuredAttributeData),
    },
    subcategories: {
      deleteMany: retainedSubcategories.length ? { id: { notIn: retainedSubcategories } } : {},
      update: input.subcategories.flatMap((subcategory, index) => subcategory.id ? [{ where: { id: subcategory.id }, data: {
        code: codes[index], name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
        attributes: {
          deleteMany: subcategory.attributes.flatMap(attribute => attribute.id ? [attribute.id] : []).length ? { id: { notIn: subcategory.attributes.flatMap(attribute => attribute.id ? [attribute.id] : []) } } : {},
          update: subcategory.attributes.flatMap((attribute, position) => attribute.id ? [{ where: { id: attribute.id }, data: configuredAttributeData(attribute, position) }] : []),
          create: subcategory.attributes.filter(attribute => !attribute.id).map(configuredAttributeData),
        },
      } }] : []),
      create: input.subcategories.flatMap((subcategory, index) => !subcategory.id ? [{
        code: codes[index], name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
        attributes: { create: subcategory.attributes.map(configuredAttributeData) },
      }] : []),
    },
  }
}
async function validateSubcategory(categoryId?: string | null, subcategoryId?: string | null) {
  if (!subcategoryId) return
  if (!categoryId) throw new AppError('SUBCATEGORY_REQUIRES_CATEGORY', 'Selecciona la categoría de la subcategoría.', 422)
  const category = await productRepository.findCategory(categoryId)
  if (!category?.subcategories.some(subcategory => subcategory.id === subcategoryId)) throw new AppError('INVALID_SUBCATEGORY', 'La subcategoría no pertenece a la categoría seleccionada.', 422)
}
async function synchronizePresentationAttributeValues(
  db: Prisma.TransactionClient,
  product: { attributes: { id: string }[]; presentations: { id: string; name: string }[] },
  input: Pick<CreateProductInput, 'attributes' | 'presentations'>,
) {
  const persistedAttributeIds = new Map(input.attributes.map((attribute, index) => [attribute.id, product.attributes[index]?.id]))
  await Promise.all(input.presentations.map(async presentation => {
    const target = product.presentations.find(item => item.id === presentation.id || item.name === presentation.name)
    if (!target) return
    const attributeValues = Object.fromEntries(Object.entries(presentation.attributeValues).map(([temporaryId, value]) => [persistedAttributeIds.get(temporaryId) ?? temporaryId, value]))
    await db.productPresentation.update({ where: { id: target.id }, data: { attributeValues } })
  }))
}
async function initializeProductStock(
  db: Prisma.TransactionClient,
  product: { id: string; code: string; roles: ProductRoleType[]; presentations: { id: string; name: string; factor: Prisma.Decimal; currentStock: Prisma.Decimal }[] },
  context?: ProductMutationContext,
) {
  if (!context) return
  const quantity = product.presentations.reduce((total, presentation) => total.plus(presentation.currentStock.mul(presentation.factor)), new Prisma.Decimal(0))
  if (quantity.lte(0)) return
  const warehouses = await db.warehouse.findMany({ where: { companyId: context.companyId, status: ProductStatus.ACTIVE }, orderBy: { name: 'asc' } })
  const preferredName = product.roles.includes(ProductRoleType.FINISHED_PRODUCT) ? /terminad/i : product.roles.includes(ProductRoleType.SUPPLY) ? /insumo/i : /principal/i
  const warehouse = warehouses.find(item => preferredName.test(item.name)) ?? warehouses[0]
  if (!warehouse) throw new AppError('INITIAL_STOCK_WAREHOUSE_REQUIRED', 'Crea un almacén activo antes de registrar un producto con stock inicial.', 422)
  const presentation = product.presentations[0]
  await db.stock.upsert({
    where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    create: { productId: product.id, warehouseId: warehouse.id, quantity },
    update: { quantity: { increment: quantity } },
  })
  await db.inventoryMovement.create({
    data: {
      productId: product.id,
      presentationId: presentation?.id,
      warehouseId: warehouse.id,
      createdByUserId: context.userId,
      type: 'INITIAL_STOCK',
      quantity,
      reference: product.code,
      note: 'Stock inicial registrado al crear el producto.',
    },
  })
}

export const productService = {
  async createFromVariableSubcategory(input: CreateVariableProductInput, db?: Prisma.TransactionClient, context?: ProductMutationContext) {
    const category = (await productRepository.listCategories()).find(value => value.subcategories.some(subcategory => subcategory.id === input.subcategoryId))
    const subcategory = category?.subcategories.find(value => value.id === input.subcategoryId)
    if (!category || !subcategory?.isVariable) throw new AppError('VARIABLE_SUBCATEGORY_INVALID', 'La subcategoría no está habilitada como producto variable.', 422)
    const attributes = [...category.attributes, ...subcategory.attributes]
    const missing = attributes.find(attribute => attribute.required && !input.values[attribute.id]?.trim())
    if (missing) throw new AppError('VARIABLE_ATTRIBUTE_REQUIRED', `Completa el atributo obligatorio: ${missing.name}.`, 422)
    const name = input.name ?? [subcategory.name, ...attributes.map(attribute => input.values[attribute.id] ? `${input.values[attribute.id]}${attribute.suffix ?? ''}` : '')].filter(Boolean).join(' · ')
    return this.create({ name, categoryId: category.id, subcategoryId: subcategory.id, status: input.status, roles: input.roles, variantType: 'BASIC', immediateConsumption: true, attributes: attributes.map(attribute => ({ id: attribute.id, name: attribute.name, dataType: attribute.dataType, suffix: attribute.suffix, required: attribute.required, status: attribute.status, useInSubtotal: false, isWeight: attribute.attributeDefinition?.isWeight ?? false })), presentations: [{ name, unitId: input.unitId, attributeValues: input.values, factor: input.factor, minimumStock: input.minimumStock, currentStock: input.currentStock, status: input.status }] }, db, context)
  },
  async getCatalog(filters: { search?: string; status?: ProductStatus; role?: 'MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT' }) {
    const where: Prisma.ProductWhereInput = { ...(filters.status && { status: filters.status }), ...(filters.role && { roles: { has: filters.role } }), ...(filters.search && { OR: [{ code: { contains: filters.search, mode: 'insensitive' } }, { name: { contains: filters.search, mode: 'insensitive' } }, { presentations: { some: { name: { contains: filters.search, mode: 'insensitive' } } } }] }) }
    return productRepository.findMany(where)
  },
  async getById(id: string) { const product = await productRepository.findById(id); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404); return product },
  async create(input: CreateProductInput, existingTransaction?: Prisma.TransactionClient, context?: ProductMutationContext) {
    validateWeightAttributes(input.attributes)
    await validateSubcategory(input.categoryId, input.subcategoryId)
    const persist = async (db: Prisma.TransactionClient) => {
      const code = await nextProductCode(db, input.categoryId, input.subcategoryId)
      const product = await productRepository.create(db, { code, name: input.name, status: input.status, roles: { set: input.roles }, variantType: input.variantType, immediateConsumption: input.immediateConsumption, ...(input.categoryId && { category: { connect: { id: input.categoryId } } }), ...(input.subcategoryId && { subcategory: { connect: { id: input.subcategoryId } } }), ...(input.brandId && { brand: { connect: { id: input.brandId } } }), attributes: { create: input.attributes.map(attributeData) }, presentations: { create: input.presentations.map((presentation, index) => presentationData(presentation, index, code)) } })
      await synchronizePresentationAttributeValues(db, product, input)
      await initializeProductStock(db, product, context)
      return product
    }
    return existingTransaction ? persist(existingTransaction) : prisma.$transaction(persist, { maxWait: 10_000, timeout: 30_000 })
  },
  async update(id: string, input: UpdateProductInput) {
    const existing = await this.getById(id)
    if (input.subcategoryId !== undefined) await validateSubcategory(input.categoryId, input.subcategoryId)
    const data = productData(input)
    // No permitimos que un producto quede activo si todas las presentaciones
    // recibidas están inactivas. Esto mantiene consistente el estado que usan
    // Inventario, reportes y los selectores operativos.
    if (input.presentations?.length && input.presentations.every(presentation => presentation.status === ProductStatus.INACTIVE)) {
      data.status = ProductStatus.INACTIVE
    }
    if (input.attributes !== undefined) {
      validateWeightAttributes(input.attributes)
      const retainedIds = input.attributes.flatMap(attribute => attribute.id ? [attribute.id] : [])
      data.attributes = {
        deleteMany: retainedIds.length ? { id: { notIn: retainedIds } } : {},
        update: input.attributes.flatMap((attribute, position) => attribute.id ? [{ where: { id: attribute.id }, data: attributeData(attribute, position) }] : []),
        create: input.attributes.filter(attribute => !attribute.id).map(attributeData),
      }
    }
    if (input.presentations !== undefined) data.presentations = {
      update: input.presentations.flatMap((presentation, index) => presentation.id ? [{ where: { id: presentation.id }, data: presentationData(presentation, index, existing.code) }] : []),
      create: input.presentations.filter(presentation => !presentation.id).map((presentation, index) => presentationData(presentation, index, existing.code)),
    }
    return prisma.$transaction(async db => {
      const product = await productRepository.update(db, id, data)
      if (input.presentations !== undefined) {
        // Stock es un saldo por producto. La vista de inventario utiliza su
        // presentación principal; por ello solo esa conversión puede
        // recalibrar el saldo físico, aun cuando el producto tenga variantes.
        const inventoryPresentation = existing.presentations[0]
        const updatedPresentation = input.presentations.find(presentation => presentation.id === inventoryPresentation?.id)
        if (inventoryPresentation && updatedPresentation) {
          await preserveInventoryQuantityOnFactorChange(db, id, inventoryPresentation.factor, updatedPresentation.factor)
        }
      }
      if (input.attributes !== undefined && input.presentations !== undefined) await synchronizePresentationAttributeValues(db, product, input as CreateProductInput)
      return product
    }, { maxWait: 10_000, timeout: 30_000 })
  },
  async remove(id: string) {
    await this.getById(id)
    try {
      // Prisma elimina en cascada las presentaciones, atributos e identificadores
      // del producto cuando no existen operaciones que lo referencien.
      await productRepository.delete(id)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('PRODUCT_IN_USE', 'No se puede eliminar este producto porque ya tiene operaciones registradas. Puedes inactivarlo para conservar su historial.', 409)
      }
      throw error
    }
  },
  getUnits: () => productRepository.listUnits(),
  getCategories: () => productRepository.listCategories(),
  getAttributeDefinitions: () => productRepository.listAttributeDefinitions(),
  async createUnit(input: CreateUnitInput) { if (await productRepository.findUnitByCode(input.code)) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409); return productRepository.createUnit(input) },
  async updateUnit(id: string, input: Partial<CreateUnitInput>) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); if (input.code) { const duplicate = await productRepository.findUnitByCode(input.code); if (duplicate && duplicate.id !== id) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409) } return productRepository.updateUnit(id, input) },
  async removeUnit(id: string) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); await productRepository.deleteUnit(id) },
  async createCategory(input: CreateCategoryInput) { if (await productRepository.findCategoryByName(input.name)) throw new AppError('CATEGORY_NAME_EXISTS', 'La categoría ya existe.', 409); return productRepository.createCategory(categoryCreateData(input)) },
  async updateCategory(id: string, input: Partial<CreateCategoryInput>) { const existing = await productRepository.findCategory(id); if (!existing) throw new AppError('CATEGORY_NOT_FOUND', 'Categoría no encontrada.', 404); if (input.name) { const duplicate = await productRepository.findCategoryByName(input.name); if (duplicate && duplicate.id !== id) throw new AppError('CATEGORY_NAME_EXISTS', 'La categoría ya existe.', 409) } const complete = { code: existing.code, name: existing.name, description: existing.description, status: existing.status, attributes: existing.attributes, subcategories: existing.subcategories, ...input } as CreateCategoryInput; return productRepository.updateCategory(id, categoryUpdateData(complete)) },
  async removeCategory(id: string) { if (!await productRepository.findCategory(id)) throw new AppError('CATEGORY_NOT_FOUND', 'Categoría no encontrada.', 404); await productRepository.deleteCategory(id) },
  async createAttributeDefinition(input: CreateAttributeDefinitionInput) {
    if (await productRepository.findAttributeDefinitionByName(input.name)) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409)
    return productRepository.createAttributeDefinition({ ...input, code: await nextAttributeDefinitionCode(input.name), suffix: input.suffix ?? null })
  },
  async updateAttributeDefinition(id: string, input: Partial<CreateAttributeDefinitionInput>) {
    const existing = await productRepository.findAttributeDefinition(id)
    if (!existing) throw new AppError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado.', 404)
    if ((input.isWeight ?? existing.isWeight) && (input.dataType ?? existing.dataType) !== 'NUMBER') throw new AppError('WEIGHT_ATTRIBUTE_NOT_NUMERIC', 'El atributo configurado como peso debe ser numérico.', 422)
    if (input.name) { const duplicate = await productRepository.findAttributeDefinitionByName(input.name); if (duplicate && duplicate.id !== id) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409) }
    const { code: _ignoredCode, ...data } = input
    return productRepository.updateAttributeDefinition(id, { ...data, ...(input.suffix !== undefined && { suffix: input.suffix ?? null }) })
  },
  async removeAttributeDefinition(id: string) { if (!await productRepository.findAttributeDefinition(id)) throw new AppError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado.', 404); await productRepository.deleteAttributeDefinition(id) },
}
