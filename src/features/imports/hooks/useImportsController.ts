import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { loadCatalog } from '../../products/services/product-api.service'
import { createImport,deleteImport,getImport,listImports,loadImportCatalog,updateImport,type ImportPayload,type ImportRecord } from '../services/import-api.service'

export function useImportsController() {
  const queryClient = useQueryClient()
  const importsQuery = useQuery({ queryKey: ['imports'], queryFn: listImports })
  const catalogQuery = useQuery({ queryKey: ['imports', 'catalog'], queryFn: loadImportCatalog, staleTime: 0, gcTime: 15 * 60_000, refetchOnMount: 'always' })
  const productsCatalogQuery = useQuery({ queryKey: ['products', 'catalog'], queryFn: loadCatalog, staleTime: 0, gcTime: 15 * 60_000, refetchOnMount: 'always' })
  const [modal, setModal] = useState<'form' | 'detail' | null>(null)
  const [editing, setEditing] = useState<ImportRecord>()
  const detailQuery = useQuery({ queryKey: ['imports', 'detail', editing?.id], queryFn: () => getImport(editing!.id), enabled: modal === 'detail' && Boolean(editing) })
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }
  const refreshImportConsumers = () => {
    void queryClient.invalidateQueries({ queryKey: ['imports'], exact: true, refetchType: 'active' })
    void queryClient.invalidateQueries({ queryKey: ['products', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['purchases', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['imports', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
  }
  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ImportPayload }) => id ? updateImport(id, payload) : createImport(payload),
    onSuccess: (saved, variables) => {
      queryClient.setQueryData<ImportRecord[]>(['imports'], current => {
        const records = current ?? []
        return variables.id ? records.map(record => record.id === saved.id ? saved : record) : [saved, ...records.filter(record => record.id !== saved.id)]
      })
      refreshImportConsumers()
      notify(variables.id ? 'Importación actualizada y tabla sincronizada' : 'Importación registrada y catálogo sincronizado')
    },
    onError: error => notify(error instanceof Error ? error.message : 'No se pudo registrar la importación'),
  })
  const deleteMutation = useMutation({ mutationFn: deleteImport, onSuccess: (_, id) => { queryClient.setQueryData<ImportRecord[]>(['imports'], current => current?.filter(record => record.id !== id) ?? []); notify('Importación eliminada') }, onError: error => notify(error instanceof Error ? error.message : 'No se puede eliminar esta importación') })
  const records = importsQuery.data ?? []

  return { queryClient, importsQuery, catalogQuery, productsCatalogQuery, modal, setModal, editing, setEditing, detailQuery, notice, setNotice, notify, refreshImportConsumers, saveMutation, deleteMutation, records }
}
