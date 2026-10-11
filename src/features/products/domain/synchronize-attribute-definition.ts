import type { Attribute, AttributeDefinition } from '@/features/products/types/product.types'
import type { CatalogData } from '@/features/products/types/product-catalog.types'

export const synchronizeAttributeDefinition = (
  current: CatalogData,
  definition: AttributeDefinition,
): CatalogData => {
  const synchronizeConfigured = (attribute: Attribute) =>
    attribute.definitionId === definition.id
      ? {
          ...attribute,
          name: definition.name,
          type: definition.type,
          suffix: definition.suffix,
          definitionStatus: definition.status,
          isWeight: definition.isWeight,
        }
      : attribute
  return {
    ...current,
    attributes: current.attributes.map((attribute) =>
      attribute.id === definition.id ? definition : attribute,
    ),
    categories: current.categories.map((category) => ({
      ...category,
      attributes: category.attributes.map(synchronizeConfigured),
      subcategories: category.subcategories.map((subcategory) => ({
        ...subcategory,
        attributes: subcategory.attributes.map(synchronizeConfigured),
      })),
    })),
    // Un producto conserva nombre, sufijo y valores como una instantánea;
    // solo recibe el estado maestro para mostrarlo como histórico.
    products: current.products.map((product) => ({
      ...product,
      base: {
        ...product.base,
        attributes: product.base.attributes.map((attribute) =>
          attribute.definitionId === definition.id
            ? { ...attribute, definitionStatus: definition.status }
            : attribute,
        ),
      },
    })),
  }
}
