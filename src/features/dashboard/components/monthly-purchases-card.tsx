import { useState } from 'react'
import type { MonthlyPurchase } from './dashboard-data'

const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compactMoney = new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 })

type ActivityKind = 'national' | 'imports'

function MonthlyActivityCard({ data, kind }: { data: MonthlyPurchase[]; kind: ActivityKind }) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const isNational = kind === 'national'
  const title = isNational ? 'Compras nacionales por mes' : 'Importaciones por mes'
  const documentName = (value: number) => isNational
    ? value === 1 ? 'compra' : 'compras'
    : value === 1 ? 'importación' : 'importaciones'
  const amount = (month: MonthlyPurchase) => isNational ? month.nationalPen : month.importsPen
  const count = (month: MonthlyPurchase) => isNational ? month.nationalCount : month.importCount
  const unconverted = (month: MonthlyPurchase) => isNational ? month.nationalUnconvertedUsd : month.importsUnconvertedUsd
  const selected = data.find(month => month.period === selectedPeriod) ?? data[data.length - 1]
  const largest = Math.max(0, ...data.map(amount))
  const maximum = Math.max(1, largest)
  const theme = isNational
    ? { text: 'text-brand', bar: 'bg-brand', selected: 'border-blue-200 bg-blue-50/70' }
    : { text: 'text-amber-600', bar: 'bg-amber-500', selected: 'border-amber-200 bg-amber-50/70' }

  return <article className="min-w-0 rounded-[10px] border border-border bg-white p-4 shadow-card sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-[14px] font-semibold text-ink sm:text-[15px]">{title}</h3>
      <select
        aria-label={`Mes de ${title.toLowerCase()}`}
        value={selected?.period ?? ''}
        onChange={event => setSelectedPeriod(event.target.value)}
        className="h-8 max-w-full rounded-md border border-border bg-slate-50 px-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >{data.map(month => <option key={month.period} value={month.period}>{month.label}</option>)}</select>
    </header>
    {selected ? <>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong className={`font-mono text-xl font-bold tabular-nums ${theme.text}`}>S/ {money.format(amount(selected))}</strong>
        <span className="text-xs text-muted">{count(selected)} {documentName(count(selected))} en {selected.label}</span>
      </div>
      {unconverted(selected) > 0 && <p className="mt-1 text-[11px] text-amber-700">Además, USD {money.format(unconverted(selected))} sin convertir por falta de tipo de cambio.</p>}
      <div className="relative mt-4 overflow-x-auto" role="group" aria-label={`Importes mensuales de ${title.toLowerCase()}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[124px] border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_49%,#e8edf5_50%,transparent_51%)]" aria-hidden="true" />
        <div className="relative grid min-w-[360px] grid-cols-8 gap-1 sm:min-w-0 sm:gap-2">
          {data.map(month => {
            const value = amount(month)
            const active = month.period === selected.period
            return <button
              key={month.period}
              type="button"
              aria-pressed={active}
              aria-label={`${month.label}: S/ ${money.format(value)}, ${count(month)} ${documentName(count(month))}`}
              title={`${month.label} · S/ ${money.format(value)} · ${count(month)} ${documentName(count(month))}`}
              onClick={() => setSelectedPeriod(month.period)}
              className={`group flex min-w-0 flex-col items-center rounded-md border px-1 pb-1 pt-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${active ? theme.selected : 'border-transparent hover:bg-slate-50'}`}
            >
              <span className="flex h-[116px] w-full items-end justify-center"><span className={`w-full max-w-9 rounded-t-sm transition-opacity ${value > 0 ? theme.bar : 'bg-slate-200'} ${active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'}`} style={{ height: value > 0 ? `${Math.max(8, value / maximum * 100)}%` : '3px' }} /></span>
              <span className={`mt-2 truncate text-[10px] sm:text-[11px] ${active ? `font-semibold ${theme.text}` : 'text-muted'}`}>{month.label.split(' ')[0]}</span>
            </button>
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted"><span>0</span><span>Máx. S/ {compactMoney.format(largest)}</span></div>
      <p className="mt-2 text-[11px] text-muted">Selecciona una barra o usa el mes para ver su importe exacto.</p>
    </> : <p className="py-8 text-center text-sm text-muted">No hay meses disponibles.</p>}
  </article>
}

export function MonthlyPurchasesCard({ data }: { data: MonthlyPurchase[] }) {
  return <MonthlyActivityCard data={data} kind="national" />
}

export function MonthlyImportsCard({ data }: { data: MonthlyPurchase[] }) {
  return <MonthlyActivityCard data={data} kind="imports" />
}
