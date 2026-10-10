import { api } from '../../../lib/api-client'

import type { MonthlyPurchase, RotationProduct } from '../components/dashboard-data'

export type DashboardSummary = { period: string; periods: { value: string; label: string }[]; metrics: { purchasesPen: number; nationalPurchasesPen: number; importsPen: number; nationalPurchaseCount: number; purchasesUnconvertedUsd?: number; purchasesUsdRate?: number | null; activeProducts: number; imports: number; totalStock: number }; purchasesByMonth: MonthlyPurchase[]; rotation: RotationProduct[] }
export const loadDashboardSummary = (period?: string) => api<DashboardSummary>(`/api/dashboard/summary${period ? `?period=${encodeURIComponent(period)}` : ''}`)

type DashboardPurchase = { date: string; currency: 'PEN' | 'USD'; total: number; status: string }

const monthOf = (value: string) => value.slice(0, 7)
/**
 * Refleja una compra nacional en el caché visible antes de la confirmación de
 * red. El dashboard continúa recargándose después, por lo que la BD conserva
 * la fuente de verdad sin hacer esperar al usuario.
 */
export function addPurchaseToDashboard(summary: DashboardSummary, purchase: DashboardPurchase): DashboardSummary {
  if (purchase.currency !== 'PEN' || purchase.status === 'Anulada' || !Number.isFinite(purchase.total)) return summary
  const purchasePeriod = monthOf(purchase.date)
  const purchasesByMonth = summary.purchasesByMonth.map(item =>
    item.period === purchasePeriod
      ? { ...item, nationalPen: item.nationalPen + purchase.total, nationalCount: item.nationalCount + 1, totalPen: item.totalPen + purchase.total }
      : item,
  )
  return {
    ...summary,
    metrics: purchasePeriod === summary.period
      ? { ...summary.metrics, purchasesPen: summary.metrics.purchasesPen + purchase.total, nationalPurchasesPen: summary.metrics.nationalPurchasesPen + purchase.total, nationalPurchaseCount: summary.metrics.nationalPurchaseCount + 1 }
      : summary.metrics,
    purchasesByMonth,
  }
}
