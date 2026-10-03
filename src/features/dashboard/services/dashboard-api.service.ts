import { api } from '../../../lib/api-client'

export type DashboardSummary = { period: string; periods: { value: string; label: string }[]; metrics: { purchasesPen: number; activeProducts: number; imports: number; totalStock: number }; purchasesByMonth: { label: string; value: number }[]; rotation: { code: string; name: string; unit: string; units: number; movements: number }[]; activeImports: { number: string; supplier: string; status: string }[] }
export const loadDashboardSummary = (period?: string) => api<DashboardSummary>(`/api/dashboard/summary${period ? `?period=${encodeURIComponent(period)}` : ''}`)

type DashboardPurchase = { date: string; currency: 'PEN' | 'USD'; total: number; status: string }

const monthOf = (value: string) => value.slice(0, 7)
const monthBefore = (period: string, offset: number) => {
  const date = new Date(`${period}-01T12:00:00`)
  date.setMonth(date.getMonth() - offset)
  return date.toISOString().slice(0, 7)
}

/**
 * Refleja una compra nacional en el caché visible antes de la confirmación de
 * red. El dashboard continúa recargándose después, por lo que la BD conserva
 * la fuente de verdad sin hacer esperar al usuario.
 */
export function addPurchaseToDashboard(summary: DashboardSummary, purchase: DashboardPurchase): DashboardSummary {
  if (purchase.currency !== 'PEN' || purchase.status === 'Anulada' || !Number.isFinite(purchase.total)) return summary
  const purchasePeriod = monthOf(purchase.date)
  const purchasesByMonth = summary.purchasesByMonth.map((item, index) =>
    monthBefore(summary.period, 7 - index) === purchasePeriod
      ? { ...item, value: item.value + purchase.total }
      : item,
  )
  return {
    ...summary,
    metrics: purchasePeriod === summary.period
      ? { ...summary.metrics, purchasesPen: summary.metrics.purchasesPen + purchase.total }
      : summary.metrics,
    purchasesByMonth,
  }
}
