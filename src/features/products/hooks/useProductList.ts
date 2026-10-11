import { useMemo, useState } from 'react'
import { filterProductBases, orderProductBases } from '@/features/products/domain/product-list'
import type {
  ProductBase,
  ProductVariant,
  ProductCategory,
  ProductRole,
  ProductStatus,
} from '@/features/products/types/product.types'

type Options = { bases: ProductBase[]; variants: ProductVariant[]; categories: ProductCategory[] }

export function useProductList({ bases, variants, categories }: Options) {
  const [roleFilter, setRoleFilter] = useState<'Todos' | ProductRole>('Todos')
  const [statusFilter, setStatusFilter] = useState<'Todos' | ProductStatus>('Todos')
  const [search, setSearch] = useState('')
  const [productsPage, setProductsPage] = useState(1)
  const filteredBases = useMemo(
    () =>
      filterProductBases(bases, variants, categories, {
        role: roleFilter,
        status: statusFilter,
        search,
      }),
    [bases, variants, categories, roleFilter, statusFilter, search],
  )
  const orderedBases = useMemo(() => orderProductBases(filteredBases), [filteredBases])
  const pageSize = 10
  const totalProductPages = Math.max(1, Math.ceil(orderedBases.length / pageSize))
  const currentProductsPage = Math.min(productsPage, totalProductPages)
  const visibleBases = orderedBases.slice(
    (currentProductsPage - 1) * pageSize,
    currentProductsPage * pageSize,
  )
  return {
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    setProductsPage,
    orderedBases,
    pageSize,
    totalProductPages,
    currentProductsPage,
    visibleBases,
  }
}
