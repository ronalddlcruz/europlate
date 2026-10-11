import { Plus } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { WarehousesTable } from '../components/tables/WarehousesTable'
import { WarehouseDialog } from '../components/warehouse-dialogs/WarehouseDialog'
import { useWarehousesController } from '../hooks/useWarehousesController'

export function WarehousesPage() {
  const model = useWarehousesController()
  const { client, session, canManage, warehouses, responsibles, editing, setEditing, modal, setModal, notice, setNotice, notify, sync, save, remove } = model
  return <div className="mx-auto max-w-7xl">
    <section className="card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-sm font-semibold">Almacenes</h1>
          <p className="mt-1 text-xs text-muted">Ubicación física y responsable de cada almacén.</p></div>
        {canManage && <Button size="sm" onClick={() => { setEditing(undefined); setModal(true) }}><Plus className="h-4 w-4" />Nuevo almacén</Button>}
      </header>
      <div className="mt-4 overflow-x-auto"><WarehousesTable model={model} /></div>
    </section>
    {modal && <WarehouseDialog item={editing} responsibles={responsibles.data ?? []} loadingResponsibles={responsibles.isLoading} saving={save.isPending}
      onClose={() => setModal(false)} onSave={payload => save.mutate({ id: editing?.id, payload })} />}
    {notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}
  </div>
}
