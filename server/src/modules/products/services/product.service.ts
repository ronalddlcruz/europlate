import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productRepository } from '../repositories/product.repository.js'
import type { CreateProductInput, CreateUnitInput, UpdateProductInput } from '../schemas/product.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const presentationCode = (index: number) => `VAR-${Date.now().toString().slice(-8)}-${index + 1}`
const codePart = (value: string, length: number) => {
  const words = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().match(/[A-Z0-9]+/g) ?? []
  const initials = words.map(word => word[0]).join('')
  const compact = words.join('')
  return (initials.length >= length ? initials : compact).slice(0, length).padEnd(length, 'X')
}
async function nextProductCode(categoryId?: string | null, subcategoryId?: string | null) {
  const [products, categories] = await Promise.all([productRepository.listCodes(), productRepository.listCategories()])
  const category = categories.find(item => item.id === categoryId)
  const subcategory = category?.subcategories.find(item => item.id === subcategoryId)
  const prefix = category ? `${codePart(category.name, 3)}-${codePart(subcategory?.name ?? 'General', 2)}` : 'PRO-GE'
  const expression = new RegExp(`^${prefix}-(\\d+)$`)
  const latest = products.reduce((maximum, product) => Math.max(maximum, Number(product.code.match(expression)?.[1]) || 0), 0)
  return `${prefix}-${String(latest + 1).padStart(2, '0')}`
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
  if (input.code !== undefined) data.code = input.code
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
  async getCatalog(filters: { search?: string; status?: ProductStatus; role?: 'MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT' }) {
    const where: Prisma.ProductWhereInput = { ...(filters.status && { status: filters.status }), ...(filters.role && { roles: { has: filters.role } }), ...(filters.search && { OR: [{ code: { contains: filters.search, mode: 'insensitive' } }, { name: { contains: filters.search, mode: 'insensitive' } }, { presentations: { some: { name: { contains: filters.search, mode: 'insensitive' } } } }] }) }
    return productRepository.findMany(where)
  },
  async getById(id: string) { const product = await productRepository.findById(id); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404); return product },
  async create(input: CreateProductInput) {
    if (input.code && await productRepository.findByCode(input.code)) throw new AppError('PRODUCT_CODE_EXISTS', `El código ${input.code} ya está registrado. Usa otro código o déjalo vacío para generarlo automáticamente.`, 409)
    const code = input.code || await nextProductCode(input.categoryId, input.subcategoryId)
    return prisma.$transaction(async db => {
      const product = await productRepository.create(db, { code, name: input.name, status: input.status, roles: { set: input.roles }, variantType: input.variantType, immediateConsumption: input.immediateConsumption, ...(input.categoryId && { category: { connect: { id: input.categoryId } } }), ...(input.subcategoryId && { subcategory: { connect: { id: input.subcategoryId } } }), ...(input.brandId && { brand: { connect: { id: input.brandId } } }), attributes: { create: input.attributes.map(attributeData) }, presentations: { create: input.presentations.map(presentationData) } })
      await synchronizePresentationAttributeValues(db, product, input)
      return product
    })
  },
  async update(id: string, input: UpdateProductInput) {
    await this.getById(id)
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
    })
  },
  async remove(id: string) { await this.getById(id); await productRepository.delete(id) },
  getUnits: () => productRepository.listUnits(),
  getCategories: () => productRepository.listCategories(),
  async createUnit(input: CreateUnitInput) { if (await productRepository.findUnitByCode(input.code)) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409); return productRepository.createUnit(input) },
  async updateUnit(id: string, input: Partial<CreateUnitInput>) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); if (input.code) { const duplicate = await productRepository.findUnitByCode(input.code); if (duplicate && duplicate.id !== id) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409) } return productRepository.updateUnit(id, input) },
  async removeUnit(id: string) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); await productRepository.deleteUnit(id) },
}
