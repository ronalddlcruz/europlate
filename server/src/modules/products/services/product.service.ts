import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productRepository } from '../repositories/product.repository.js'
import type { CreateAttributeDefinitionInput, CreateCategoryInput, CreateProductInput, CreateUnitInput, CreateVariableProductInput, UpdateProductInput } from '../schemas/product.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const presentationCode = (index: number) => `VAR-${Date.now().toString().slice(-8)}-${index + 1}`
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
async function nextProductCode(categoryId?: string | null, subcategoryId?: string | null) {
  const [products, categories] = await Promise.all([productRepository.listCodes(), productRepository.listCategories()])
  const category = categories.find(item => item.id === categoryId)
  const subcategory = category?.subcategories.find(item => item.id === subcategoryId)
  const categoryCode = category ? configuredCodePart(category.code, category.name, 2) : 'PRO'
  const subcategoryCode = subcategory ? configuredCodePart(subcategory.code, subcategory.name, 2) : 'GEN'
  const prefix = `${categoryCode}-${subcategoryCode}`
  const expression = new RegExp(`^${escapeExpression(prefix)}-(\\d+)$`)
  const latest = products.reduce((maximum, product) => Math.max(maximum, Number(product.code.match(expression)?.[1]) || 0), 0)
  return `${prefix}-${String(latest + 1).padStart(3, '0')}`
}
const presentationData = (presentation: CreateProductInput['presentations'][number], index: number) => ({
  code: presentation.code ?? presentationCode(index), name: presentation.name,
  unit: { connect: presentation.unitId ? { id: presentation.unitId } : { code: presentation.unitCode! } },
  attributeValues: presentation.attributeValues, factor: decimal(presentation.factor),
  minimumStock: decimal(presentation.minimumStock), currentStock: decimal(presentation.currentStock), status: presentation.status,
})
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
function categoryCreateData(input: CreateCategoryInput): Prisma.CategoryCreateInput {
  return {
    code: input.code ?? null, name: input.name, description: input.description ?? null, status: input.status,
    attributes: { create: input.attributes.map(configuredAttributeData) },
    subcategories: { create: input.subcategories.map((subcategory) => ({
      code: subcategory.code ?? null, name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
      attributes: { create: subcategory.attributes.map(configuredAttributeData) },
    })) },
  }
}
function categoryUpdateData(input: CreateCategoryInput): Prisma.CategoryUpdateInput {
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
      update: input.subcategories.flatMap((subcategory) => subcategory.id ? [{ where: { id: subcategory.id }, data: {
        code: subcategory.code ?? null, name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
        attributes: {
          deleteMany: subcategory.attributes.flatMap(attribute => attribute.id ? [attribute.id] : []).length ? { id: { notIn: subcategory.attributes.flatMap(attribute => attribute.id ? [attribute.id] : []) } } : {},
          update: subcategory.attributes.flatMap((attribute, position) => attribute.id ? [{ where: { id: attribute.id }, data: configuredAttributeData(attribute, position) }] : []),
          create: subcategory.attributes.filter(attribute => !attribute.id).map(configuredAttributeData),
        },
      } }] : []),
      create: input.subcategories.filter(subcategory => !subcategory.id).map((subcategory) => ({
        code: subcategory.code ?? null, name: subcategory.name, description: subcategory.description ?? null, status: subcategory.status, isVariable: subcategory.isVariable,
        attributes: { create: subcategory.attributes.map(configuredAttributeData) },
      })),
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

export const productService = {
  async createFromVariableSubcategory(input: CreateVariableProductInput, db?: Prisma.TransactionClient) {
    const category = (await productRepository.listCategories()).find(value => value.subcategories.some(subcategory => subcategory.id === input.subcategoryId))
    const subcategory = category?.subcategories.find(value => value.id === input.subcategoryId)
    if (!category || !subcategory?.isVariable) throw new AppError('VARIABLE_SUBCATEGORY_INVALID', 'La subcategoría no está habilitada como producto variable.', 422)
    const attributes = [...category.attributes, ...subcategory.attributes]
    const missing = attributes.find(attribute => attribute.required && !input.values[attribute.id]?.trim())
    if (missing) throw new AppError('VARIABLE_ATTRIBUTE_REQUIRED', `Completa el atributo obligatorio: ${missing.name}.`, 422)
    const name = input.name ?? [subcategory.name, ...attributes.map(attribute => input.values[attribute.id] ? `${input.values[attribute.id]}${attribute.suffix ? ` ${attribute.suffix}` : ''}` : '')].filter(Boolean).join(' · ')
    return this.create({ name, categoryId: category.id, subcategoryId: subcategory.id, status: input.status, roles: input.roles, variantType: 'BASIC', immediateConsumption: true, attributes: attributes.map(attribute => ({ id: attribute.id, name: attribute.name, dataType: attribute.dataType, suffix: attribute.suffix, required: attribute.required, status: attribute.status })), presentations: [{ name, unitId: input.unitId, attributeValues: input.values, factor: input.factor, minimumStock: input.minimumStock, currentStock: input.currentStock, status: input.status }] }, db)
  },
  async getCatalog(filters: { search?: string; status?: ProductStatus; role?: 'MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT' }) {
    const where: Prisma.ProductWhereInput = { ...(filters.status && { status: filters.status }), ...(filters.role && { roles: { has: filters.role } }), ...(filters.search && { OR: [{ code: { contains: filters.search, mode: 'insensitive' } }, { name: { contains: filters.search, mode: 'insensitive' } }, { presentations: { some: { name: { contains: filters.search, mode: 'insensitive' } } } }] }) }
    return productRepository.findMany(where)
  },
  async getById(id: string) { const product = await productRepository.findById(id); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404); return product },
  async create(input: CreateProductInput, existingTransaction?: Prisma.TransactionClient) {
    const code = await nextProductCode(input.categoryId, input.subcategoryId)
    await validateSubcategory(input.categoryId, input.subcategoryId)
    const persist = async (db: Prisma.TransactionClient) => {
      const product = await productRepository.create(db, { code, name: input.name, status: input.status, roles: { set: input.roles }, variantType: input.variantType, immediateConsumption: input.immediateConsumption, ...(input.categoryId && { category: { connect: { id: input.categoryId } } }), ...(input.subcategoryId && { subcategory: { connect: { id: input.subcategoryId } } }), ...(input.brandId && { brand: { connect: { id: input.brandId } } }), attributes: { create: input.attributes.map(attributeData) }, presentations: { create: input.presentations.map(presentationData) } })
      await synchronizePresentationAttributeValues(db, product, input)
      return product
    }
    return existingTransaction ? persist(existingTransaction) : prisma.$transaction(persist, { maxWait: 10_000, timeout: 30_000 })
  },
  async update(id: string, input: UpdateProductInput) {
    await this.getById(id)
    if (input.subcategoryId !== undefined) await validateSubcategory(input.categoryId, input.subcategoryId)
    const data = productData(input)
    if (input.attributes !== undefined) {
      const retainedIds = input.attributes.flatMap(attribute => attribute.id ? [attribute.id] : [])
      data.attributes = {
        deleteMany: retainedIds.length ? { id: { notIn: retainedIds } } : {},
        update: input.attributes.flatMap((attribute, position) => attribute.id ? [{ where: { id: attribute.id }, data: attributeData(attribute, position) }] : []),
        create: input.attributes.filter(attribute => !attribute.id).map(attributeData),
      }
    }
    if (input.presentations !== undefined) data.presentations = {
      update: input.presentations.flatMap(presentation => presentation.id ? [{ where: { id: presentation.id }, data: presentationData(presentation, 0) }] : []),
      create: input.presentations.filter(presentation => !presentation.id).map(presentationData),
    }
    return prisma.$transaction(async db => {
      const product = await productRepository.update(db, id, data)
      if (input.attributes !== undefined && input.presentations !== undefined) await synchronizePresentationAttributeValues(db, product, input as CreateProductInput)
      return product
    }, { maxWait: 10_000, timeout: 30_000 })
  },
  async remove(id: string) { await this.getById(id); await productRepository.delete(id) },
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
    if (await productRepository.findAttributeDefinitionByCode(input.code)) throw new AppError('ATTRIBUTE_CODE_EXISTS', 'El código del atributo ya existe.', 409)
    if (await productRepository.findAttributeDefinitionByName(input.name)) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409)
    return productRepository.createAttributeDefinition({ ...input, suffix: input.suffix ?? null })
  },
  async updateAttributeDefinition(id: string, input: Partial<CreateAttributeDefinitionInput>) {
    if (!await productRepository.findAttributeDefinition(id)) throw new AppError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado.', 404)
    if (input.code) { const duplicate = await productRepository.findAttributeDefinitionByCode(input.code); if (duplicate && duplicate.id !== id) throw new AppError('ATTRIBUTE_CODE_EXISTS', 'El código del atributo ya existe.', 409) }
    if (input.name) { const duplicate = await productRepository.findAttributeDefinitionByName(input.name); if (duplicate && duplicate.id !== id) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409) }
    return productRepository.updateAttributeDefinition(id, { ...input, ...(input.suffix !== undefined && { suffix: input.suffix ?? null }) })
  },
  async removeAttributeDefinition(id: string) { if (!await productRepository.findAttributeDefinition(id)) throw new AppError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado.', 404); await productRepository.deleteAttributeDefinition(id) },
}
