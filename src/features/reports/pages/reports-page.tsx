import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MovementsReport } from '@/features/reports/components/sections/MovementsReport'
import { ProductionReport } from '@/features/reports/components/sections/ProductionReport'
import { PurchasesReport } from '@/features/reports/components/sections/PurchasesReport'
import { StockReport } from '@/features/reports/components/sections/StockReport'
import { cards } from '@/features/reports/components/shared'
import { useReportsController } from '@/features/reports/hooks/useReportsController'

export function ReportsPage() {
  const { report, setReport, stock, movements, purchases, production, activeQuery } = useReportsController()
  return <div className="mx-auto w-full max-w-[1540px]">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(card => { const Icon = card.icon; return <button key={card.id} onClick={() => setReport(card.id)} className={`rounded-[10px] border bg-white p-5 text-left shadow-card transition hover:shadow-panel ${report === card.id ? 'border-brand ring-1 ring-brand' : 'border-border'}`}><span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.colors}`}><Icon className="h-5 w-5" /></span><strong className="block text-sm">{card.title}</strong><span className="mt-1 block text-xs text-muted">{card.description}</span></button> })}</section>
    <section className="mt-5 rounded-[10px] border border-border bg-white p-5 shadow-card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{cards.find(card => card.id === report)?.title}</h2><p className="mt-1 text-xs text-muted">Información consultada desde los registros actuales de la base de datos.</p></div><Button size="sm" variant="outline" disabled={activeQuery.isFetching} onClick={() => void activeQuery.refetch()}><RefreshCw className={`h-4 w-4 ${activeQuery.isFetching ? 'animate-spin' : ''}`} />Actualizar</Button></header>{activeQuery.isLoading ? <div className="p-12 text-center text-sm text-muted">Cargando reporte desde la base de datos…</div> : activeQuery.isError ? <div className="p-12 text-center text-sm text-red-600">No se pudo cargar el reporte. Inténtalo nuevamente.</div> : report === 'stock' && stock.data ? <StockReport rows={stock.data} /> : report === 'movements' && movements.data ? <MovementsReport rows={movements.data} warehouses={[...new Set(movements.data.map(row => row.warehouse))].sort()} /> : report === 'purchases' && purchases.data ? <PurchasesReport rows={[...purchases.data.purchases, ...purchases.data.imports]} /> : report === 'production' && production.data ? <ProductionReport rows={production.data} /> : null}</section>
  </div>
}
