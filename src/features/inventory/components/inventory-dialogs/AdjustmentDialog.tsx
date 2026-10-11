import { useState,type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type CatalogCustomer,type CatalogProduct,type StockRecord,type Warehouse } from '@/features/inventory/services/inventory-api.service'
import { CustomerPicker,Field,ProductPicker,Select } from '@/features/inventory/components/inventory-shared'

export function AdjustmentDialog({ catalog, stock, saving, onClose, onSave }: {
  catalog: { products: CatalogProduct[]; warehouses: Warehouse[]; customers: CatalogCustomer[] }
  stock: StockRecord[]
  saving: boolean
  onClose: () => void
  onSave: (payload: { productId: string; warehouseId: string; type: 'IN' | 'OUT' | 'WASTE'; quantity: number; customerId?: string | null; reason: string }) => void
}) {
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouse] = useState(catalog.warehouses[0]?.id ?? '')
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<'IN' | 'OUT' | 'WASTE'>('IN')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('')
  const stockRecord = stock.find(item => item.productId === productId)
  const previousBase = stockRecord?.warehouses.find(item => item.id === warehouseId)?.quantity ?? 0
  const factor = stockRecord?.factor ?? 1
  const previous = previousBase / factor
  const isOutput = type !== 'IN'
  const isProductOutput = type === 'OUT'
  const nextStock = previous + (isOutput ? -quantity : quantity)
  const cannotSubtract = isOutput && (previous <= 0 || nextStock < 0)
  const valid = Boolean(productId && warehouseId && quantity > 0 && reason.trim().length >= 3 && !cannotSubtract)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) onSave({ productId, warehouseId, type, quantity, customerId: customerId || null, reason: reason.trim() })
  }
  return <Dialog open wide title="Ajuste de Inventario" onClose={onClose} footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="adjustment-form" disabled={!valid || saving}>{saving ? 'Aplicando…' : 'Aplicar Ajuste'}</Button></>}>
    <form id="adjustment-form" onSubmit={submit} className="space-y-4">
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">El ajuste queda registrado en auditoría. La justificación es obligatoria.</p>
      <Field label="Producto *"><ProductPicker products={catalog.products} value={productId} onChange={setProductId} /></Field>
      <Field label="Almacén *"><Select value={warehouseId} onChange={event => setWarehouse(event.target.value)}>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Tipo de ajuste *"><Select value={type} onChange={event => { setType(event.target.value as 'IN' | 'OUT' | 'WASTE'); setCustomerId('') }}><option value="IN">Ingreso</option><option value="OUT">Salida de producto</option><option value="WASTE">Merma</option></Select></Field><Field label={`Cantidad *${stockRecord ? ` (${stockRecord.unitName ?? stockRecord.unit})` : ''}`}><Input type="number" min="0.001" step="0.001" value={quantity || ''} placeholder="Ingresa cantidad" onChange={event => setQuantity(Number(event.target.value))} /></Field></div>
      <Field label={`Stock actual${stockRecord ? ` (${stockRecord.unitName ?? stockRecord.unit})` : ''}`}><Input readOnly value={previous} className="font-mono font-bold text-brand" /></Field>
      {cannotSubtract && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">No se puede registrar una salida mayor al stock disponible en este almacén.</p>}
      <Field label={`Nuevo Stock (calculado)${stockRecord ? ` (${stockRecord.unitName ?? stockRecord.unit})` : ''}`}><Input readOnly value={Math.max(0, nextStock)} className="font-mono font-bold text-emerald-600" /></Field>
      {isProductOutput && <Field label="Cliente de salida (opcional)"><CustomerPicker customers={catalog.customers} value={customerId} onChange={setCustomerId} /></Field>}
      <Field label="Justificación *"><textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Motivo del ajuste..." className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] p-3 text-sm outline-none focus:border-brand" /></Field>
    </form>
  </Dialog>
}
