import { api } from '../../../lib/api-client'

export type ProductionStatus = 'Planificada' | 'En producción' | 'Completada' | 'Cancelada'
export type ProductionMaterial = { id: string; productId: string; warehouseId: string; product: string; code: string; warehouse: string; unit: string; quantity: number; status: 'Reservado' | 'Consumido'; immediateConsumption: boolean }
export type ProductionOrder = { id: string; number: string; productId: string; warehouseId: string; product: string; unit: string; warehouse: string; quantity: number; date: string; status: ProductionStatus; note: string | null; outputDispatched: boolean; outputJustification: string | null; materials: ProductionMaterial[] }
export type CatalogProduct = { id: string; code: string; name: string; unit: string | null; available: number }
export type ProductionCatalog = { products: CatalogProduct[]; materials: CatalogProduct[]; warehouses: { id: string; name: string }[]; stocks: { productId: string; warehouseId: string; quantity: string | number }[] }
export type ProductionPayload = { productId: string; warehouseId: string; quantity: number; scheduledAt: string; note?: string | null; status: 'PLANNED' | 'IN_PROGRESS'; materials: { productId: string; warehouseId: string; quantity: number; immediateConsumption: boolean }[] }

type ApiProduct = { name: string; code: string; presentations: { unit: { code: string } }[] }
type ApiOrder = { id: string; number: string; productId: string; warehouseId: string; quantity: string | number; scheduledAt: string; status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'; note: string | null; outputDispatched: boolean; outputJustification: string | null; product: ApiProduct; warehouse: { name: string }; materials: { id: string; productId: string; warehouseId: string; quantity: string | number; status: 'RESERVED' | 'CONSUMED'; immediateConsumption: boolean; product: ApiProduct; warehouse: { name: string } }[] }

const labels: Record<ApiOrder['status'], ProductionStatus> = { PLANNED: 'Planificada', IN_PROGRESS: 'En producción', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
const unitOf = (product: ApiProduct) => product.presentations[0]?.unit.code ?? '—'
const mapOrder = (order: ApiOrder): ProductionOrder => ({
  id: order.id,
  number: order.number,
  productId: order.productId,
  warehouseId: order.warehouseId,
  product: order.product.name,
  unit: unitOf(order.product),
  warehouse: order.warehouse.name,
  quantity: Number(order.quantity),
  date: order.scheduledAt.slice(0, 10),
  status: labels[order.status],
  note: order.note,
  outputDispatched: order.outputDispatched,
  outputJustification: order.outputJustification,
  materials: order.materials.map(material => ({
    id: material.id,
    productId: material.productId,
    warehouseId: material.warehouseId,
    product: material.product.name,
    code: material.product.code,
    warehouse: material.warehouse.name,
    unit: unitOf(material.product),
    quantity: Number(material.quantity),
    status: material.status === 'CONSUMED' ? 'Consumido' : 'Reservado',
    immediateConsumption: material.immediateConsumption,
  })),
})

export async function listProductionOrders() { return (await api<ApiOrder[]>('/api/production')).map(mapOrder) }
export async function loadProductionCatalog() { return api<ProductionCatalog>('/api/production/catalog') }
export async function createProductionOrder(payload: ProductionPayload) { return mapOrder(await api<ApiOrder>('/api/production', { method: 'POST', body: JSON.stringify(payload) })) }
export async function completeProductionOrder(id: string, payload: { outputDispatched: boolean; outputJustification?: string | null }) { return mapOrder(await api<ApiOrder>(`/api/production/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) })) }
export async function consumeProductionMaterial(orderId: string, materialId: string) { return mapOrder(await api<ApiOrder>(`/api/production/${orderId}/materials/${materialId}/consume`, { method: 'POST' })) }
export async function deleteProductionOrder(id: string) { await api<void>(`/api/production/${id}`, { method: 'DELETE' }) }
