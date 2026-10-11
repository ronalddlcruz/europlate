import type { loadCatalog } from '@/features/products/services/product-api.service'

export type CatalogData = Awaited<ReturnType<typeof loadCatalog>>
export type CatalogProduct = CatalogData['products'][number]
