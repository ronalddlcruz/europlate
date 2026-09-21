import { DashboardPanel } from '../../../components/dashboard/dashboard-components'
import type { MonthlyPurchase } from './dashboard-data'

export function MonthlyPurchasesCard({ data, action }: { data: MonthlyPurchase[]; action: string }) {
  const maximum = Math.max(...data.map(month => month.value), 1)
  const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <DashboardPanel title="Compras nacionales por mes" action={action}><div className="flex h-24 items-end gap-2 border-b border-border pt-2">{data.map(month => <div className="group flex h-full flex-1 items-end" key={month.label}><div title={`${month.label}: S/ ${money.format(month.value)}`} className="w-full rounded-t bg-gradient-to-t from-brand to-blue-300 transition-opacity group-hover:opacity-75" style={{ height: `${month.value ? Math.max(12, month.value / maximum * 100) : 4}%` }} /></div>)}</div><div className="mt-2 grid grid-cols-8 gap-2 text-center text-[10px] text-muted">{data.map((month, index) => <span key={`${month.label}-${index}`}>{month.label}</span>)}</div></DashboardPanel>
}
