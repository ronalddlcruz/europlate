import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAttributeDefinition,
  updateAttributeDefinition,
} from '@/features/products/services/product-api.service'
import { synchronizeAttributeDefinition } from '@/features/products/domain/synchronize-attribute-definition'
import type { AttributeDefinition } from '@/features/products/types/product.types'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { ProductModal } from '@/features/products/types/product-modal.types'
import type { Dispatch, SetStateAction } from 'react'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'

type Options = {
  setModal: Dispatch<SetStateAction<ProductModal>>
  notify: (message: string) => void
  refreshProductConsumers: () => Promise<unknown>
}

export function useAttributeOperations({ setModal, notify, refreshProductConsumers }: Options) {
  const queryClient = useQueryClient()
  const createAttributeForCategory = async (attribute: Omit<AttributeDefinition, 'id'>) => {
    const saved = await createAttributeDefinition(attribute)
    queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) =>
      current
        ? {
            ...current,
            attributes: [...current.attributes.filter((item) => item.id !== saved.id), saved].sort(
              (left, right) => left.name.localeCompare(right.name),
            ),
          }
        : current,
    )
    return saved
  }
  const attributeMutation = useMutation({
    mutationFn: async ({ item, editing }: { item: AttributeDefinition; editing: boolean }) => {
      const { ...payload } = item
      return editing
        ? updateAttributeDefinition(item.id, payload)
        : createAttributeDefinition(payload)
    },
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const next = editing
          ? synchronizeAttributeDefinition(current, item)
          : { ...current, attributes: [...current.attributes, item] }
        return {
          ...next,
          attributes: [...next.attributes].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        }
      })
      setModal(null)
      notify('Atributo guardándose en segundo plano…')
      return { previous, optimisticId: item.id, editing }
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const next = context?.editing
          ? synchronizeAttributeDefinition(current, saved)
          : {
              ...current,
              attributes: current.attributes.map((attribute) =>
                attribute.id === context?.optimisticId ? saved : attribute,
              ),
            }
        return {
          ...next,
          attributes: [...next.attributes].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        }
      })
      void refreshProductConsumers()
      notify('Atributo guardado y verificado en la base de datos')
    },
    onError: (reason, variables, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      setModal({
        type: 'attribute',
        item: variables.item,
        editing: variables.editing,
      })
      notify(
        reason instanceof Error
          ? `No se guardó el atributo: ${reason.message}`
          : 'No se pudo guardar el atributo. Se restauró el cambio anterior.',
      )
    },
  })
  return { createAttributeForCategory, attributeMutation }
}
