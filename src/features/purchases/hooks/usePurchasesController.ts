import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { addPurchaseToDashboard,type DashboardSummary } from '@/features/dashboard/services/dashboard-api.service'
import { loadCatalog } from '@/features/products/services/product-api.service'
import { createPurchase,deletePurchase,getPurchase,listPurchases,loadPurchaseCatalog,type Purchase } from '@/features/purchases/services/purchase-api.service'

export function usePurchasesController() {
  const queryClient = useQueryClient(); const purchasesQuery = useQuery({ queryKey: ['purchases'], queryFn: listPurchases, staleTime: 0 }); const catalogQuery = useQuery({ queryKey: ['purchases', 'catalog'], queryFn: loadPurchaseCatalog, staleTime: 0, gcTime: 15 * 60_000, refetchOnMount: 'always' }); const productsCatalogQuery = useQuery({ queryKey: ['products', 'catalog'], queryFn: loadCatalog, staleTime: 0, gcTime: 15 * 60_000, refetchOnMount: 'always' }); const [modal, setModal] = useState<'new' | 'detail' | null>(null); const [selected, setSelected] = useState<Purchase>(); const detailQuery = useQuery({ queryKey: ['purchases', 'detail', selected?.id], queryFn: () => getPurchase(selected!.id), enabled: modal === 'detail' && Boolean(selected) }); const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const refreshPurchaseConsumers = () => {
    void queryClient.invalidateQueries({ queryKey: ['purchases'], exact: true, refetchType: 'active' })
    void queryClient.invalidateQueries({ queryKey: ['products', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['purchases', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['imports', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
  }
  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: purchase => {
      queryClient.setQueryData<Purchase[]>(['purchases'], current => [purchase, ...(current ?? []).filter(item => item.id !== purchase.id)])
      queryClient.setQueriesData<DashboardSummary>({ queryKey: ['dashboard', 'summary'] }, current => current ? addPurchaseToDashboard(current, purchase) : current)
      refreshPurchaseConsumers()
      notify('Compra registrada, stock actualizado y catálogos sincronizados')
    },
    onError: error => notify(error instanceof Error ? error.message : 'No se pudo registrar la compra'),
  })
  const deleteMutation = useMutation({ mutationFn: deletePurchase, onSuccess: (_, id) => { queryClient.setQueryData<Purchase[]>(['purchases'], current => current?.filter(item => item.id !== id) ?? []); notify('Compra eliminada') }, onError: error => notify(error instanceof Error ? error.message : 'Solo se pueden eliminar compras en borrador') })
  const purchases = purchasesQuery.data ?? []

  return { queryClient, purchasesQuery, catalogQuery, productsCatalogQuery, modal, setModal, selected, setSelected, detailQuery, notice, setNotice, notify, refreshPurchaseConsumers, createMutation, deleteMutation, purchases }
}
