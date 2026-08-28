import { AlertTriangle } from 'lucide-react'
import { DashboardPanel } from './dashboard-components'

export type StockAlert = readonly [product: string, stock: string, minimum: string]

export function StockAlertsCard({ alerts }: { alerts: readonly StockAlert[] }) {
  return <DashboardPanel title="Alertas de stock mínimo" icon={AlertTriangle} titleClassName="text-amber-600">
    <div className="max-h-[178px] divide-y divide-border overflow-y-auto pr-1 sm:max-h-none">
      {alerts.map(([product, stock, minimum], index) => <div className="flex min-w-0 items-center justify-between gap-2 py-1.5 text-[11px] sm:gap-4 sm:py-2.5 sm:text-[13px]" key={`${product}-${index}`}>
        <span title={product} className="flex min-w-0 flex-1 items-center gap-1.5 truncate"><i className="h-2 w-2 shrink-0 rounded-full bg-red-500" />{product}</span>
        <span className="shrink-0 whitespace-nowrap text-[10px] text-red-600 sm:text-xs">Stock: {stock} / Mín: {minimum}</span>
      </div>)}
    </div>
  </DashboardPanel>
}
