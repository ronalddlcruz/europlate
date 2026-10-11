import { matchesProductSearch } from '@/lib/product-search'
import type {
  ProductBase,
  ProductCategory,
  ProductRole,
  ProductStatus,
  ProductVariant,
} from '@/features/products/types/product.types'

export type ProductListFilter = {
  role: 'Todos' | ProductRole
  status: 'Todos' | ProductStatus
  search: string
}

export function filterProductBases(
  bases: ProductBase[],
  variants: ProductVariant[],
  categories: ProductCategory[],
  filter: ProductListFilter,
): ProductBase[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const variantsByBaseId = new Map<string, ProductVariant[]>()
  for (const variant of variants) {
    const group = variantsByBaseId.get(variant.baseId)
    if (group) group.push(variant)
    else variantsByBaseId.set(variant.baseId, [variant])
  }

  return bases.filter((base) => {
    // La fila muestra el estado de su presentación de inventario.
    const productVariants = variantsByBaseId.get(base.id) ?? []
    const inventory = productVariants[0]
    const visibleStatus = inventory?.status ?? base.status
    const category = categoryById.get(base.categoryId ?? '')
    const subcategory = category?.subcategories.find((item) => item.id === base.subcategoryId)
    const searchableProductData = [
      base.name,
      base.code,
      base.categoryName,
      category?.name,
      base.subcategoryName,
      subcategory?.name,
      ...base.roles,
      ...base.attributes.flatMap((attribute) => [attribute.name, attribute.suffix]),
      ...productVariants.flatMap((variant) => [
        variant.name,
        variant.unit,
        ...Object.values(variant.values),
      ]),
    ]
      .filter(Boolean)
      .join(' ')

    return (
      (filter.role === 'Todos' || base.roles.includes(filter.role)) &&
      (filter.status === 'Todos' || visibleStatus === filter.status) &&
      matchesProductSearch(searchableProductData, filter.search)
    )
  })
}

export function orderProductBases(bases: ProductBase[]): ProductBase[] {
  return [...bases].sort((left, right) =>
    left.code.localeCompare(right.code, 'es', { numeric: true, sensitivity: 'base' }),
  )
}
