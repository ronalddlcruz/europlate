import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronDown, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import type { CatalogProduct, ProductionCatalog, ProductionPayload } from '../services/production-api.service'

type DraftMaterial = { productId: string; warehouseId: string; quantity: number; immediateConsumption: boolean; shareReservation?: boolean }
type PickerItem = { id: string; title: string; detail: string }

const today = new Date().toISOString().slice(0, 10)
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60" {...props}>{children}</select>
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.25px] text-slate-600">{label}</span>{children}</label>

function CatalogPicker({ items, value, onChange, label }: { items: PickerItem[]; value: string; onChange: (id: string) => void; label: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = items.find(item => item.id === value)
  const filtered = items.filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()))
  const updatePosition = () => { const box = ref.current?.getBoundingClientRect(); if (box) setPosition({ left: box.left, top: box.bottom + 6, width: box.width }) }

  useEffect(() => { setQuery(selected?.title ?? '') }, [selected?.title])
  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true) }
  }, [open])
  useEffect(() => {
    const close = (event: MouseEvent) => { const target = event.target as Node; if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const menu = open && position ? <div ref={menuRef} style={{ left: position.left, top: position.top, width: position.width }} className="fixed z-[70] overflow-hidden rounded-md border border-border bg-white shadow-panel"><p className="border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase text-muted">{filtered.length} resultado(s)</p><div className="max-h-44 overflow-y-auto">{filtered.map(item => <button type="button" key={item.id} onClick={() => { onChange(item.id); setOpen(false) }} className="flex w-full min-w-0 gap-2 px-2.5 py-2 text-left hover:bg-blue-50"><span className="shrink-0 rounded bg-blue-50 px-1.5 py-1 text-[10px] font-bold text-brand">{item.title.slice(0, 3).toUpperCase()}</span><span className="min-w-0 flex-1"><span title={item.title} className="block truncate text-sm font-medium">{item.title}</span><span title={item.detail} className="block truncate text-[11px] text-muted">{item.detail}</span></span></button>)}{!filtered.length && <p className="p-3 text-center text-sm text-muted">No se encontraron resultados.</p>}</div></div> : null
  return <div ref={ref} className="relative"><div className={open ? 'flex h-10 items-center rounded-md border border-brand bg-white px-3 ring-1 ring-brand' : 'flex h-10 items-center rounded-md border border-border bg-white px-3'}><Search className="mr-2 h-4 w-4 text-slate-400" /><input value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); onChange(''); setOpen(true) }} placeholder={`Buscar ${label}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={() => { setOpen(current => !current); updatePosition() }}><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>{typeof document !== 'undefined' && createPortal(menu, document.body)}</div>
}

export function ProductionOrderDialog({ catalog, saving, onClose, onSave }: { catalog: ProductionCatalog; saving: boolean; onClose: () => void; onSave: (payload: ProductionPayload) => Promise<void> }) {
  const defaultWarehouseId = catalog.warehouses[0]?.id ?? ''
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId)
  const [quantity, setQuantity] = useState<number>(1)
  const [date, setDate] = useState(today)
  const [dispatchStep, setDispatchStep] = useState<'prompt' | 'details' | null>(null)
  const [outputJustification, setOutputJustification] = useState('')
  const [outputCustomerId, setOutputCustomerId] = useState('')
  const [note, setNote] = useState('')
  const status = 'IN_PROGRESS' as const
  const setStatus = (_status: 'PLANNED' | 'IN_PROGRESS') => undefined
  const [materials, setMaterials] = useState<DraftMaterial[]>([{ productId: '', warehouseId: defaultWarehouseId, quantity: 1, immediateConsumption: false, shareReservation: false }])
  const output = catalog.products.find(item => item.id === productId)
  const productFor = (line: DraftMaterial): CatalogProduct | undefined => catalog.materials.find(item => item.id === line.productId)
  const availableOf = (productId: string, warehouseId?: string) => {
    const product = catalog.materials.find(item => item.id === productId)
    const selectedWarehouseId = warehouseId ?? materials.find(line => line.productId === productId)?.warehouseId
    const physicalStock = selectedWarehouseId
      ? catalog.stocks.find(stock => stock.productId === productId && stock.warehouseId === selectedWarehouseId)?.quantity ?? 0
      : catalog.stocks.filter(stock => stock.productId === productId).reduce((total, stock) => total + Number(stock.quantity), 0)
    return Number(physicalStock) / (product?.factor ?? 1)
  }
  const warehouseWithStock = (productId: string, currentWarehouseId: string) => {
    const selectedHasStock = catalog.stocks.some(stock => stock.productId === productId && stock.warehouseId === currentWarehouseId && Number(stock.quantity) > 0)
    if (selectedHasStock) return currentWarehouseId
    return catalog.stocks.find(stock => stock.productId === productId && Number(stock.quantity) > 0)?.warehouseId ?? currentWarehouseId
  }
  const patch = (index: number, values: Partial<DraftMaterial>) => setMaterials(current => current.map((line, position) => position === index ? { ...line, ...values } : line))
  const canShare = (line: DraftMaterial) => Boolean(line.productId && catalog.sharedReservations.some(item => item.productId === line.productId && item.warehouseId === line.warehouseId))
  const requestedByStock = materials.reduce((requested, line) => {
    const key = `${line.productId}:${line.warehouseId}`
    requested.set(key, (requested.get(key) ?? 0) + line.quantity)
    return requested
  }, new Map<string, number>())
  const invalidMaterial = materials.some(line => !line.productId || !line.warehouseId || line.quantity <= 0 || (requestedByStock.get(`${line.productId}:${line.warehouseId}`) ?? 0) > availableOf(line.productId, line.warehouseId))
  const valid = Boolean(productId && warehouseId && quantity > 0 && materials.length && !invalidMaterial)

  useEffect(() => { if (!catalog.warehouses.some(item => item.id === warehouseId)) setWarehouseId(defaultWarehouseId) }, [catalog.warehouses, defaultWarehouseId, warehouseId])
  const productItems = useMemo(() => catalog.products.map(product => ({ id: product.id, title: product.name, detail: `${product.code} · ${product.unitName ?? product.unit ?? 'Sin UM activa'}` })), [catalog.products])
  const materialItems = useMemo(() => catalog.materials.map(product => ({ id: product.id, title: product.name, detail: `${product.code} · ${product.unitName ?? product.unit ?? 'Sin UM activa'}` })), [catalog.materials])
  const save = async (outputDispatched: boolean) => {
    if (!valid) return
    await onSave({ productId, warehouseId, quantity, scheduledAt: date, note: note.trim() || null, outputDispatched, outputJustification: outputDispatched ? outputJustification.trim() : null, outputCustomerId: outputDispatched ? outputCustomerId : null, materials })
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (valid) setDispatchStep('prompt') }

  return <>
    <Dialog open title="Nueva Orden de Producción" onClose={onClose} extraWide footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="production-order-form" disabled={!valid || saving}>{saving ? 'Registrando…' : 'Registrar y completar'}</Button></>}>
      <form id="production-order-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
          <Field label="Producto terminado *"><CatalogPicker label="producto terminado" items={productItems} value={productId} onChange={setProductId} /></Field>
          <Field label="Cantidad a producir *"><div className="flex gap-2"><Input type="number" min="0.001" step="0.001" value={quantity || ''} placeholder="0" onChange={event => setQuantity(Number(event.target.value))} /><div className="flex h-10 min-w-20 items-center justify-center rounded-md border border-border bg-slate-50 px-3 text-xs font-medium text-muted">{output?.unitName ?? output?.unit ?? 'UM'}</div></div></Field>
          <Field label="Fecha de producción *"><div className="relative"><Input type="date" value={date} onChange={event => setDate(event.target.value)} className="pr-10" /><CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></div></Field>
          <Field label="Almacén destino *"><Select value={warehouseId} onChange={event => setWarehouseId(event.target.value)}><option value="">Selecciona almacén</option>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <div className="md:col-span-2"><Field label="Comentario de la orden"><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Detalle u observación de la orden..." className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" /></Field></div>
        </div>
        <section><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Insumos a consumir</h3><p className="mt-0.5 text-xs text-muted">Los insumos inmediatos salen del stock al registrar la orden.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setMaterials(current => [...current, { productId: '', warehouseId: defaultWarehouseId, quantity: 1, immediateConsumption: false, shareReservation: false }])}><Plus className="h-3.5 w-3.5" />Agregar insumo</Button></div>
          <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[820px] text-left"><thead><tr className="bg-[#f7f9fc] text-[10px] uppercase tracking-[.4px] text-muted">{['Insumo', 'Código', 'Almacén', 'UM', 'Cant.', 'Disponible', 'Tipo', ''].map(header => <th key={header} className="border-b border-border px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{materials.map((line, index) => { const product = productFor(line); const available = availableOf(line.productId, line.warehouseId); return <tr className="border-b border-border last:border-0" key={index}><td className="min-w-[240px] p-2"><CatalogPicker label="insumo" items={materialItems} value={line.productId} onChange={id => patch(index, { productId: id, warehouseId: warehouseWithStock(id, line.warehouseId), shareReservation: false })} /></td><td className="p-2 font-mono text-xs text-muted">{product?.code ?? '—'}</td><td className="p-2"><Select value={line.warehouseId} onChange={event => patch(index, { warehouseId: event.target.value, shareReservation: false })}>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td className="p-2 text-center text-xs text-muted">{product?.unitName ?? product?.unit ?? '—'}</td><td className="p-2"><Input type="number" min="0.001" step="0.001" value={line.quantity || ''} onChange={event => patch(index, { quantity: Number(event.target.value) })} /></td><td className={`p-2 text-right font-mono text-xs font-semibold ${line.productId && line.quantity > available && !line.shareReservation ? 'text-red-600' : 'text-emerald-600'}`}>{line.productId ? `${available} ${product?.unitName ?? product?.unit ?? ''}` : '—'}</td><td className="p-2"><div className="space-y-1.5"><label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-600"><input type="checkbox" checked={line.immediateConsumption} disabled={line.shareReservation} onChange={event => patch(index, { immediateConsumption: event.target.checked })} className="h-4 w-4 accent-brand" />Inmediato</label>{canShare(line) && !line.immediateConsumption && <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand"><input type="checkbox" checked={line.shareReservation} onChange={event => patch(index, { shareReservation: event.target.checked })} className="h-4 w-4 accent-brand" />Compartir unidad en producción</label>}</div></td><td className="p-2 text-center"><button type="button" aria-label="Quitar insumo" onClick={() => setMaterials(current => current.length === 1 ? current : current.filter((_, position) => position !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr> })}</tbody></table></div>
          {invalidMaterial && <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Verifica la disponibilidad de cada insumo antes de registrar la orden.</p>}
        </section>
      </form>
    </Dialog>
    {dispatchStep === 'prompt' && <Dialog open title="Salida de Inventario" onClose={() => setDispatchStep(null)} footer={<><Button variant="outline" onClick={() => void save(false)} disabled={saving}>No</Button><Button onClick={() => setDispatchStep('details')} disabled={saving}>Sí</Button></>}><p className="text-sm text-ink">¿Desea generar la salida de inventario para esta orden?</p></Dialog>}
    {dispatchStep === 'details' && <Dialog open title="Salida de Inventario" onClose={() => setDispatchStep(null)} footer={<><Button variant="outline" onClick={() => setDispatchStep('prompt')} disabled={saving}>Atrás</Button><Button disabled={saving || !outputCustomerId || outputJustification.trim().length < 3} onClick={() => void save(true)}>Confirmar</Button></>}><div className="space-y-4"><Field label="Cliente de la salida *"><Select value={outputCustomerId} onChange={event => setOutputCustomerId(event.target.value)}><option value="">Selecciona el cliente</option>{catalog.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select></Field><Field label="Justificación de la salida *"><textarea value={outputJustification} onChange={event => setOutputJustification(event.target.value)} placeholder="Motivo de la salida de inventario" className="min-h-24 w-full rounded-md border border-border bg-[#f4f7fb] px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" /></Field></div></Dialog>}
  </>

  return <Dialog open title="Nueva Orden de Producción" onClose={onClose} extraWide footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="production-order-form" disabled={!valid || saving}>{saving ? 'Creando…' : 'Crear Orden'}</Button></>}><form id="production-order-form" onSubmit={submit} className="space-y-5"><div className="grid gap-x-4 gap-y-4 md:grid-cols-2"><Field label="Producto terminado *"><CatalogPicker label="producto terminado" items={productItems} value={productId} onChange={setProductId} /></Field><Field label="Cantidad a producir *"><div className="flex gap-2"><Input type="number" min="0.001" step="0.001" value={quantity || ''} placeholder="0" onChange={event => setQuantity(Number(event.target.value))} /><div className="flex h-10 min-w-20 items-center justify-center rounded-md border border-border bg-slate-50 px-3 text-xs font-medium text-muted">{output?.unit ?? 'UM'}</div></div></Field><Field label="Fecha de producción *"><div className="relative"><Input type="date" value={date} onChange={event => setDate(event.target.value)} className="pr-10" /><CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></div></Field><Field label="Almacén destino *"><Select value={warehouseId} onChange={event => setWarehouseId(event.target.value)}><option value="">Selecciona almacén</option>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Estado inicial"><Select value={status} onChange={event => setStatus(event.target.value as 'PLANNED' | 'IN_PROGRESS')}><option value="IN_PROGRESS">En producción</option><option value="PLANNED">Planificada</option></Select></Field><div className="md:col-span-2"><Field label="Comentario de la orden"><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Detalle u observación de la orden..." className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" /></Field></div></div><section><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Insumos a consumir</h3><p className="mt-0.5 text-xs text-muted">Solo se muestran productos registrados como insumos.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setMaterials(current => [...current, { productId: '', warehouseId: defaultWarehouseId, quantity: 1, immediateConsumption: false }])}><Plus className="h-3.5 w-3.5" />Agregar insumo</Button></div><div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[820px] text-left"><thead><tr className="bg-[#f7f9fc] text-[10px] uppercase tracking-[.4px] text-muted">{['Insumo', 'Código', 'Almacén', 'UM', 'Cant.', 'Disponible', 'Tipo', ''].map(header => <th key={header} className="border-b border-border px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{materials.map((line, index) => { const product = productFor(line); return <tr className="border-b border-border last:border-0" key={index}><td className="min-w-[240px] p-2"><CatalogPicker label="insumo" items={materialItems} value={line.productId} onChange={id => patch(index, { productId: id, warehouseId: warehouseWithStock(id, line.warehouseId) })} /></td><td className="p-2 font-mono text-xs text-muted">{product?.code ?? '—'}</td><td className="p-2"><Select value={line.warehouseId} onChange={event => patch(index, { warehouseId: event.target.value })}>{catalog.warehouses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></td><td className="p-2 text-center text-xs text-muted">{product?.unit ?? '—'}</td><td className="p-2"><Input type="number" min="0.001" step="0.001" value={line.quantity || ''} onChange={event => patch(index, { quantity: Number(event.target.value) })} /></td><td className="p-2 text-right font-mono text-xs font-semibold text-emerald-600">{line.productId ? `${availableOf(line.productId)} ${product?.unit ?? ''}` : '—'}</td><td className="p-2"><label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-600"><input type="checkbox" checked={line.immediateConsumption} onChange={event => patch(index, { immediateConsumption: event.target.checked })} className="h-4 w-4 accent-brand" />Inmediato</label></td><td className="p-2 text-center"><button type="button" aria-label="Quitar insumo" onClick={() => setMaterials(current => current.length === 1 ? current : current.filter((_, position) => position !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr> })}</tbody></table></div></section></form></Dialog>
}
