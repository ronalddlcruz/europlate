import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { loadCatalog } from '@/features/products/services/product-api.service'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'

const EMPTY_PRODUCTS: CatalogData['products'] = []
const EMPTY_UNITS: CatalogData['units'] = []
const EMPTY_CATEGORIES: CatalogData['categories'] = []
const EMPTY_ATTRIBUTES: CatalogData['attributes'] = []

export function useProductCatalog() {
  const queryClient = useQueryClient()
  const catalog = useQuery({
    queryKey: PRODUCT_CATALOG_QUERY_KEY,
    queryFn: loadCatalog,
  })
  const products = catalog.data?.products ?? EMPTY_PRODUCTS
  const bases = useMemo(() => products.map((product) => product.base), [products])
  const variants = useMemo(() => products.flatMap((product) => product.variants), [products])
  const units = catalog.data?.units ?? EMPTY_UNITS
  const categories = catalog.data?.categories ?? EMPTY_CATEGORIES
  const attributes = catalog.data?.attributes ?? EMPTY_ATTRIBUTES
  const refreshCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
  }
  const refreshProductConsumers = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['imports', 'catalog'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['purchases', 'catalog'], refetchType: 'all' }),
    ])
  return {
    catalog,
    bases,
    variants,
    units,
    categories,
    attributes,
    refreshCatalog,
    refreshProductConsumers,
  }
}
