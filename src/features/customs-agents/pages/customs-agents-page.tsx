import { Plus,Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgentDialog } from '@/features/customs-agents/components/dialogs/AgentDialog'
import { Toast } from '@/features/customs-agents/components/shared'
import { CustomsAgentsTable } from '@/features/customs-agents/components/tables/CustomsAgentsTable'
import { useCustomsAgentsController } from '@/features/customs-agents/hooks/useCustomsAgentsController'

export function CustomsAgentsPage() {
  const model = useCustomsAgentsController()
  const { modalItem, setModalItem, search, setSearch, notice, saveMutation } = model
  return <div className="mx-auto max-w-none"><section className="rounded-[10px] border border-border bg-white p-6 shadow-card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Agentes de Aduana</h1><p className="mt-1 text-xs text-muted">Agentes y contactos disponibles para operaciones de importación.</p></div><Button size="sm" onClick={() => setModalItem(null)}><Plus className="h-4 w-4" />Nuevo Agente</Button></header><div className="relative mt-5 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><Input className="h-9 pl-9" placeholder="Buscar agente o RUC…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="mt-4 overflow-x-auto"><CustomsAgentsTable model={model} /></div></section>{modalItem !== undefined && <AgentDialog item={modalItem ?? undefined} onClose={() => setModalItem(undefined)} onSave={async item => { await saveMutation.mutateAsync({ item, editing: modalItem ?? undefined }).catch(() => undefined) }} />}{notice && <Toast>{notice}</Toast>}</div>
}
