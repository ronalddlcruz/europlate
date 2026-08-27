import { api } from '../../../lib/api-client'

export type Warehouse = { id: string; name: string; location: string | null; description: string | null; status: 'ACTIVE' | 'INACTIVE' }
export type CatalogProduct = { id: string; code: string; name: string; presentations: { id: string; name: string; unit: { code: string } }[] }
export type StockRecord = { productId: string; code: string; product: string; presentation: string; presentationId: string | null; unit: string; minimum: number; total: number; available: number; inProduction: number; costUsd: number; costPen: number; warehouses: { id: string; name: string; quantity: number }[] }
export type Movement = { id: string; date: string; type: string; product: string; presentation: string; warehouse: string; quantity: number; note: string; user: string }
export type Transfer = { id: string; date: string; product: string; presentation: string; origin: string; destination: string; quantity: number; note: string; user: string }
export type Adjustment = { id: string; date: string; product: string; presentation: string; warehouse: string; previous: number; next: number; reason: string; user: string }

const number = (value: string | number) => Number(value)
const format = (value: string) => new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
export const listStock = () => api<StockRecord[]>('/api/inventory/stock')
export const loadInventoryCatalog = () => api<{ products: CatalogProduct[]; warehouses: Warehouse[] }>('/api/inventory/catalog')
export const listMovements = async () => (await api<any[]>('/api/inventory/movements')).map(item => ({ id: item.id, date: format(item.createdAt), type: item.type, product: item.product.name, presentation: item.presentation?.name ?? item.product.presentations[0]?.name ?? '—', warehouse: item.warehouse.name, quantity: number(item.quantity), note: item.note ?? item.reference ?? '—', user: item.createdBy?.email ?? 'Sistema' }) satisfies Movement)
export const listTransfers = async () => (await api<any[]>('/api/inventory/transfers')).map(item => ({ id: item.id, date: format(item.createdAt), product: item.product.name, presentation: item.presentation?.name ?? '—', origin: item.fromWarehouse.name, destination: item.toWarehouse.name, quantity: number(item.quantity), note: item.note ?? '—', user: item.createdBy?.email ?? 'Sistema' }) satisfies Transfer)
export const listAdjustments = async () => (await api<any[]>('/api/inventory/adjustments')).map(item => ({ id: item.id, date: format(item.createdAt), product: item.product.name, presentation: item.presentation?.name ?? '—', warehouse: item.warehouse.name, previous: number(item.previousQuantity), next: number(item.newQuantity), reason: item.reason, user: item.createdBy?.email ?? 'Sistema' }) satisfies Adjustment)
export const listWarehouses = () => api<Warehouse[]>('/api/inventory/warehouses')
export const createTransfer = (payload: { productId: string; presentationId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; note?: string | null }) => api('/api/inventory/transfers', { method: 'POST', body: JSON.stringify(payload) })
export const createAdjustment = (payload: { productId: string; presentationId: string; warehouseId: string; delta: number; reason: string }) => api('/api/inventory/adjustments', { method: 'POST', body: JSON.stringify(payload) })
export const createWarehouse = (payload: Omit<Warehouse, 'id'>) => api<Warehouse>('/api/inventory/warehouses', { method: 'POST', body: JSON.stringify(payload) })
export const updateWarehouse = (id: string, payload: Partial<Omit<Warehouse, 'id'>>) => api<Warehouse>(`/api/inventory/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteWarehouse = (id: string) => api<void>(`/api/inventory/warehouses/${id}`, { method: 'DELETE' })
