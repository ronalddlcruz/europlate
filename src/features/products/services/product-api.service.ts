import { api } from '../../../lib/api-client'
import type { Attribute, ProductBase, ProductCategory, ProductRole, ProductStatus, ProductVariant, Unit } from '../types/product.types'

type ApiProduct = { id: string; code: string; name: string; categoryId: string | null; subcategoryId: string | null; category: { name: string } | null; subcategory: { name: string } | null; status: 'ACTIVE' | 'INACTIVE'; roles: ('MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT')[]; variantType: 'WITH_VARIANTS' | 'BASIC'; immediateConsumption: boolean; attributes: { id: string; name: string; dataType: 'TEXT' | 'NUMBER'; required: boolean; suffix: string | null; status: 'ACTIVE' | 'INACTIVE'; useInSubtotal: boolean }[]; presentations: { id: string; code: string; name: string; attributeValues: Record<string, string> | null; factor: string | number; minimumStock: string | number; currentStock: string | number; status: 'ACTIVE' | 'INACTIVE'; unit: { code: string } }[] }
type ApiUnit = { id: string; code: string; description: string; status: 'ACTIVE' | 'INACTIVE' }
const toRole: Record<ApiProduct['roles'][number], ProductRole> = { MERCHANDISE: 'Mercadería', SUPPLY: 'Insumo', FINISHED_PRODUCT: 'Producto terminado' }
const fromRole: Record<ProductRole, ApiProduct['roles'][number]> = { Mercadería: 'MERCHANDISE', Insumo: 'SUPPLY', 'Producto terminado': 'FINISHED_PRODUCT' }
const toStatus = (status: 'ACTIVE' | 'INACTIVE'): ProductStatus => status === 'ACTIVE' ? 'Activo' : 'Inactivo'
const fromStatus = (status: ProductStatus) => status === 'Activo' ? 'ACTIVE' : 'INACTIVE'
const isPersistedId = (value: string) => /^c[a-z0-9]{24,}$/i.test(value)

export const mapProduct = (product: ApiProduct): { base: ProductBase; variants: ProductVariant[] } => ({
  base: { id: product.id, code: product.code, name: product.name, categoryId: product.categoryId, subcategoryId: product.subcategoryId, categoryName: product.category?.name, subcategoryName: product.subcategory?.name, status: toStatus(product.status), roles: product.roles.map(role => toRole[role]), variantType: product.variantType === 'WITH_VARIANTS' ? 'Con variantes' : 'Básico', immediateConsumption: product.immediateConsumption, attributes: product.attributes.map(attribute => ({ id: attribute.id, name: attribute.name, type: attribute.dataType === 'NUMBER' ? 'Numérico' : 'Texto', required: attribute.required, suffix: attribute.suffix ?? '', status: toStatus(attribute.status), useInSubtotal: attribute.useInSubtotal })) },
  variants: product.presentations.map(presentation => ({ id: presentation.id, baseId: product.id, code: presentation.code, values: presentation.attributeValues ?? {}, name: presentation.name, unit: presentation.unit.code, factor: Number(presentation.factor), minimum: Number(presentation.minimumStock), stock: Number(presentation.currentStock), status: toStatus(presentation.status) })),
})
export const mapUnit = (unit: ApiUnit): Unit => ({ id: unit.id, code: unit.code, description: unit.description, status: toStatus(unit.status) })

export async function loadCatalog() {
  const [products, units, categories] = await Promise.all([api<ApiProduct[]>('/api/products'), api<ApiUnit[]>('/api/products/units'), api<ProductCategory[]>('/api/products/categories')])
  return { products: products.map(mapProduct), units: units.map(mapUnit), categories }
}
function productPayload(base: ProductBase, variants: ProductVariant[], units: Unit[]) {
  return {
    code: base.code || undefined, name: base.name, categoryId: base.categoryId || null, subcategoryId: base.subcategoryId || null,
    status: fromStatus(base.status), roles: base.roles.map(role => fromRole[role]), variantType: base.variantType === 'Con variantes' ? 'WITH_VARIANTS' : 'BASIC', immediateConsumption: base.immediateConsumption ?? true,
    attributes: base.attributes.map((attribute: Attribute) => ({ ...(isPersistedId(attribute.id) && { id: attribute.id }), name: attribute.name, dataType: attribute.type === 'Numérico' ? 'NUMBER' : 'TEXT', suffix: attribute.suffix || null, required: attribute.required, status: fromStatus(attribute.status ?? 'Activo'), useInSubtotal: attribute.useInSubtotal ?? false })),
    presentations: variants.map(variant => { const unit = units.find(value => value.code.toUpperCase() === variant.unit.toUpperCase()); return { ...(isPersistedId(variant.id) && { id: variant.id }), code: variant.code || undefined, name: variant.name, unitId: unit?.id, unitCode: unit ? undefined : variant.unit.toUpperCase(), attributeValues: variant.values, factor: variant.factor, minimumStock: variant.minimum, currentStock: variant.stock, status: fromStatus(variant.status) } }),
  }
}
export async function createCatalogProduct(base: ProductBase, variants: ProductVariant[], units: Unit[]) { return mapProduct(await api<ApiProduct>('/api/products', { method: 'POST', body: JSON.stringify(productPayload(base, variants, units)) })) }
export async function updateCatalogProduct(base: ProductBase, variants: ProductVariant[], units: Unit[]) { return mapProduct(await api<ApiProduct>(`/api/products/${base.id}`, { method: 'PATCH', body: JSON.stringify(productPayload(base, variants, units)) })) }
export async function deleteCatalogProduct(id: string) { await api<void>(`/api/products/${id}`, { method: 'DELETE' }) }
export async function createCatalogUnit(unit: Omit<Unit, 'id'>) { return mapUnit(await api<ApiUnit>('/api/products/units', { method: 'POST', body: JSON.stringify({ code: unit.code, description: unit.description, status: fromStatus(unit.status) }) })) }
export async function updateCatalogUnit(id: string, unit: Omit<Unit, 'id'>) { return mapUnit(await api<ApiUnit>(`/api/products/units/${id}`, { method: 'PATCH', body: JSON.stringify({ code: unit.code, description: unit.description, status: fromStatus(unit.status) }) })) }
export async function deleteCatalogUnit(id: string) { await api<void>(`/api/products/units/${id}`, { method: 'DELETE' }) }
