import { DashboardPanel } from '../../../components/dashboard/dashboard-components'
import type { MonthlyPurchase } from './dashboard-data'

export function MonthlyPurchasesCard({ data }: { data: MonthlyPurchase[] }) {
  return <DashboardPanel title="Compras por mes" action="2026"><div className="flex h-24 items-end gap-2 border-b border-border pt-2">{data.map(month => <div className="group flex h-full flex-1 items-end" key={month.label}><div title={`${month.label}: ${month.value}`} className="w-full rounded-t bg-gradient-to-t from-brand to-blue-300 transition-opacity group-hover:opacity-75" style={{ height: `${Math.max(12, month.value)}%` }} /></div>)}</div><div className="mt-2 grid grid-cols-8 gap-2 text-center text-[10px] text-muted">{data.map(month => <span key={month.label}>{month.label}</span>)}</div></DashboardPanel>
}
