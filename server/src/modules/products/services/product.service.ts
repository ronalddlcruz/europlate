import { Prisma, ProductStatus, ProductVariantType } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { productRepository } from '../repositories/product.repository.js'
import type { CreateProductInput, CreateUnitInput, UpdateProductInput } from '../schemas/product.schema.js'

const decimal = (value: number) => new Prisma.Decimal(value)
const productCode = () => `PRD-${Date.now().toString().slice(-6)}`
const presentationCode = (index: number) => `VAR-${Date.now().toString().slice(-6)}-${index + 1}`

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

export const productService = {
  async getCatalog(filters: { search?: string; status?: ProductStatus; role?: 'MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT' }) { const where: Prisma.ProductWhereInput = { ...(filters.status && { status: filters.status }), ...(filters.role && { roles: { has: filters.role } }), ...(filters.search && { OR: [{ code: { contains: filters.search, mode: 'insensitive' } }, { name: { contains: filters.search, mode: 'insensitive' } }, { presentations: { some: { name: { contains: filters.search, mode: 'insensitive' } } } }] }) }; return productRepository.findMany(where) },
  async getById(id: string) { const product = await productRepository.findById(id); if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404); return product },
  async create(input: CreateProductInput) { const existing = input.code ? await productRepository.findByCode(input.code) : null; if (existing) throw new AppError('PRODUCT_CODE_EXISTS', 'El código de producto ya existe.', 409); return prisma.$transaction(async db => { const code = input.code ?? productCode(); const product = await productRepository.create(db, { code, name: input.name, status: input.status, roles: { set: input.roles }, variantType: input.variantType, immediateConsumption: input.immediateConsumption, ...(input.categoryId && { category: { connect: { id: input.categoryId } } }), ...(input.subcategoryId && { subcategory: { connect: { id: input.subcategoryId } } }), ...(input.brandId && { brand: { connect: { id: input.brandId } } }), attributes: { create: input.attributes.map((attribute, position) => ({ ...attribute, suffix: attribute.suffix ?? null, position })) }, presentations: { create: input.presentations.map((presentation, index) => ({ code: presentation.code ?? presentationCode(index), name: presentation.name, unit: { connect: presentation.unitId ? { id: presentation.unitId } : { code: presentation.unitCode! } }, factor: decimal(presentation.factor), minimumStock: decimal(presentation.minimumStock), currentStock: decimal(presentation.currentStock), status: presentation.status })) } }) }) },
  async update(id: string, input: UpdateProductInput) { await this.getById(id); return prisma.$transaction(async db => { const data = productData(input); if (input.attributes !== undefined) data.attributes = { deleteMany: {}, create: input.attributes.map((attribute, position) => ({ ...attribute, suffix: attribute.suffix ?? null, position })) }; if (input.presentations !== undefined) data.presentations = { deleteMany: {}, create: input.presentations.map((presentation, index) => ({ code: presentation.code ?? presentationCode(index), name: presentation.name, unit: { connect: presentation.unitId ? { id: presentation.unitId } : { code: presentation.unitCode! } }, factor: decimal(presentation.factor), minimumStock: decimal(presentation.minimumStock), currentStock: decimal(presentation.currentStock), status: presentation.status })) }; return productRepository.update(db, id, data) }) },
  async remove(id: string) { await this.getById(id); await productRepository.delete(id) },
  getUnits: () => productRepository.listUnits(),
  async createUnit(input: CreateUnitInput) { if (await productRepository.findUnitByCode(input.code)) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409); return productRepository.createUnit(input) },
  async updateUnit(id: string, input: Partial<CreateUnitInput>) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); if (input.code) { const duplicate = await productRepository.findUnitByCode(input.code); if (duplicate && duplicate.id !== id) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409) } return productRepository.updateUnit(id, input) },
  async removeUnit(id: string) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); await productRepository.deleteUnit(id) },
}
