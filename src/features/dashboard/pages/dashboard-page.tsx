import { useMemo, useState } from 'react'
import { ActiveImportsCard } from '../components/active-imports-card'
import { DashboardHeader } from '../components/dashboard-header'
import { months, purchasesByMonth, rotationByPeriod } from '../components/dashboard-data'
import { DashboardMetrics } from '../components/dashboard-metrics'
import { MonthlyPurchasesCard } from '../components/monthly-purchases-card'
import { RotationSection } from '../components/rotation-section'

export function DashboardPage() {
  const [period, setPeriod] = useState(months[0].value)
  const rotation = useMemo(() => rotationByPeriod[period] ?? [], [period])
  const periodLabel = months.find(month => month.value === period)?.label ?? ''

  return <div className="space-y-4 sm:space-y-5">
    <DashboardHeader months={months} period={period} onPeriodChange={setPeriod} />
    <DashboardMetrics periodLabel={periodLabel} />
    <RotationSection products={rotation} periodLabel={periodLabel} />
    <section className="grid gap-4 lg:grid-cols-2"><MonthlyPurchasesCard data={purchasesByMonth} /><ActiveImportsCard number="IMP-2026-001" supplier="Shenzhen Paper Co. Ltd." status="En tránsito" /></section>
  </div>
}
