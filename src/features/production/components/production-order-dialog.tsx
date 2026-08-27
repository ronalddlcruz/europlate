import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import type { CatalogProduct, ProductionCatalog, ProductionPayload } from '../services/production-api.service'

type DraftMaterial = { productId: string; presentationId: string; warehouseId: string; quantity: number; immediateConsumption: boolean }
const today = new Date().toISOString().slice(0, 10)
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60" {...props}>{children}</select>
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.25px] text-slate-600">{label}</span>{children}</label>

export function ProductionOrderDialog({ catalog, saving, onClose, onSave }: { catalog: ProductionCatalog; saving: boolean; onClose: () => void; onSave: (payload: ProductionPayload) => Promise<void> }) {
  const [productId, setProductId] = useState('')
  const [presentationId, setPresentationId] = useState('')
  const [warehouseId, setWarehouseId] = useState(catalog.warehouses[0]?.id ?? '')
  const [quantity, setQuantity] = useState<number>(1)
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState<'PLANNED' | 'IN_PROGRESS'>('IN_PROGRESS')
  const [note, setNote] = useState('')
  const [materials, setMaterials] = useState<DraftMaterial[]>([{ productId: '', presentationId: '', warehouseId: catalog.warehouses[0]?.id ?? '', quantity: 1, immediateConsumption: false }])
  const output = catalog.products.find(item => item.id === productId)
  const stockOf = (product: string, warehouse: string) => Number(catalog.stocks.find(item => item.productId === product && item.warehouseId === warehouse)?.quantity ?? 0)

  useEffect(() => { if (!catalog.warehouses.some(item => item.id === warehouseId)) setWarehouseId(catalog.warehouses[0]?.id ?? '') }, [catalog.warehouses, warehouseId])
  const patch = (index: number, values: Partial<DraftMaterial>) => setMaterials(current => current.map((line, position) => position === index ? { ...line, ...values } : line))
  const productFor = (line: DraftMaterial): CatalogProduct | undefined => catalog.materials.find(item => item.id === line.productId)
  const presentationFor = (line: DraftMaterial) => productFor(line)?.presentations.find(item => item.id === line.presentationId)
  const valid = productId && presentationId && warehouseId && quantity > 0 && materials.length > 0 && materials.every(line => line.productId && line.presentationId && line.warehouseId && line.quantity > 0)
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!valid) return; await onSave({ productId, presentationId, warehouseId, quantity, scheduledAt: date, status, note: note.trim() || null, materials }) }
  const outputUnit = output?.presentations.find(item => item.id === presentationId)?.unit.code

  return <Dialog open title="Nueva Orden de Producción" onClose={onClose} extraWide footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="production-order-form" disabled={!valid || saving}>{saving ? 'Creando…' : 'Crear Orden'}</Button></>}>
    <form id="production-order-form" onSubmit={submit} className="space-y-5">
      <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
        <Field label="Producto *"><Select value={productId} onChange={event => { setProductId(event.target.value); setPresentationId('') }}><option value="">Buscar producto...</option>{catalog.products.map(product => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</Select></Field>
        <Field label="Presentación *"><Select value={presentationId} disabled={!productId} onChange={event => setPresentationId(event.target.value)}><option value="">Selecciona producto</option>{output?.presentations.map(item => <option key={item.id} value={item.id}>{item.name} · {item.unit.code}</option>)}</Select></Field>
        <Field label="Cantidad a producir *"><div className="flex gap-2"><Input type="number" min="0.001" step="0.001" value={quantity || ''} placeholder="0" onChange={event => setQuantity(Number(event.target.value))} /><div className="flex h-10 min-w-20 items-center justify-center rounded-md border border-border bg-slate-50 px-3 text-xs font-medium text-muted">{outputUnit ?? 'UM'}</div></div></Field>
        <Field label="Fecha de producción *"><div className="relative"><Input type="date" value={date} onChange={event => setDate(event.target.value)} className="pr-10" /><CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></div></Field>
        <Field label="Almacén destino *"><Select value={warehouseId} onChange={event => setWarehouseId(event.target.value)}><option value="">Selecciona almacén</option>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Estado inicial"><Select value={status} onChange={event => setStatus(event.target.value as 'PLANNED' | 'IN_PROGRESS')}><option value="IN_PROGRESS">En producción</option><option value="PLANNED">Planificada</option></Select></Field>
        <div className="md:col-span-2"><Field label="Comentario de la orden"><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Detalle u observación de la orden..." className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" /></Field></div>
      </div>
      <section>
        <div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Insumos a consumir</h3><p className="mt-0.5 text-xs text-muted">Los insumos marcados como consumo inmediato se descuentan al crear la orden.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setMaterials(current => [...current, { productId: '', presentationId: '', warehouseId: catalog.warehouses[0]?.id ?? '', quantity: 1, immediateConsumption: false }])}><Plus className="h-3.5 w-3.5" />Agregar insumo</Button></div>
        <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[980px] text-left"><thead><tr className="bg-[#f7f9fc] text-[10px] uppercase tracking-[.4px] text-muted">{['Producto', 'Código', 'Presentación', 'Almacén', 'UM', 'Cant.', 'Disponible', 'Tipo', ''].map(header => <th key={header} className="border-b border-border px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{materials.map((line, index) => { const product = productFor(line); const presentation = presentationFor(line); return <tr className="border-b border-border last:border-0" key={index}><td className="p-2"><Select value={line.productId} onChange={event => patch(index, { productId: event.target.value, presentationId: '' })}><option value="">Buscar insumo...</option>{catalog.materials.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td className="p-2 font-mono text-xs text-muted">{product?.code ?? '—'}</td><td className="p-2"><Select value={line.presentationId} disabled={!line.productId} onChange={event => patch(index, { presentationId: event.target.value })}><option value="">Selecciona presentación</option>{product?.presentations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td className="p-2"><Select value={line.warehouseId} onChange={event => patch(index, { warehouseId: event.target.value })}>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td className="p-2 text-center text-xs text-muted">{presentation?.unit.code ?? '—'}</td><td className="p-2"><Input type="number" min="0.001" step="0.001" value={line.quantity || ''} onChange={event => patch(index, { quantity: Number(event.target.value) })} /></td><td className="p-2 text-right font-mono text-xs text-emerald-600">{line.productId && line.warehouseId ? stockOf(line.productId, line.warehouseId) : '—'}</td><td className="p-2"><label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-600"><input type="checkbox" checked={line.immediateConsumption} onChange={event => patch(index, { immediateConsumption: event.target.checked })} className="h-4 w-4 accent-brand" />Inmediato</label></td><td className="p-2 text-center"><button type="button" aria-label="Quitar insumo" onClick={() => setMaterials(current => current.length === 1 ? current : current.filter((_, position) => position !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr> })}</tbody></table></div>
      </section>
    </form>
  </Dialog>
}
