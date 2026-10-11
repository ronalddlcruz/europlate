import { CalendarDays,ChevronDown,Paperclip,Search,X } from 'lucide-react'
import { useEffect,useRef,useState } from 'react'
import { Input } from '../../../components/ui/input'
import type { ProductBase } from '../../products/types/product.types'
import { type Purchase,type PurchaseCatalog,type UploadedPurchaseDocument } from '../services/purchase-api.service'

export type VariableDraft = { name: string; values: Record<string, string>; unit: string; factor: number; minimumStock: number; stock: number; roles: ProductBase['roles'] }

export type DraftLine = { productId: string; presentationId: string; variableSubcategoryId: string; variableDraft?: VariableDraft; isVariable: boolean; warehouseId: string; quantity: number | ''; price: number | '' }

export const variableSubcategoryPrefix = '__variable_subcategory__:'

export const today = new Date().toISOString().slice(0, 10)

export const money = (amount: number) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand" {...props}>{children}</select>

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block">
<span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>

export function Status({ status }: { status: Purchase['status'] }) { const style = status === 'Recibida' ? 'bg-emerald-100 text-emerald-700' : status === 'Borrador' ? 'bg-amber-100 text-amber-700' : status === 'Aprobada' ? 'bg-blue-100 text-brand' : 'bg-red-100 text-red-700'; return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}>{status}</span> }

export function PurchaseDocumentDropzone({ inputRef, documents, uploading, error, onUpload, onRemove }: { inputRef: React.RefObject<HTMLInputElement>; documents: UploadedPurchaseDocument[]; uploading: boolean; error: string; onUpload: (file: File) => Promise<void>; onRemove: (document: UploadedPurchaseDocument) => Promise<void> }) { const [dragging, setDragging] = useState(false); const pick = (files: FileList | null) => { const file = files?.[0]; if (file) void onUpload(file) }; return <div>
<div className={`rounded-lg border-2 border-dashed p-5 text-center transition ${dragging ? 'border-brand bg-blue-50' : 'border-border bg-slate-50/60'}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files) }}>
<input ref={inputRef} type="file" className="hidden" accept="application/pdf" onChange={event => { pick(event.target.files); event.currentTarget.value = '' }} />
<Paperclip className="mx-auto h-6 w-6 text-brand" />
<p className="mt-2 text-sm font-semibold">Arrastra tu comprobante PDF aquí</p>
<p className="mt-1 text-xs text-muted">o <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-brand underline">selecciónalo desde tu equipo</button> · máximo 10 MB</p>{uploading && <p className="mt-3 text-xs font-medium text-brand">Subiendo archivo de forma segura…</p>}</div>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}{documents.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{documents.map(document => <div key={document.storageKey} className="flex items-center gap-3 rounded-md border border-border bg-white p-3">
<Paperclip className="h-5 w-5 shrink-0 text-red-500" />
<span className="min-w-0 flex-1">
<span className="block truncate text-sm font-medium">{document.fileName}</span>
<span className="text-xs text-muted">{Math.max(1, Math.round(document.size / 1024))} KB · PDF</span>
</span>
<button type="button" aria-label="Quitar archivo" onClick={() => void onRemove(document)} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
<X className="h-4 w-4" />
</button>
</div>)}</div>}</div> }

export function CatalogPicker({ items, value, onChange, label, disabled = false, clearSelectionOnInput = true }: { items: { id: string; title: string; detail?: string }[]; value: string; onChange: (id: string) => void; label: string; disabled?: boolean; clearSelectionOnInput?: boolean }) { const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null); const selected = items.find(item => item.id === value); const filtered = items.filter(item => (item.title + ' ' + (item.detail ?? '')).toLowerCase().includes(query.toLowerCase())); useEffect(() => { setQuery(selected?.title ?? '') }, [selected?.title]); useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, []); return <div ref={ref} className="relative">
<div className={disabled ? 'flex h-10 items-center rounded-md border border-border bg-slate-50 px-3 opacity-60' : open ? 'flex h-10 items-center rounded-md border border-brand bg-white px-3 ring-1 ring-brand' : 'flex h-10 items-center rounded-md border border-border bg-white px-3'}>
<Search className="mr-2 h-4 w-4 text-slate-400" />
<input disabled={disabled} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); if (clearSelectionOnInput) onChange(''); setOpen(true) }} placeholder={'Buscar ' + label + '...'} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
<button disabled={disabled} type="button" onClick={() => setOpen(current => !current)}>
<ChevronDown className="h-4 w-4 text-slate-400" />
</button>
</div>{open && !disabled && <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
<p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase text-muted">{filtered.length} resultado(s)</p>
<div className="max-h-56 overflow-y-auto">{filtered.map(item => <button type="button" key={item.id} onClick={() => { onChange(item.id); setOpen(false) }} className="flex w-full gap-3 px-3 py-2.5 text-left hover:bg-blue-50">
<span className="rounded bg-blue-50 px-2 py-1.5 text-[10px] font-bold text-brand">{item.title.slice(0, 3).toUpperCase()}</span>
<span>
<span className="block text-sm font-medium">{item.title}</span>{item.detail && <span className="text-xs text-muted">{item.detail}</span>}</span>
</button>)}{!filtered.length && <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>}</div>
</div>}</div> }

export function SupplierPicker({ suppliers, value, onChange }: { suppliers: PurchaseCatalog['suppliers']; value: string; onChange: (id: string, name: string) => void }) { const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null); const selected = suppliers.find(item => item.id === value); const filtered = suppliers.filter(item => (item.name + ' ' + (item.taxId ?? '')).toLowerCase().includes(query.toLowerCase())); useEffect(() => { setQuery(selected?.name ?? '') }, [selected?.name]); useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, []); return <div ref={ref} className="relative">
<div className={open ? 'flex h-10 items-center rounded-md border border-brand bg-white px-3 ring-1 ring-brand' : 'flex h-10 items-center rounded-md border border-border bg-white px-3'}>
<Search className="mr-2 h-4 w-4 text-slate-400" />
<input value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); onChange('', event.target.value); setOpen(true) }} placeholder="Buscar proveedor nacional..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
<button type="button" onClick={() => setOpen(current => !current)}>
<ChevronDown className="h-4 w-4 text-slate-400" />
</button>
</div>{open && <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
<p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase text-muted">Proveedores · {filtered.length} resultado(s)</p>
<div className="max-h-64 overflow-y-auto">{filtered.map(supplier => <button type="button" key={supplier.id} onClick={() => { onChange(supplier.id, supplier.name); setOpen(false) }} className="flex w-full gap-3 px-3 py-2.5 text-left hover:bg-blue-50">
<span className="rounded bg-blue-50 px-2 py-1.5 text-[10px] font-bold text-brand">{supplier.name.slice(0, 3).toUpperCase()}</span>
<span>
<span className="block text-sm font-medium">{supplier.name}</span>
<span className="text-xs text-muted">{supplier.taxId ?? 'Sin RUC'}</span>
</span>
</button>)}{!filtered.length && <p className="p-4 text-center text-sm text-muted">No se encontraron proveedores.</p>}</div>
</div>}</div> }

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}>
<div className="relative">
<Input type="date" value={value} onChange={event => onChange(event.target.value)} className="pr-10" />
<CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
</div>
</Field> }
