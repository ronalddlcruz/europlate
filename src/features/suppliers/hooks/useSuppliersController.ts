import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useMemo,useState } from 'react'
import type { ImportCatalog } from '@/features/imports/services/import-api.service'
import type { PurchaseCatalog } from '@/features/purchases/services/purchase-api.service'
import { sortSuppliers,updateCatalogSuppliers } from '@/features/suppliers/components/shared'
import { createSupplier,deleteSupplier,listSuppliers,updateSupplier,type Supplier } from '@/features/suppliers/services/supplier-api.service'

const EMPTY_SUPPLIERS: Supplier[] = []

export function useSuppliersController() {
  const queryClient = useQueryClient()
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 })
  const suppliers = suppliersQuery.data ?? EMPTY_SUPPLIERS
  const [modalItem, setModalItem] = useState<Supplier | null | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const saveMutation = useMutation({
    mutationFn: ({ item, editing }: { item: Omit<Supplier, 'id'>; editing?: Supplier }) => editing ? updateSupplier(editing.id, item) : createSupplier(item),
    onSuccess: (saved) => {
      queryClient.setQueryData<Supplier[]>(['suppliers'], current => sortSuppliers([...(current ?? []).filter(item => item.id !== saved.id), saved]))
      queryClient.setQueryData<PurchaseCatalog>(['purchases', 'catalog'], current => updateCatalogSuppliers(current, saved, 'Nacional'))
      queryClient.setQueryData<ImportCatalog>(['imports', 'catalog'], current => updateCatalogSuppliers(current, saved, 'Extranjero'))
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      void queryClient.invalidateQueries({ queryKey: ['purchases', 'catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['imports', 'catalog'] })
      setSearch(''); setModalItem(undefined); notify('Proveedor guardado y sincronizado con la base de datos')
    },
    onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo guardar el proveedor'),
  })
  const removeMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: (_, id) => { queryClient.setQueryData<Supplier[]>(['suppliers'], current => current?.filter(item => item.id !== id) ?? []); void queryClient.invalidateQueries({ queryKey: ['suppliers'] }); notify('Proveedor eliminado de la base de datos') },
    onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo eliminar el proveedor'),
  })
  const filtered = useMemo(() => suppliers.filter(supplier => `${supplier.name} ${supplier.document} ${supplier.email}`.toLowerCase().includes(search.toLowerCase())), [suppliers, search])


  return { queryClient, suppliersQuery, suppliers, modalItem, setModalItem, search, setSearch, notice, setNotice, notify, saveMutation, removeMutation, filtered }
}
