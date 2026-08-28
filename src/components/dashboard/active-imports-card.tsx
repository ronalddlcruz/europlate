import { Ship } from 'lucide-react'
import { DashboardPanel } from './dashboard-components'

export function ActiveImportsCard({ number, supplier, status }: { number: string; supplier: string; status: string }) {
  return <DashboardPanel title="Importaciones activas" icon={Ship} titleClassName="text-brand">
    <div className="flex min-w-0 items-center justify-between gap-3 pt-3 sm:pt-5"><div className="min-w-0"><p className="font-mono text-sm font-medium">{number}</p><p className="mt-1 truncate text-xs text-muted">{supplier}</p></div><span className="shrink-0 whitespace-nowrap rounded-full bg-blue-100 px-3 py-2 text-xs font-semibold text-brand">{status}</span></div>
  </DashboardPanel>
}
