import { api } from '../../../lib/api-client'

export type DashboardSummary = { period: string; periods: { value: string; label: string }[]; metrics: { purchasesPen: number; activeProducts: number; imports: number; totalStock: number }; purchasesByMonth: { label: string; value: number }[]; rotation: { code: string; name: string; unit: string; units: number; movements: number }[]; activeImports: { number: string; supplier: string; status: string }[] }
export const loadDashboardSummary = (period?: string) => api<DashboardSummary>(`/api/dashboard/summary${period ? `?period=${encodeURIComponent(period)}` : ''}`)
