import { api } from '../../../lib/api-client'

export type ReportStock = {
  productId: string
  code: string
  product: string
  category: string
  subcategory: string
  roles: ('MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT')[]
  unit: string
  factor: number
  minimum: number
  total: number
  available: number
  inProduction: number
  status: 'ACTIVE' | 'INACTIVE'
  warehouses: { id: string; name: string; quantity: number }[]
}

export type ReportMovement = { id: string; createdAt: string; type: string; product: string; presentation: string; warehouse: string; quantity: number; reference: string; note: string | null; user: string }
export type ReportPurchase = { id: string; number: string; type: 'Compra nacional' | 'Importación'; supplier: string; date: string; currency: string; total: number; status: string }
export type ReportProduction = { id: string; number: string; product: string; warehouse: string; quantity: number; date: string; status: string; outputDispatched: boolean }
export type ReportsDashboard = { stock: ReportStock[]; movements: ReportMovement[]; purchases: ReportPurchase[]; imports: ReportPurchase[]; production: ReportProduction[] }

export const loadReportsDashboard = () => api<ReportsDashboard>('/api/reports/dashboard')
