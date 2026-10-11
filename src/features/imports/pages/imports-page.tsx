import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportDetail } from '@/features/imports/components/dialogs/ImportDetail'
import { ImportDialog } from '@/features/imports/components/import-dialog'
import { ImportsTable } from '@/features/imports/components/tables/ImportsTable'
import { useImportsController } from '@/features/imports/hooks/useImportsController'

export function ImportsPage() {
  const model = useImportsController()
  const { catalogQuery, productsCatalogQuery, modal, setModal, editing, setEditing, detailQuery, notice, saveMutation } = model
  return <div className="mx-auto max-w-7xl"><section className="card"><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-sm font-semibold">Importaciones</h1><Button size="sm" disabled={catalogQuery.isLoading || catalogQuery.isError || productsCatalogQuery.isLoading || productsCatalogQuery.isError} onClick={() => { setEditing(undefined); setModal('form') }}><Plus className="h-4 w-4" />Nueva Importación</Button></header><div className="mt-5 overflow-x-auto"><ImportsTable model={model} /></div></section>{modal === 'form' && catalogQuery.data && productsCatalogQuery.data && <ImportDialog catalog={catalogQuery.data} productsCatalog={productsCatalogQuery.data} item={editing} saving={saveMutation.isPending} onClose={() => setModal(null)} onSave={async payload => { try { await saveMutation.mutateAsync({ id: editing?.id, payload }); setModal(null) } catch { /* El error ya se muestra en la notificación. */ } }} />}{modal === 'detail' && editing && <ImportDetail record={detailQuery.data ?? editing} onClose={() => setModal(null)} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}
