import { AlertTriangle, Ship } from 'lucide-react'
import { DashboardMetric, DashboardPanel } from '../../../components/dashboard/dashboard-components'

const purchasesByMonth = [
  { label: 'Ene', value: 4 }, { label: 'Feb', value: 4 }, { label: 'Mar', value: 78 }, { label: 'Abr', value: 4 },
  { label: 'May', value: 4 }, { label: 'Jun', value: 4 }, { label: 'Jul', value: 4 }, { label: 'Ago', value: 4 },
]
const lowStock = [
  ['Papel couché 150cm 90g', '45', '50'], ['Placa offset', '162', '200'], ['Tinta offset negro 1kg', '12', '20'],
  ['Cinta de embalaje', '1', '10'], ['Placa offset', '10', '200'], ['Papel adhesivo P3 de 100cm x 70cm, paquete x 100 hojas', '0', '10'],
  ['Papel adhesivo P3 de 100cm x 70cm', '2', '10'],
]
const topProducts = [['Papel couché 150cm 90g', 'S/ 320.00'], ['Cinta de embalaje', 'S/ 10.00']]

export function DashboardPage() {
  return <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="divide-y divide-border">{topProducts.map(([product, total], index) => <div className="flex items-center justify-between gap-3 py-3 text-sm" key={product}><span className="text-slate-600"><span className="mr-1 text-muted">#{index + 1}</span>{product}</span><strong className="shrink-0 font-mono text-xs font-medium text-emerald-600">{total}</strong></div>)}</div>
      </DashboardPanel>
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <DashboardPanel title="Alertas de stock mínimo" icon={AlertTriangle} titleClassName="text-amber-600">
        <div className="divide-y divide-border">{lowStock.map(([product, stock, minimum], index) => <div className="flex items-center justify-between gap-4 py-2.5 text-[13px]" key={`${product}-${index}`}><span className="flex min-w-0 items-center gap-1.5 truncate"><i className="h-2 w-2 shrink-0 rounded-full bg-red-500" />{product}</span><span className="shrink-0 text-xs text-red-600">Stock: {stock} / Mín: {minimum}</span></div>)}</div>
      </DashboardPanel>
      <DashboardPanel title="Importaciones activas" icon={Ship} titleClassName="text-brand">
        <div className="flex items-center justify-between gap-4 pt-5"><div><p className="font-mono text-sm font-medium">IMP-2026-001</p><p className="mt-1 text-xs text-muted">Shenzhen Paper Co. Ltd.</p></div><span className="rounded-full bg-blue-100 px-3 py-2 text-xs font-semibold text-brand">En tránsito</span></div>
      </DashboardPanel>
    </section>
  </div>
}
