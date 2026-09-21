import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ActiveImportsCard } from '../components/active-imports-card'
import { DashboardHeader } from '../components/dashboard-header'
import { DashboardMetrics } from '../components/dashboard-metrics'
import { MonthlyPurchasesCard } from '../components/monthly-purchases-card'
import { RotationSection } from '../components/rotation-section'
import { loadDashboardSummary } from '../services/dashboard-api.service'

export function DashboardPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const summary = useQuery({ queryKey: ['dashboard', 'summary', period], queryFn: () => loadDashboardSummary(period), staleTime: 0 })
  if (summary.isLoading) return <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted shadow-card">Cargando indicadores desde la base de datos…</div>
  if (summary.isError || !summary.data) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">No se pudo cargar el Dashboard. Inténtalo nuevamente.</div>
  const data = summary.data
  const periodLabel = data.periods.find(item => item.value === data.period)?.label ?? data.period
  const maximum = Math.max(...data.purchasesByMonth.map(item => item.value), 1)
  const chart = data.purchasesByMonth.map(item => item.value ? Math.max(12, item.value / maximum * 100) : 4)
  const rotation = data.rotation.map(item => ({ ...item, sales: `${item.movements} mov.` }))
  return <div className="space-y-4 sm:space-y-5"><DashboardHeader months={data.periods} period={data.period} onPeriodChange={setPeriod} /><DashboardMetrics periodLabel={periodLabel} purchasesPen={data.metrics.purchasesPen} activeProducts={data.metrics.activeProducts} imports={data.metrics.imports} totalStock={data.metrics.totalStock} chart={chart} /><RotationSection products={rotation} periodLabel={periodLabel} /><section className="grid gap-4 lg:grid-cols-2"><MonthlyPurchasesCard data={data.purchasesByMonth} action={periodLabel} /><ActiveImportsCard imports={data.activeImports} /></section></div>
}
