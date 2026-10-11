import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import {
  loadProductionCatalog,
  type ProductionCatalog,
} from '@/features/production/services/production-api.service'
import {
  createCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct,
  loadCatalog,
} from '@/features/products/services/product-api.service'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type {
  ProductBase,
  ProductRole,
  ProductStatus,
  ProductVariant,
  Unit,
} from '@/features/products/types/product.types'
import type { ProductModal } from '@/features/products/types/product-modal.types'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'

type Options = {
  units: Unit[]
  bases: ProductBase[]
  variants: ProductVariant[]
  setModal: Dispatch<SetStateAction<ProductModal>>
  setSearch: Dispatch<SetStateAction<string>>
  notify: (message: string) => void
  refreshCatalog: () => Promise<void>
  refreshProductConsumers: () => Promise<unknown>
}

export function useProductOperations({
  units,
  bases,
  variants,
  setModal,
  setSearch,
  notify,
  refreshCatalog,
  refreshProductConsumers,
}: Options) {
  const queryClient = useQueryClient()
  /**
   * Hace visible al instante el producto modificado en Nueva Orden de
   * Producción. El refetch posterior conserva disponible/stock confirmado.
   */
  const syncProductionCatalogProduct = (product: CatalogData['products'][number]) => {
    const activeVariant = product.variants.find((variant) => variant.status === 'Activo')
    const mapped = activeVariant
      ? {
          id: product.base.id,
          code: product.base.code,
          name: product.base.name,
          unit: activeVariant.unit,
          unitName:
            units.find((unit) => unit.code === activeVariant.unit)?.description ??
            activeVariant.unit,
          factor: activeVariant.factor,
          available: activeVariant.stock,
        }
      : null
    const updateRole = (current: ProductionCatalog['products'], role: ProductRole) => {
      const eligible = Boolean(
        mapped && product.base.status === 'Activo' && product.base.roles.includes(role),
      )
      if (!eligible || !mapped) return current.filter((item) => item.id !== product.base.id)
      return [...current.filter((item) => item.id !== product.base.id), mapped].sort(
        (left, right) => left.name.localeCompare(right.name),
      )
    }
    queryClient.setQueryData<ProductionCatalog>(['production', 'catalog'], (current) =>
      current
        ? {
            ...current,
            products: updateRole(current.products, 'Producto terminado'),
            materials: updateRole(current.materials, 'Insumo'),
          }
        : current,
    )
  }
  const removeProductFromProductionCatalog = (productId: string) => {
    queryClient.setQueryData<ProductionCatalog>(['production', 'catalog'], (current) =>
      current
        ? {
            ...current,
            products: current.products.filter((item) => item.id !== productId),
            materials: current.materials.filter((item) => item.id !== productId),
          }
        : current,
    )
  }
  const warmProductionCatalog = () => {
    // Si Producción aún no se visitó en esta sesión, iniciamos su carga al
    // guardar el producto para que Nueva Orden abra con el selector listo.
    if (queryClient.getQueryData<ProductionCatalog>(['production', 'catalog'])) return
    void queryClient.prefetchQuery({
      queryKey: ['production', 'catalog'],
      queryFn: loadProductionCatalog,
      staleTime: 0,
    })
  }
  const productMutation = useMutation({
    mutationFn: ({
      base,
      nextVariants,
      editing,
    }: {
      base: ProductBase
      nextVariants: ProductVariant[]
      editing: boolean
    }) =>
      editing
        ? updateCatalogProduct(base, nextVariants, units)
        : createCatalogProduct(base, nextVariants, units),
    onMutate: async ({ base, nextVariants, editing }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const product = { base, variants: nextVariants }
        const products = editing
          ? current.products.map((currentProduct) =>
              currentProduct.base.id === base.id ? product : currentProduct,
            )
          : [...current.products, product]
        return { ...current, products }
      })
      setModal(null)
      return { previous, optimisticId: base.id, editing }
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const products = context?.editing
          ? current.products.map((product) => (product.base.id === saved.base.id ? saved : product))
          : current.products.map((product) =>
              product.base.id === context?.optimisticId ? saved : product,
            )
        return { ...current, products }
      })
      setSearch('')
      syncProductionCatalogProduct(saved)
      warmProductionCatalog()
      void refreshProductConsumers()
      notify('Producto guardado y verificado en la base de datos')
    },
    onError: (reason, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      notify(
        reason instanceof Error
          ? `No se guardó el producto: ${reason.message}`
          : 'No se pudo guardar el producto. Se restauró el cambio anterior.',
      )
    },
    onSettled: () => void refreshCatalog(),
  })
  const statusMutation = useMutation({
    mutationFn: ({ base, nextVariants }: { base: ProductBase; nextVariants: ProductVariant[] }) =>
      updateCatalogProduct(base, nextVariants, units),
    onMutate: async ({ base, nextVariants }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof loadCatalog>>>([
        'products',
        'catalog',
      ])
      queryClient.setQueryData<Awaited<ReturnType<typeof loadCatalog>>>(
        PRODUCT_CATALOG_QUERY_KEY,
        (current) =>
          current
            ? {
                ...current,
                products: current.products.map((product) =>
                  product.base.id === base.id ? { base, variants: nextVariants } : product,
                ),
              }
            : current,
      )
      return { previous }
    },
    onError: (reason, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      notify(
        reason instanceof Error ? reason.message : 'No se pudo actualizar el estado del producto',
      )
    },
    onSuccess: (saved) => {
      syncProductionCatalogProduct(saved)
      warmProductionCatalog()
      void refreshProductConsumers()
    },
    onSettled: () => void refreshCatalog(),
  })
  const deleteProductMutation = useMutation({
    mutationFn: deleteCatalogProduct,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) =>
        current
          ? { ...current, products: current.products.filter((product) => product.base.id !== id) }
          : current,
      )
      return { previous }
    },
    onSuccess: (_result, id) => {
      removeProductFromProductionCatalog(id)
      warmProductionCatalog()
      void refreshProductConsumers()
      notify('Producto eliminado físicamente de la base de datos.')
    },
    onError: (reason, _id, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      notify(reason instanceof Error ? reason.message : 'No se pudo eliminar el producto.')
    },
    onSettled: () => void refreshCatalog(),
  })
  const saveVariant = (item: ProductVariant, editing: boolean) => {
    const base = bases.find((value) => value.id === item.baseId)
    if (!base) return
    const nextVariants = editing
      ? variants
          .map((value) => (value.id === item.id ? item : value))
          .filter((value) => value.baseId === base.id)
      : [...variants.filter((value) => value.baseId === base.id), item]
    productMutation.mutate({ base, nextVariants, editing: true })
  }
  const toggleVariantStatus = (item: ProductVariant) => {
    const base = bases.find((value) => value.id === item.baseId)
    if (!base) return
    const nextVariants = variants
      .filter((value) => value.baseId === base.id)
      .map((value) =>
        value.id === item.id
          ? {
              ...value,
              status: (value.status === 'Activo' ? 'Inactivo' : 'Activo') as ProductStatus,
            }
          : value,
      )
    // El estado operativo pertenece al producto y a sus presentaciones. Al
    // inactivar la última presentación, el producto completo deja de estar
    // disponible en Inventario, reportes y demás catálogos operativos.
    const nextBase = {
      ...base,
      status: nextVariants.some((variant) => variant.status === 'Activo') ? 'Activo' : 'Inactivo',
    } as ProductBase
    statusMutation.mutate({ base: nextBase, nextVariants })
  }
  return {
    productMutation,
    deleteProductMutation,
    saveVariant,
    toggleVariantStatus,
  }
}
