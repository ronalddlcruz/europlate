import { Plus,Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SupplierDialog } from '@/features/suppliers/components/dialogs/SupplierDialog'
import { SuppliersTable } from '@/features/suppliers/components/tables/SuppliersTable'
import { useSuppliersController } from '@/features/suppliers/hooks/useSuppliersController'

export function SuppliersPage() {
  const model = useSuppliersController()
  const { modalItem, setModalItem, search, setSearch, notice, saveMutation } = model
  return <div className="mx-auto max-w-none"><section className="rounded-[10px] border border-border bg-white p-6 shadow-card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Proveedores</h1><p className="mt-1 text-xs text-muted">Empresas y contactos registrados para compras nacionales e importaciones.</p></div><Button size="sm" onClick={() => setModalItem(null)}><Plus className="h-4 w-4" />Nuevo Proveedor</Button></header><div className="relative mt-5 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><Input className="h-9 pl-9" placeholder="Buscar proveedor o RUC…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="mt-4 overflow-x-auto"><SuppliersTable model={model} /></div></section>{modalItem !== undefined && <SupplierDialog item={modalItem ?? undefined} onClose={() => setModalItem(undefined)} onSave={async item => { await saveMutation.mutateAsync({ item, editing: modalItem ?? undefined }) }} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}
