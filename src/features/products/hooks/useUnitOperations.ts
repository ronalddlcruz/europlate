import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCatalogUnit,
  updateCatalogUnit,
  deleteCatalogUnit,
} from '@/features/products/services/product-api.service'
import type { Unit } from '@/features/products/types/product.types'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { ProductModal } from '@/features/products/types/product-modal.types'
import type { Dispatch, SetStateAction } from 'react'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'

type Options = {
  setModal: Dispatch<SetStateAction<ProductModal>>
  notify: (message: string) => void
  refreshCatalog: () => Promise<void>
}

export function useUnitOperations({ setModal, notify, refreshCatalog }: Options) {
  const queryClient = useQueryClient()
  const unitMutation = useMutation({
    mutationFn: ({ item, editing }: { item: Unit; editing: boolean }) =>
      editing ? updateCatalogUnit(item.id, item) : createCatalogUnit(item),
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const units = editing
          ? current.units.map((unit) => (unit.id === item.id ? item : unit))
          : [...current.units, item]
        return {
          ...current,
          units: units.sort((left, right) => left.code.localeCompare(right.code)),
        }
      })
      setModal(null)
      notify('Guardando unidad de medida en segundo plano…')
      return { previous, optimisticId: item.id, editing }
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) => {
        if (!current) return current
        const units = current.units.map((unit) =>
          context?.editing
            ? unit.id === saved.id
              ? saved
              : unit
            : unit.id === context?.optimisticId
              ? saved
              : unit,
        )
        return {
          ...current,
          units: units.sort((left, right) => left.code.localeCompare(right.code)),
        }
      })
      notify('Unidad de medida guardada y verificada en la base de datos')
    },
    onError: (reason, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      notify(
        reason instanceof Error
          ? `No se guardó la unidad: ${reason.message}`
          : 'No se pudo guardar la unidad de medida. Se restauró el cambio anterior.',
      )
    },
    onSettled: () => void refreshCatalog(),
  })
  const deleteUnitMutation = useMutation({
    mutationFn: deleteCatalogUnit,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_CATALOG_QUERY_KEY })
      const previous = queryClient.getQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY)
      queryClient.setQueryData<CatalogData>(PRODUCT_CATALOG_QUERY_KEY, (current) =>
        current
          ? {
              ...current,
              units: current.units.filter((unit) => unit.id !== id),
            }
          : current,
      )
      notify('Eliminando unidad de medida en segundo plano…')
      return { previous }
    },
    onSuccess: () => notify('Unidad de medida eliminada de la base de datos'),
    onError: (reason, _id, context) => {
      if (context?.previous) queryClient.setQueryData(PRODUCT_CATALOG_QUERY_KEY, context.previous)
      notify(
        reason instanceof Error
          ? reason.message
          : 'No se pudo eliminar la unidad. Se restauró el cambio anterior.',
      )
    },
    onSettled: () => void refreshCatalog(),
  })
  return { unitMutation, deleteUnitMutation }
}
