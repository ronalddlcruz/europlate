import { Plus,Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomerDialog } from '@/features/customers/components/dialogs/CustomerDialog'
import { CustomersTable } from '@/features/customers/components/tables/CustomersTable'
import { useCustomersController } from '@/features/customers/hooks/useCustomersController'

export function CustomersPage() {
  const model = useCustomersController()
  const { queryClient, customersQuery, customers, query, setQuery, modalItem, setModalItem, notice, setNotice, notify, syncCustomerPickers, saveMutation, removeMutation, visible } = model
  return <div className="mx-auto max-w-none"><section className="rounded-[10px] border border-border bg-white p-6 shadow-card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Clientes</h1><p className="mt-1 text-xs text-muted">Cartera de clientes, contactos e información comercial.</p></div><Button size="sm" onClick={() => setModalItem(null)}><Plus className="h-4 w-4" />Nuevo Cliente</Button></header><div className="relative mt-5 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><Input value={query} onChange={event => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Buscar cliente, RUC, celular o correo…" /></div><div className="mt-4 overflow-x-auto"><CustomersTable model={model} /></div></section>{modalItem !== undefined && <CustomerDialog item={modalItem ?? undefined} onClose={() => setModalItem(undefined)} onSave={async item => { await saveMutation.mutateAsync({ item, editing: modalItem ?? undefined }).catch(() => undefined) }} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}
