import { CalendarDays, PackageCheck, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
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
const rotationByPeriod: Record<string, { name: string; code: string; unit: string; units: number; sales: string }[]> = {
  '2026-08': [{ name: 'Papel couché 150 cm 90 g', code: 'PROD-014', unit: 'RESMA', units: 320, sales: 'S/ 18,240.00' }, { name: 'Cinta de embalaje', code: 'PROD-022', unit: 'ROLLO', units: 248, sales: 'S/ 2,480.00' }, { name: 'Placa offset', code: 'PROD-011', unit: 'UND', units: 186, sales: 'S/ 13,020.00' }, { name: 'Tinta offset negro 1 kg', code: 'PROD-006', unit: 'KG', units: 96, sales: 'S/ 5,760.00' }, { name: 'Cartón corrugado microcanal', code: 'PROD-019', unit: 'PLIEGO', units: 75, sales: 'S/ 6,375.00' }],
  '2026-07': [{ name: 'Placa offset', code: 'PROD-011', unit: 'UND', units: 224, sales: 'S/ 15,680.00' }, { name: 'Papel couché 150 cm 90 g', code: 'PROD-014', unit: 'RESMA', units: 198, sales: 'S/ 11,286.00' }, { name: 'Cartón corrugado microcanal', code: 'PROD-019', unit: 'PLIEGO', units: 142, sales: 'S/ 12,070.00' }, { name: 'Cinta de embalaje', code: 'PROD-022', unit: 'ROLLO', units: 88, sales: 'S/ 880.00' }],
}
const months = [{ value: '2026-08', label: 'Agosto 2026' }, { value: '2026-07', label: 'Julio 2026' }]

export function DashboardPage() {
  const [period, setPeriod] = useState('2026-08'); const rotation = useMemo(() => rotationByPeriod[period] ?? [], [period]); const maxUnits = rotation[0]?.units ?? 1
  return <div className="space-y-4 sm:space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-white p-4 shadow-sm"><div><h1 className="text-sm font-semibold">Resumen comercial</h1><p className="mt-1 text-xs text-muted">Consulta el comportamiento de productos y operaciones por periodo.</p></div><label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600"><CalendarDays className="h-3.5 w-3.5" />Mes y año</span><select value={period} onChange={event => setPeriod(event.target.value)} className="h-10 min-w-[170px] rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand">{months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label></section>
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <DashboardMetric label="Compras del mes" value="S/ 0.00" detail={months.find(month => month.value === period)?.label ?? ''} tone="emerald" />
      <DashboardMetric label="Productos en catálogo" value="13" detail="Activos" tone="blue" />
      <DashboardMetric label="Alertas de stock" value="8" detail="Productos bajo mínimo" tone="red" />
      <DashboardMetric label="Importaciones" value="4" detail="Total registradas" tone="amber" />
    </section>
    <DashboardPanel title="Productos con mayor rotación" icon={TrendingUp} action={months.find(month => month.value === period)?.label}><div className="mb-4 flex items-center justify-between rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs text-slate-600"><span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-brand" />Ranking según unidades vendidas durante el periodo seleccionado.</span><strong className="font-mono text-brand">{rotation.reduce((sum, product) => sum + product.units, 0)} unidades</strong></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-border text-[11px] uppercase tracking-[.4px] text-muted">{['#', 'Producto', 'Unidad', 'Unidades vendidas', 'Rotación', 'Ventas'].map(header => <th className="px-3 py-2.5 font-semibold" key={header}>{header}</th>)}</tr></thead><tbody>{rotation.map((product, index) => <tr className="border-b border-border last:border-0 text-sm" key={product.code}><td className="px-3 py-3 font-mono font-bold text-brand">0{index + 1}</td><td className="px-3 py-3"><p className="font-medium text-ink">{product.name}</p><p className="mt-0.5 font-mono text-[11px] text-muted">{product.code}</p></td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{product.unit}</span></td><td className="px-3 py-3 font-mono font-semibold text-ink">{product.units}</td><td className="min-w-[170px] px-3 py-3"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: (product.units / maxUnits * 100) + '%' }} /></div><span className="mt-1 block text-[10px] text-muted">{Math.round(product.units / maxUnits * 100)}% del líder</span></td><td className="px-3 py-3 font-mono text-xs font-medium text-emerald-600">{product.sales}</td></tr>)}</tbody></table></div></DashboardPanel>
    <section className="grid gap-6 lg:grid-cols-2"><DashboardPanel title="Compras por mes" action="2026"><div className="flex h-36 items-end gap-2 border-b border-border pt-3">{purchasesByMonth.map(month => <div className="flex h-full flex-1 items-end" key={month.label}><div className="w-full rounded-t bg-[#7699e9]" style={{ height: month.value + '%' }} /></div>)}</div><div className="mt-2 grid grid-cols-8 gap-2 text-center text-[10px] text-muted">{purchasesByMonth.map(month => <span key={month.label}>{month.label}</span>)}</div></DashboardPanel><StockAlertsCard alerts={lowStock} /></section>
    <ActiveImportsCard number="IMP-2026-001" supplier="Shenzhen Paper Co. Ltd." status="En tránsito" />
  </div>
}
