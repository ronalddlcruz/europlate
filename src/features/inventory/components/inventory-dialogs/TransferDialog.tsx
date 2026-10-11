import { useState,type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createTransfer,type CatalogProduct,type StockRecord,type Warehouse } from '@/features/inventory/services/inventory-api.service'
import { Field,ProductPicker,WarehousePicker } from '@/features/inventory/components/inventory-shared'

export function TransferDialog({ catalog, stock, saving, initialValues, onClose, onSave }: {
  catalog: { products: CatalogProduct[]; warehouses: Warehouse[] }
  stock: StockRecord[]
  saving: boolean
  initialValues?: Parameters<typeof createTransfer>[0] | null
  onClose: () => void
  onSave: (payload: Parameters<typeof createTransfer>[0]) => void
}) {
  const [productId, setProductId] = useState(initialValues?.productId ?? '')
  const [fromWarehouseId, setFrom] = useState(initialValues?.fromWarehouseId ?? '')
  const [toWarehouseId, setTo] = useState(initialValues?.toWarehouseId ?? '')
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? 1)
  const [note, setNote] = useState(initialValues?.note ?? '')
  const stockRecord = stock.find(item => item.productId === productId)
  const available = stockRecord?.warehouses.find(item => item.id === fromWarehouseId)?.quantity ?? 0
  const unitName = stockRecord?.unitName ?? stockRecord?.unit ?? 'und.'
  const factor = stockRecord?.factor ?? 1
  const formatQuantity = (value: number) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(value)
  const exceedsStock = Boolean(stockRecord && fromWarehouseId && quantity > 0 && quantity * factor > available + 0.000001)
  const valid = Boolean(productId && stockRecord && fromWarehouseId && toWarehouseId && fromWarehouseId !== toWarehouseId && quantity > 0 && !exceedsStock)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) onSave({ productId, fromWarehouseId, toWarehouseId, quantity, note: note.trim() || null })
  }

  return <Dialog open title="Transferencia entre Almacenes" onClose={onClose} footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="transfer-form" disabled={!valid || saving}>{saving ? 'Transfiriendo…' : 'Transferir'}</Button></>}>
    <form id="transfer-form" onSubmit={submit} className="space-y-5">
      <Field label="Producto *"><ProductPicker products={catalog.products} value={productId} onChange={setProductId} /></Field>
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">Ruta de transferencia</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Almacén origen *"><WarehousePicker warehouses={catalog.warehouses} value={fromWarehouseId} onChange={setFrom} placeholder="Buscar almacén origen..." /></Field>
          <Field label="Almacén destino *"><WarehousePicker warehouses={catalog.warehouses} value={toWarehouseId} onChange={setTo} placeholder="Buscar almacén destino..." /></Field>
        </div>
        {productId && fromWarehouseId && stockRecord && (
          <p className="text-xs text-slate-500">
            Disponible en origen: <span className="font-mono font-semibold text-slate-700">{formatQuantity(available / factor)} {unitName}</span>
            <span className="ml-1 font-mono">({formatQuantity(available)} und.)</span>
          </p>
        )}
      </div>
      {fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId && <p className="text-xs text-red-600">Selecciona un almacén destino diferente al de origen.</p>}
      <Field label={`Cantidad *${productId ? ` (${unitName})` : ''}`}><Input type="number" min="0.001" step="0.001" value={quantity || ''} onChange={event => setQuantity(Number(event.target.value))} /></Field>
      {exceedsStock && <p className="text-xs text-red-600">La cantidad supera el stock del almacén origen.</p>}
      <Field label="Comentario"><textarea value={note} onChange={event => setNote(event.target.value)} className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] p-3 text-sm outline-none focus:border-brand" /></Field>
    </form>
  </Dialog>
}
