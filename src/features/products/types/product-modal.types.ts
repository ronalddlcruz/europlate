import type {
  AttributeDefinition,
  ProductBase,
  ProductCategory,
  ProductSubcategory,
  ProductVariant,
  Unit,
} from '@/features/products/types/product.types'

export type ProductModal =
  | { type: 'base'; item?: ProductBase; readOnly?: boolean }
  | { type: 'variant'; item?: ProductVariant; baseId?: string }
  | { type: 'unit'; item?: Unit }
  | { type: 'category'; item?: ProductCategory; editing?: boolean }
  | { type: 'subcategory'; category: ProductCategory; item: ProductSubcategory }
  | { type: 'attribute'; item?: AttributeDefinition; editing?: boolean }
  | null
