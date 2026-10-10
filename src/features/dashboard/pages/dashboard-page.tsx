import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardHeader } from '../components/dashboard-header'
import { DashboardMetrics } from '../components/dashboard-metrics'
import { MonthlyImportsCard, MonthlyPurchasesCard } from '../components/monthly-purchases-card'
import { RotationSection } from '../components/rotation-section'
import { loadDashboardSummary } from '../services/dashboard-api.service'

export function DashboardPage() {
  const [period, setPeriod] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit' }).format(new Date()))
  const summary = useQuery({ queryKey: ['dashboard', 'summary', period], queryFn: () => loadDashboardSummary(period), staleTime: 0 })
  if (summary.isLoading) return <div className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted shadow-card">Cargando indicadores desde la base de datos…</div>
  if (summary.isError || !summary.data) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">No se pudo cargar el Dashboard. Inténtalo nuevamente.</div>
  const data = summary.data
  const periodLabel = data.periods.find(item => item.value === data.period)?.label ?? data.period
  const maximum = Math.max(...data.purchasesByMonth.map(item => item.totalPen), 1)
  const chart = data.purchasesByMonth.map(item => item.totalPen ? Math.max(12, item.totalPen / maximum * 100) : 4)
  return <div className="space-y-3 sm:space-y-4"><DashboardHeader months={data.periods} period={data.period} onPeriodChange={setPeriod} /><DashboardMetrics periodLabel={periodLabel} purchasesPen={data.metrics.purchasesPen} nationalPurchaseCount={data.metrics.nationalPurchaseCount} purchasesUnconvertedUsd={data.metrics.purchasesUnconvertedUsd ?? 0} purchasesUsdRate={data.metrics.purchasesUsdRate ?? null} activeProducts={data.metrics.activeProducts} imports={data.metrics.imports} totalStock={data.metrics.totalStock} chart={chart} /><RotationSection products={data.rotation} periodLabel={periodLabel} /><section className="grid gap-3 lg:grid-cols-2 sm:gap-4"><MonthlyPurchasesCard data={data.purchasesByMonth} /><MonthlyImportsCard data={data.purchasesByMonth} /></section></div>
}
