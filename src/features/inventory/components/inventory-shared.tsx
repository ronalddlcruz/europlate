import { Plus,Search } from 'lucide-react'
import { useEffect,useRef,useState } from 'react'
import { Button } from '../../../components/ui/button'
import { type CatalogCustomer,type CatalogProduct,type Warehouse } from '../services/inventory-api.service'

export type Tab = 'stock' | 'movements' | 'transfers' | 'adjustments'

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" {...props}>{children}</select>

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.35px] text-slate-600">{label}</span>{children}</label>

export function Header({ title, action, onAction, actionDisabled = false }: { title: string; action?: string; onAction?: () => void; actionDisabled?: boolean }) { return <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">{title}</h1>{title === 'Transferencia entre Almacenes' && <p className="mt-1 text-xs text-muted">Mueve existencias entre almacenes manteniendo su trazabilidad.</p>}</div>{action && <Button size="sm" onClick={onAction} disabled={actionDisabled}><Plus className="h-4 w-4" />{action}</Button>}</header> }

export function StockAmount({ quantity, unitName, factor }: { quantity: number; unitName: string; factor: number }) {
  const display = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })
  if (factor === 1) return <>{display.format(quantity)} {unitName}</>
  return <span className="inline-flex w-max flex-col items-center whitespace-nowrap leading-tight"><span className="whitespace-nowrap">{display.format(quantity / factor)} {unitName}</span><span className="mt-0.5 whitespace-nowrap text-[11px] font-normal text-slate-500">({display.format(quantity)} und.)</span></span>
}

export type SearchPickerItem = { id: string; title: string; detail?: string }

export function SearchPicker({ items, value, onChange, placeholder, empty }: { items: SearchPickerItem[]; value: string; onChange: (id: string) => void; placeholder: string; empty: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(item => item.id === value)
  const filtered = items.filter(item => `${item.title} ${item.detail ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))

  useEffect(() => { if (selected?.title) setQuery(selected.title) }, [selected?.title])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selected?.title ?? '')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [selected?.title])

  return <div ref={ref} className="relative"><div className={`flex h-10 items-center rounded-md border bg-[#f4f7fb] px-3 transition ${open ? 'border-brand bg-white ring-1 ring-brand' : 'border-border'}`}><Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" /><input value={query} onFocus={() => { setQuery(''); setOpen(true) }} onChange={event => { setQuery(event.target.value); if (value) onChange(''); setOpen(true) }} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" /><button type="button" onClick={() => { setQuery(open ? (selected?.title ?? '') : ''); setOpen(current => !current) }} aria-label={`Mostrar ${placeholder}`} className="ml-2 text-slate-400">⌄</button></div>{open && <div className="absolute z-[60] mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel"><p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">Resultados · {filtered.length}</p><div className="max-h-56 overflow-y-auto">{filtered.map(item => <button type="button" key={item.id} onClick={() => { onChange(item.id); setOpen(false) }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50">{item.detail && <span className="rounded bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-brand">{item.detail}</span>}<span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.title}</span></button>)}{!filtered.length && <p className="p-4 text-center text-sm text-muted">{empty}</p>}</div></div>}</div>
}

export function ProductPicker({ products, value, onChange }: { products: CatalogProduct[]; value: string; onChange: (id: string) => void }) { return <SearchPicker items={products.map(product => ({ id: product.id, title: product.name, detail: product.code }))} value={value} onChange={onChange} placeholder="Buscar producto..." empty="No se encontraron productos." /> }

export function WarehousePicker({ warehouses, value, onChange, placeholder }: { warehouses: Warehouse[]; value: string; onChange: (id: string) => void; placeholder: string }) { return <SearchPicker items={warehouses.map(warehouse => ({ id: warehouse.id, title: warehouse.name }))} value={value} onChange={onChange} placeholder={placeholder} empty="No se encontraron almacenes." /> }

export function CustomerPicker({ customers, value, onChange }: { customers: CatalogCustomer[]; value: string; onChange: (id: string) => void }) { return <SearchPicker items={customers.map(customer => ({ id: customer.id, title: customer.name }))} value={value} onChange={onChange} placeholder="Buscar cliente..." empty="No se encontraron clientes." /> }

export function InventoryMetric({ label, value, detail, tone, highlightDetail = false }: { label: string; value: string | number; detail: string; tone: 'blue' | 'slate' | 'green' | 'amber'; highlightDetail?: boolean }) {
  const colors = { blue: 'border-blue-100 bg-blue-50 text-blue-700', slate: 'border-slate-200 bg-slate-50 text-slate-700', green: 'border-emerald-100 bg-emerald-50 text-emerald-700', amber: 'border-amber-100 bg-amber-50 text-amber-700' }
  return <div className={`inventory-metric min-w-0 px-4 py-3.5 ${colors[tone]}`}><p className="text-[10px] font-semibold uppercase tracking-[.55px]">{label}</p><p className="mt-1 text-xl font-bold text-ink">{value}</p><p className={`mt-1 ${highlightDetail ? 'text-sm font-semibold text-ink' : 'text-[11px] opacity-80'}`}>{detail}</p></div>
}
