import { DashboardMetric, DashboardPanel } from '../../../components/dashboard/dashboard-components'
import { ActiveImportsCard } from '../../../components/dashboard/active-imports-card'
import { StockAlertsCard, type StockAlert } from '../../../components/dashboard/stock-alerts-card'

const purchasesByMonth = [
  { label: 'Ene', value: 4 }, { label: 'Feb', value: 4 }, { label: 'Mar', value: 78 }, { label: 'Abr', value: 4 },
  { label: 'May', value: 4 }, { label: 'Jun', value: 4 }, { label: 'Jul', value: 4 }, { label: 'Ago', value: 4 },
]
const lowStock: readonly StockAlert[] = [
  ['Papel couché 150cm 90g', '45', '50'], ['Placa offset', '162', '200'], ['Tinta offset negro 1kg', '12', '20'],
  ['Cinta de embalaje', '1', '10'], ['Placa offset', '10', '200'], ['Papel adhesivo P3 de 100cm x 70cm, paquete x 100 hojas', '0', '10'],
  ['Papel adhesivo P3 de 100cm x 70cm', '2', '10'],
]
const topProducts = [['Papel couché 150cm 90g', 'S/ 320.00'], ['Cinta de embalaje', 'S/ 10.00']]

export function DashboardPage() {
  return <div className="space-y-4 sm:space-y-6">
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <DashboardMetric label="Compras del mes" value="S/ 0.00" detail="Agosto" tone="emerald" />
      <DashboardMetric label="Productos en catálogo" value="13" detail="Activos" tone="blue" />
      <DashboardMetric label="Alertas de stock" value="8" detail="Productos bajo mínimo" tone="red" />
      <DashboardMetric label="Importaciones" value="4" detail="Total registradas" tone="amber" />
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Compras por mes" action="2026">
        <div className="flex h-36 items-end gap-2 border-b border-border pt-3">{purchasesByMonth.map((month) => <div className="flex h-full flex-1 items-end" key={month.label}><div className="w-full rounded-t bg-[#7699e9]" style={{ height: `${month.value}%` }} /></div>)}</div>
        <div className="mt-2 grid grid-cols-8 gap-2 text-center text-[10px] text-muted">{purchasesByMonth.map((month) => <span key={month.label}>{month.label}</span>)}</div>
      </DashboardPanel>
      <DashboardPanel title="Top 5 productos más comprados">
        <div className="divide-y divide-border">{topProducts.map(([product, total], index) => <div className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm" key={product}><span className="min-w-0 truncate text-slate-600"><span className="mr-1 text-muted">#{index + 1}</span>{product}</span><strong className="shrink-0 whitespace-nowrap font-mono text-xs font-medium text-emerald-600">{total}</strong></div>)}</div>
      </DashboardPanel>
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <StockAlertsCard alerts={lowStock} />
      <ActiveImportsCard number="IMP-2026-001" supplier="Shenzhen Paper Co. Ltd." status="En tránsito" />
    </section>
  </div>
}
