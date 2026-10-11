import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCatalogCategory,
  updateCatalogCategory,
} from '@/features/products/services/product-api.service'
import type { ProductCategory } from '@/features/products/types/product.types'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { ProductModal } from '@/features/products/types/product-modal.types'
import type { Dispatch, SetStateAction } from 'react'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'

type Options = {
  setModal: Dispatch<SetStateAction<ProductModal>>
  notify: (message: string) => void
}

export function useCategoryOperations({ setModal, notify }: Options) {
  const queryClient = useQueryClient()
  const categoryMutation = useMutation({
    mutationFn: async ({ item, editing }: { item: ProductCategory; editing: boolean }) => {
      const { ...payload } = item
      return editing ? updateCatalogCategory(item.id, payload) : createCatalogCategory(payload)
    },
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        return {
          ...current,
          categories: editing
            ? current.categories.map((category) => (category.id === item.id ? item : category))
            : [...current.categories, item].sort((left, right) =>
                left.name.localeCompare(right.name),
              ),
        }
      })
      setModal(null)
      notify('Categoría guardándose en segundo plano…')
      return { previous, optimisticId: item.id, editing }
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const categories = context?.editing
          ? current.categories.map((category) => (category.id === saved.id ? saved : category))
          : current.categories.map((category) =>
              category.id === context?.optimisticId ? saved : category,
            )
        return {
          ...current,
          categories: categories.sort((left, right) => left.name.localeCompare(right.name)),
        }
      })
      notify('Categoría guardada y verificada en la base de datos')
    },
    onError: (reason, variables, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      setModal({ type: 'category', item: variables.item, editing: variables.editing })
      notify(
        reason instanceof Error
          ? `No se guardó la categoría: ${reason.message}`
          : 'No se pudo guardar la categoría. Se restauró el cambio anterior.',
      )
    },
  })
  return { categoryMutation }
}
