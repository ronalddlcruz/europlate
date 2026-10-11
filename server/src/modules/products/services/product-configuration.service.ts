import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { codePart } from '../domain/product-code.js'
import { productRepository } from '../repositories/product.repository.js'
import type { CreateAttributeDefinitionInput, CreateCategoryInput, CreateUnitInput } from '../schemas/product.schema.js'

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

const configuredAttributeData = (attribute: { attributeDefinitionId?: string | null; name: string; dataType: 'TEXT' | 'NUMBER'; suffix?: string | null; required: boolean; status: ProductStatus }, position: number) => {
  const { attributeDefinitionId, attributeDefinition: _definition, id: _id, ...data } = attribute as typeof attribute & { id?: string; attributeDefinition?: unknown }
  return { ...data, suffix: data.suffix ?? null, position, ...(attributeDefinitionId && { attributeDefinition: { connect: { id: attributeDefinitionId } } }) }
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

/** Conserva los atributos ya usados como inactivos, sin borrar fichas históricas. */
const retainHistoricalAttributes = (
  incoming: CreateCategoryInput['attributes'],
  persisted: Array<CreateCategoryInput['attributes'][number] & { id: string }>,
  protectHistory: boolean,
) => {
  if (!protectHistory) return incoming
  const retainedIds = new Set(incoming.flatMap(attribute => attribute.id ? [attribute.id] : []))
  const retired = persisted
    .filter(attribute => !retainedIds.has(attribute.id))
    .map(attribute => ({
      id: attribute.id,
      attributeDefinitionId: attribute.attributeDefinitionId,
      name: attribute.name,
      dataType: attribute.dataType,
      suffix: attribute.suffix,
      required: attribute.required,
      status: ProductStatus.INACTIVE,
    }))
  return [...incoming, ...retired]
}

function preserveCategoryAttributeHistory(
  input: CreateCategoryInput,
  existing: NonNullable<Awaited<ReturnType<typeof productRepository.findCategory>>>,
  products: Array<{ subcategoryId: string | null }>,
): CreateCategoryInput {
  const usedSubcategoryIds = new Set(products.flatMap(product => product.subcategoryId ? [product.subcategoryId] : []))
  return {
    ...input,
    attributes: retainHistoricalAttributes(input.attributes, existing.attributes, products.length > 0),
    subcategories: input.subcategories.map(subcategory => {
      const persisted = subcategory.id ? existing.subcategories.find(item => item.id === subcategory.id) : undefined
      if (!persisted) return subcategory
      return {
        ...subcategory,
        attributes: retainHistoricalAttributes(subcategory.attributes, persisted.attributes, usedSubcategoryIds.has(subcategory.id!)),
      }
    }),
  }
}

export const productConfigurationService = {
  getUnits: () => productRepository.listUnits(),
  getCategories: () => productRepository.listCategories(),
  getAttributeDefinitions: () => productRepository.listAttributeDefinitions(),
  async createUnit(input: CreateUnitInput) { if (await productRepository.findUnitByCode(input.code)) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409); return productRepository.createUnit(input) },
  async updateUnit(id: string, input: Partial<CreateUnitInput>) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); if (input.code) { const duplicate = await productRepository.findUnitByCode(input.code); if (duplicate && duplicate.id !== id) throw new AppError('UNIT_CODE_EXISTS', 'El código de unidad ya existe.', 409) } return productRepository.updateUnit(id, input) },
  async removeUnit(id: string) { if (!await productRepository.findUnit(id)) throw new AppError('UNIT_NOT_FOUND', 'Unidad de medida no encontrada.', 404); await productRepository.deleteUnit(id) },
  async createCategory(input: CreateCategoryInput) { if (await productRepository.findCategoryByName(input.name)) throw new AppError('CATEGORY_NAME_EXISTS', 'La categoría ya existe.', 409); return productRepository.createCategory(categoryCreateData(input)) },
  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const existing = await productRepository.findCategory(id)
    if (!existing) throw new AppError('CATEGORY_NOT_FOUND', 'Categoría no encontrada.', 404)
    if (input.name) {
      const duplicate = await productRepository.findCategoryByName(input.name)
      if (duplicate && duplicate.id !== id) throw new AppError('CATEGORY_NAME_EXISTS', 'La categoría ya existe.', 409)
    }
    const complete = { code: existing.code, name: existing.name, description: existing.description, status: existing.status, attributes: existing.attributes, subcategories: existing.subcategories, ...input } as CreateCategoryInput
    const products = await prisma.product.findMany({ where: { categoryId: id }, select: { subcategoryId: true } })
    const safeConfiguration = preserveCategoryAttributeHistory(complete, existing, products)
    return productRepository.updateCategory(id, categoryUpdateData(safeConfiguration))
  },
  async removeCategory(id: string) { if (!await productRepository.findCategory(id)) throw new AppError('CATEGORY_NOT_FOUND', 'Categoría no encontrada.', 404); await productRepository.deleteCategory(id) },
  async createAttributeDefinition(input: CreateAttributeDefinitionInput) {
    if (await productRepository.findAttributeDefinitionByName(input.name)) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409)
    return productRepository.createAttributeDefinition({ ...input, code: await nextAttributeDefinitionCode(input.name), suffix: input.suffix ?? null })
  },
  async updateAttributeDefinition(id: string, input: Partial<CreateAttributeDefinitionInput>) {
    const existing = await productRepository.findAttributeDefinition(id)
    if (!existing) throw new AppError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado.', 404)
    const nextIsWeight = input.isWeight ?? existing.isWeight
    if (nextIsWeight && (input.dataType ?? existing.dataType) !== 'NUMBER') throw new AppError('WEIGHT_ATTRIBUTE_NOT_NUMERIC', 'El atributo configurado como peso debe ser numérico.', 422)
    if (input.name) { const duplicate = await productRepository.findAttributeDefinitionByName(input.name); if (duplicate && duplicate.id !== id) throw new AppError('ATTRIBUTE_NAME_EXISTS', 'El nombre del atributo ya existe.', 409) }
    const { code: _ignoredCode, ...data } = input
    const definitionData = { ...data, ...(input.suffix !== undefined && { suffix: input.suffix ?? null }) }
    // La definición maestra se propaga a la configuración; las fichas de producto conservan su instantánea histórica.
    return prisma.$transaction(async db => {
      const definition = await db.attributeDefinition.update({ where: { id }, data: definitionData })
      const configurationData = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.dataType !== undefined && { dataType: input.dataType }),
        ...(input.suffix !== undefined && { suffix: input.suffix ?? null }),
      }
      if (Object.keys(configurationData).length) {
        await Promise.all([
          db.categoryAttribute.updateMany({ where: { attributeDefinitionId: id }, data: configurationData }),
          db.subcategoryAttribute.updateMany({ where: { attributeDefinitionId: id }, data: configurationData }),
        ])
      }
      return definition
    })
  },
  async removeAttributeDefinition(id: string) {
    return this.updateAttributeDefinition(id, { status: ProductStatus.INACTIVE })
  },
}
