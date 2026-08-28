import { AlertTriangle } from 'lucide-react'
import { DashboardPanel } from './dashboard-components'

export type StockAlert = readonly [product: string, stock: string, minimum: string]

export function StockAlertsCard({ alerts }: { alerts: readonly StockAlert[] }) {
  return <DashboardPanel title="Alertas de stock mínimo" icon={AlertTriangle} titleClassName="text-amber-600">
    <div className="mb-2 flex items-center justify-between rounded-md bg-amber-50 px-2.5 py-1.5 text-[10px] text-amber-700"><span>Requieren reposición</span><strong className="rounded-full bg-amber-100 px-2 py-0.5 font-mono">{alerts.length}</strong></div>
    <div className="max-h-[178px] divide-y divide-border overflow-y-auto pr-1 sm:max-h-none">
      {alerts.map(([product, stock, minimum], index) => { const level = Math.min(100, Math.round((Number(stock) / Math.max(1, Number(minimum))) * 100)); return <div className="group min-w-0 py-1.5 text-[11px] sm:py-2.5 sm:text-[13px]" key={`${product}-${index}`}>
        <div className="flex min-w-0 items-center justify-between gap-2"><span title={product} className="flex min-w-0 flex-1 items-center gap-1.5 truncate"><i className="h-2 w-2 shrink-0 rounded-full bg-red-500 ring-2 ring-red-100" />{product}</span><span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-red-600 sm:text-xs">{stock} / {minimum}</span></div>
        <div className="ml-3.5 mt-1 h-1 overflow-hidden rounded-full bg-red-50"><div className="h-full rounded-full bg-red-400 transition-all group-hover:bg-red-500" style={{ width: `${level}%` }} /></div>
      </div> })}
    </div>
  </DashboardPanel>
}
