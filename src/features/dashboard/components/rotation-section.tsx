import { TrendingUp } from 'lucide-react'
import { DashboardPanel } from '@/components/dashboard/dashboard-components'
import type { RotationProduct } from '@/features/dashboard/components/dashboard-data'

const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })

function RotationProductRow({
  product,
  rank,
  maxUnits,
}: {
  product: RotationProduct
  rank: number
  maxUnits: number
}) {
  const relativeWidth = `${(product.units / maxUnits) * 100}%`

  return (
    <li className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,14rem)_auto] sm:gap-x-4 sm:py-4">
      <span className="row-span-2 self-start font-mono text-sm font-bold tabular-nums text-brand sm:row-span-1 sm:self-center">
        #{rank}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-ink sm:text-sm" title={product.name}>
          {product.name}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-muted" title={product.code}>
          {product.code}
        </p>
      </div>
      <div className="col-start-2 min-w-0 sm:col-start-3 sm:row-start-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <div className="h-full rounded-full bg-brand" style={{ width: relativeWidth }} />
        </div>
        <p className="mt-1 truncate text-[10px] text-muted">
          {number.format(product.outboundUnits)} salidas · {number.format(product.consumedUnits)}{' '}
          consumo
        </p>
      </div>
      <div className="col-start-3 row-span-2 row-start-1 text-right sm:col-start-4 sm:row-span-1">
        <strong className="block whitespace-nowrap font-mono text-sm font-bold tabular-nums text-brand">
          {number.format(product.units)} und.
        </strong>
        <span className="mt-0.5 block whitespace-nowrap text-[10px] text-muted">
          {product.movements} {product.movements === 1 ? 'mov.' : 'movs.'}
        </span>
      </div>
    </li>
  )
}

export function RotationSection({
  products,
  periodLabel,
}: {
  products: RotationProduct[]
  periodLabel: string
}) {
  const maxUnits = Math.max(...products.map((product) => product.units), 1)
  return (
    <DashboardPanel title="Productos con mayor rotación" icon={TrendingUp} action={periodLabel}>
      <p className="mb-3 text-xs text-muted">
        Top 5 por unidades físicas salidas o consumidas. Se excluyen carga inicial, ingresos, mermas
        y transferencias.
      </p>
      {products.length ? (
        <ol className="divide-y divide-slate-200">
          {products.map((product, index) => (
            <RotationProductRow
              key={product.productId}
              product={product}
              rank={index + 1}
              maxUnits={maxUnits}
            />
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No hubo salidas ni consumo de producción en este mes.
        </p>
      )}
    </DashboardPanel>
  )
}
