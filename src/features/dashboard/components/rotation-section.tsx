import { TrendingUp } from 'lucide-react'
import { DashboardPanel } from '../../../components/dashboard/dashboard-components'
import type { RotationProduct } from './dashboard-data'

const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })

export function RotationSection({ products, periodLabel }: { products: RotationProduct[]; periodLabel: string }) {
  const maxUnits = Math.max(...products.map(product => product.units), 1)
  return <DashboardPanel title="Productos con mayor rotación" icon={TrendingUp} action={periodLabel}>
    <p className="mb-3 text-xs text-muted">Top 5 por unidades físicas salidas o consumidas. Se excluyen carga inicial, ingresos, mermas y transferencias.</p>
    {products.length ? <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{products.map((product, index) =>
      <li key={product.productId} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-brand">#{index + 1}</span><span className="max-w-[70%] truncate font-mono text-[10px] text-muted" title={product.code}>{product.code}</span></div>
        <p className="mt-2 min-h-[2.5rem] overflow-hidden text-[13px] font-semibold leading-5 text-ink" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }} title={product.name}>{product.name}</p>
        <div className="mt-auto pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><div className="h-full rounded-full bg-brand" style={{ width: `${product.units / maxUnits * 100}%` }} /></div>
          <div className="mt-2 flex items-baseline justify-between gap-2"><strong className="font-mono text-sm tabular-nums text-brand">{number.format(product.units)} und.</strong><span className="whitespace-nowrap text-[10px] text-muted">{product.movements} {product.movements === 1 ? 'mov.' : 'movs.'}</span></div>
          <p className="mt-1 text-[11px] text-muted">{number.format(product.outboundUnits)} salidas · {number.format(product.consumedUnits)} consumo</p>
        </div>
      </li>)}</ol> : <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No hubo salidas ni consumo de producción en este mes.</p>}
  </DashboardPanel>
}
