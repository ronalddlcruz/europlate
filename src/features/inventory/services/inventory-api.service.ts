import { api } from '../../../lib/api-client'

export type WarehouseResponsible = { id: string; name: string; email: string; roles?: { role: { key: string; name: string } }[] }
export type Warehouse = { id: string; name: string; location: string | null; department?: string | null; province?: string | null; district?: string | null; address?: string | null; description: string | null; status: 'ACTIVE' | 'INACTIVE'; responsibleUserId?: string | null; responsible?: WarehouseResponsible | null }
export type CatalogProduct = { id: string; code: string; name: string; presentations: { id: string; name: string; unit: { code: string } }[] }
export type CatalogCustomer = { id: string; name: string }
export type StockRecord = { productId: string; code: string; product: string; category: string; subcategory: string; roles?: ('MERCHANDISE' | 'SUPPLY' | 'FINISHED_PRODUCT')[]; presentation?: string; presentationId: string | null; unit: string; unitName?: string; factor: number; minimum: number; total: number; available: number; inProduction: number; costUsd: number; costPen: number; status: 'ACTIVE' | 'INACTIVE'; warehouses: { id: string; name: string; quantity: number }[] }
export type Movement = { id: string; date: string; type: string; product: string; presentation: string; warehouse: string; quantity: number; note: string; user: string; reference?: string | null }
export type Transfer = { id: string; date: string; product: string; origin: string; destination: string; quantity: number; unitName: string; note: string; user: string }
export type Adjustment = { id: string; date: string; type: 'IN' | 'OUT' | 'WASTE'; product: string; presentation: string; warehouse: string; customer: string; previous: number; next: number; unitName: string; factor: number; reason: string; user: string }

const number = (value: string | number) => Number(value)
const format = (value: string) => new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
export type StockStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'
export const listStock = (status: StockStatusFilter = 'ACTIVE') => api<StockRecord[]>(`/api/inventory/stock?status=${status}`)
export const loadInventoryCatalog = () => api<{ products: CatalogProduct[]; warehouses: Warehouse[]; customers: CatalogCustomer[] }>('/api/inventory/catalog')
export const listMovements = async () => (await api<any[]>('/api/inventory/movements')).map(item => ({ id: item.id, date: format(item.createdAt), type: item.type, product: item.product.name, presentation: item.presentation?.name ?? item.product.presentations[0]?.name ?? '—', warehouse: item.warehouse.name, quantity: number(item.quantity), note: item.note ?? item.reference ?? '—', user: item.createdBy?.name ?? item.createdBy?.email ?? 'Sistema', reference: item.reference }) satisfies Movement)
export const listTransfers = async () => (await api<any[]>('/api/inventory/transfers')).map(item => ({ id: item.id, date: format(item.createdAt), product: item.product.name, origin: item.fromWarehouse.name, destination: item.toWarehouse.name, quantity: number(item.quantity), unitName: item.presentation?.unit?.description ?? item.presentation?.unit?.code ?? 'und.', note: item.note ?? '—', user: item.createdBy?.email ?? 'Sistema' }) satisfies Transfer)
export const listAdjustments = async () => (await api<any[]>('/api/inventory/adjustments')).map(item => ({ id: item.id, date: format(item.createdAt), type: item.type ?? (number(item.newQuantity) >= number(item.previousQuantity) ? 'IN' : 'OUT'), product: item.product.name, presentation: item.presentation?.name ?? '—', warehouse: item.warehouse.name, customer: item.customer?.name ?? '—', previous: number(item.previousQuantity), next: number(item.newQuantity), unitName: item.presentation?.unit?.description ?? item.presentation?.unit?.code ?? 'und.', factor: number(item.presentation?.factor ?? 1), reason: item.customer ? `${item.reason} · Cliente: ${item.customer.name}` : item.reason, user: item.createdBy?.name ?? item.createdBy?.email ?? 'Sistema' }) satisfies Adjustment)
export const listWarehouses = () => api<Warehouse[]>('/api/inventory/warehouses')
export const listWarehouseResponsibles = () => api<WarehouseResponsible[]>('/api/inventory/warehouse-responsibles')
type MovementActor = { name?: string | null; email?: string | null } | null
type MovementPresentation = { name: string; factor: number | string; unit?: { description?: string | null; code: string } } | null
export type CreatedTransfer = { id: string; createdAt: string; quantity: number | string; note: string | null; product: { id: string; name: string }; presentation: MovementPresentation; fromWarehouse: { id: string; name: string }; toWarehouse: { id: string; name: string }; createdBy: MovementActor }
export type CreatedAdjustment = { id: string; createdAt: string; type: 'IN' | 'OUT' | 'WASTE'; previousQuantity: number | string; newQuantity: number | string; reason: string; product: { name: string }; presentation: MovementPresentation; warehouse: { name: string }; createdBy: MovementActor }
export const createTransfer = (payload: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; note?: string | null }) => api<CreatedTransfer>('/api/inventory/transfers', { method: 'POST', body: JSON.stringify(payload) })
export const createAdjustment = (payload: { productId: string; warehouseId: string; type: 'IN' | 'OUT' | 'WASTE'; quantity: number; customerId?: string | null; reason: string }) => api<CreatedAdjustment>('/api/inventory/adjustments', { method: 'POST', body: JSON.stringify(payload) })
export function movementsFromTransfer(transfer: CreatedTransfer): Movement[] {
  const shared = { date: format(transfer.createdAt), product: transfer.product.name, presentation: transfer.presentation?.name ?? '—', user: transfer.createdBy?.name ?? transfer.createdBy?.email ?? 'Sistema', reference: transfer.id }
  const quantity = number(transfer.quantity) * number(transfer.presentation?.factor ?? 1)
  const note = transfer.note ? ` · ${transfer.note}` : ''
  return [
    { ...shared, id: `${transfer.id}:out`, type: 'TRANSFER_OUT', warehouse: transfer.fromWarehouse.name, quantity: -quantity, note: `→ ${transfer.toWarehouse.name}${note}` },
    { ...shared, id: `${transfer.id}:in`, type: 'TRANSFER_IN', warehouse: transfer.toWarehouse.name, quantity, note: `← ${transfer.fromWarehouse.name}${note}` },
  ]
}
export function transferFromCreated(transfer: CreatedTransfer): Transfer {
  return {
    id: transfer.id,
    date: format(transfer.createdAt),
    product: transfer.product.name,
    origin: transfer.fromWarehouse.name,
    destination: transfer.toWarehouse.name,
    quantity: number(transfer.quantity),
    unitName: transfer.presentation?.unit?.description ?? transfer.presentation?.unit?.code ?? 'und.',
    note: transfer.note ?? '—',
    user: transfer.createdBy?.email ?? 'Sistema',
  }
}
export function movementFromAdjustment(adjustment: CreatedAdjustment): Movement {
  return {
    id: `${adjustment.id}:movement`,
    date: format(adjustment.createdAt),
    type: adjustment.type === 'IN' ? 'ADJUSTMENT_IN' : adjustment.type === 'WASTE' ? 'ADJUSTMENT_WASTE' : 'ADJUSTMENT_OUT',
    product: adjustment.product.name,
    presentation: adjustment.presentation?.name ?? '—',
    warehouse: adjustment.warehouse.name,
    quantity: number(adjustment.newQuantity) - number(adjustment.previousQuantity),
    note: adjustment.reason,
    user: adjustment.createdBy?.name ?? adjustment.createdBy?.email ?? 'Sistema',
    reference: adjustment.id,
  }
}
export const createWarehouse = (payload: Omit<Warehouse, 'id'>) => api<Warehouse>('/api/inventory/warehouses', { method: 'POST', body: JSON.stringify(payload) })
export const updateWarehouse = (id: string, payload: Partial<Omit<Warehouse, 'id'>>) => api<Warehouse>(`/api/inventory/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteWarehouse = (id: string) => api<void>(`/api/inventory/warehouses/${id}`, { method: 'DELETE' })
