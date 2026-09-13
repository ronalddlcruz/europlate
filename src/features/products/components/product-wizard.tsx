import { useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, Check, ChevronDown, ClipboardList, Search, Sparkles, Tags } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import type { Attribute, ProductBase, ProductCategory, ProductRole, ProductStatus, ProductVariant, Unit } from '../types/product.types'

type SaveValue = { base: ProductBase; variants: ProductVariant[] }
type Option = { id: string; label: string; detail?: string }
const uid = () => crypto.randomUUID()
const roleOptions: ProductRole[] = ['Mercadería', 'Insumo', 'Producto terminado']
const cloneAttributes = (attributes: Attribute[]) => attributes.map(attribute => ({ ...attribute, id: uid() }))
const numericText = (value: number | undefined, fallback: string) => String(value ?? fallback)
const cleanNumericText = (value: string) => value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
const numericValue = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const codeSegment = (code: string | null | undefined, name: string, length = 2) => {
  const configured = code?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (configured) return configured
  const words = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().match(/[A-Z0-9]+/g) ?? []
  const initials = words.map(word => word[0]).join('')
  return (initials.length >= length ? initials : words.join('')).slice(0, length).padEnd(length, 'X')
}
const escapeExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const descriptiveSpecifications = (attributes: Attribute[], values: Record<string, string>) => {
  const groups: { suffix: string; numeric: boolean; values: string[] }[] = []
  attributes.forEach(attribute => {
    const value = values[attribute.id]?.trim()
    if (!value) return
    const suffix = attribute.suffix.trim()
    const numeric = attribute.type === 'Numérico'
    const previous = groups[groups.length - 1]
    if (numeric && suffix && previous?.numeric && previous.suffix === suffix) {
      previous.values.push(value)
      return
    }
    groups.push({ suffix, numeric, values: [value] })
  })
  return groups.map(group => group.values.map(value => `${value}${group.suffix ? ` ${group.suffix}` : ''}`).join(' x ')).join(' · ')
}

export function ProductWizard({ item, variants: initialVariants = [], products, categories, units, onClose, onSave }: { item?: ProductBase; variants?: ProductVariant[]; products: ProductBase[]; categories: ProductCategory[]; units: Unit[]; onClose: () => void; onSave: (value: SaveValue) => void | Promise<void> }) {
  const initialVariant = initialVariants[0]
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId ?? '')
  const [roles, setRoles] = useState<ProductRole[]>(item?.roles?.length ? item.roles : ['Mercadería'])
  const [status, setStatus] = useState<ProductStatus>(item?.status ?? 'Activo')
  const [attributes, setAttributes] = useState<Attribute[]>(item?.attributes ?? [])
  const [values, setValues] = useState<Record<string, string>>(initialVariant?.values ?? {})
  const [unit, setUnit] = useState(initialVariant?.unit ?? units.find(candidate => candidate.status === 'Activo')?.code ?? '')
  const [factor, setFactor] = useState(numericText(initialVariant?.factor, '1'))
  const [minimum, setMinimum] = useState(numericText(initialVariant?.minimum, '0'))
  const [stock, setStock] = useState(numericText(initialVariant?.stock, '0'))
  const [automaticDescription, setAutomaticDescription] = useState(true)
  const [manualDescription, setManualDescription] = useState(item?.name ?? '')
  const [error, setError] = useState('')
  const activeCategories = categories.filter(category => category.status === 'Activo')
  const category = activeCategories.find(candidate => candidate.id === categoryId)
  const subcategories = category?.subcategories.filter(candidate => candidate.status === 'Activo') ?? []
  const subcategory = subcategories.find(candidate => candidate.id === subcategoryId)
  const activeUnits = units.filter(candidate => candidate.status === 'Activo')
  const generatedDescription = useMemo(() => {
    const base = subcategory?.name ?? category?.name ?? item?.name ?? 'Producto'
    const specification = descriptiveSpecifications(attributes, values)
    return [base, specification].filter(Boolean).join(' · ')
  }, [attributes, category?.name, item?.name, subcategory?.name, values])
  const description = automaticDescription ? generatedDescription : manualDescription
  const codePreview = useMemo(() => {
    if (item?.code) return item.code
    if (!category) return '—'
    const prefix = `${codeSegment(category.code, category.name)}-${subcategory ? codeSegment(subcategory.code, subcategory.name) : 'GEN'}`
    const expression = new RegExp(`^${escapeExpression(prefix)}-(\\d+)$`)
    const sequence = products.reduce((maximum, product) => Math.max(maximum, Number(product.code.match(expression)?.[1]) || 0), 0) + 1
    return `${prefix}-${String(sequence).padStart(3, '0')}`
  }, [category, item?.code, products, subcategory])
  const selectCategory = (id: string) => { const next = activeCategories.find(candidate => candidate.id === id); setCategoryId(id); setSubcategoryId(''); setAttributes(next ? cloneAttributes(next.attributes) : []); setValues({}) }
  const selectSubcategory = (id: string) => { const next = subcategories.find(candidate => candidate.id === id); setSubcategoryId(id); setAttributes(cloneAttributes([...(category?.attributes ?? []), ...(next?.attributes ?? [])])); setValues({}) }
  const toggleRole = (role: ProductRole) => setRoles(current => current.includes(role) ? current.filter(candidate => candidate !== role) : [...current, role])
  const submit = async () => {
    if (!category) return setError('Selecciona una categoría.')
    if (subcategories.length && !subcategory) return setError('Selecciona un tipo o subcategoría.')
    if (!roles.length) return setError('Selecciona al menos un uso para el producto.')
    if (!unit) return setError('Selecciona una unidad de inventario.')
    const missing = attributes.find(attribute => attribute.required && !values[attribute.id]?.trim())
    if (missing) return setError(`Completa el atributo obligatorio: ${missing.name}.`)
    if (!description.trim()) return setError('Completa la identificación comercial del producto.')
    setError('')
    const base: ProductBase = { id: item?.id ?? uid(), code: item?.code ?? '', name: description, categoryId: category.id, categoryName: category.name, subcategoryId: subcategory?.id ?? null, subcategoryName: subcategory?.name ?? null, roles, status, variantType: 'Básico', immediateConsumption: !roles.includes('Insumo'), attributes }
    const variant: ProductVariant = { id: initialVariant?.id ?? uid(), baseId: base.id, code: initialVariant?.code ?? '', name: description, values, unit, factor: Math.max(0.001, numericValue(factor, 1)), minimum: Math.max(0, numericValue(minimum, 0)), stock: Math.max(0, numericValue(stock, 0)), status }
    await onSave({ base, variants: [variant] })
  }
  return <Dialog open wide title={item ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => void submit()}>Guardar producto</Button></>}>
    <form onSubmit={event => { event.preventDefault(); void submit() }} className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-[#f6f9ff] px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white shadow-sm"><Boxes className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-ink">Registro rápido de catálogo</p><p className="text-xs text-muted">La categoría define los atributos; completa una sola ficha para registrar el producto.</p></div></div>
      <Section number="1" title="Clasificación" icon={Tags} required><div className="grid gap-4 md:grid-cols-2"><Field label="Categoría *"><SearchCombo value={categoryId} options={activeCategories.map(candidate => ({ id: candidate.id, label: candidate.name, detail: candidate.code ?? undefined }))} placeholder="Buscar categoría…" onChange={selectCategory} /></Field><Field label={`Subcategoría${subcategories.length ? ' *' : ''}`}><SearchCombo value={subcategoryId} disabled={!category} options={subcategories.map(candidate => ({ id: candidate.id, label: candidate.name, detail: candidate.code ?? undefined }))} placeholder={category ? 'Buscar tipo…' : 'Primero selecciona categoría'} onChange={selectSubcategory} /></Field></div><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-4"><span className="mr-2 text-xs font-semibold uppercase tracking-[.35px] text-slate-500">Uso del producto *</span>{roleOptions.map(role => <button key={role} type="button" onClick={() => toggleRole(role)} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${roles.includes(role) ? 'border-brand bg-blue-50 text-brand shadow-sm' : 'border-border bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${roles.includes(role) ? 'bg-brand text-white' : 'border border-slate-300 bg-white'}`}>{roles.includes(role) && <Check className="h-3 w-3" />}</span>{role}</button>)}<select aria-label="Estado" value={status} onChange={event => setStatus(event.target.value as ProductStatus)} className="ml-auto h-9 rounded-md border border-border bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"><option>Activo</option><option>Inactivo</option></select></div></Section>
      <Section number="2" title="Especificaciones" icon={ClipboardList} tag={category ? `Atributos de ${[category.name, subcategory?.name].filter(Boolean).join(' + ')}` : undefined}>{!category ? <Empty text="Selecciona una categoría para cargar sus atributos." /> : !attributes.length ? <Empty text="Esta categoría no tiene atributos configurados." /> : <div className="grid gap-4 md:grid-cols-3">{attributes.map(attribute => <Field key={attribute.id} label={`${attribute.name}${attribute.required ? ' *' : ''}`}><Input required={attribute.required} type={attribute.type === 'Numérico' ? 'number' : 'text'} value={values[attribute.id] ?? ''} onChange={event => setValues(current => ({ ...current, [attribute.id]: event.target.value }))} placeholder={attribute.suffix ? `En ${attribute.suffix}` : `Ingresa ${attribute.name.toLowerCase()}`} /><p className="mt-1.5 pl-1 text-xs text-muted">{attribute.type}{attribute.suffix ? ` · ${attribute.suffix}` : ''}</p></Field>)}</div>}</Section>
      <Section number="3" title="Identificación comercial" icon={Sparkles}><div className="overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-emerald-100 px-4 py-2"><span className="mr-auto flex items-center gap-2 text-xs font-semibold text-emerald-800"><Sparkles className="h-3.5 w-3.5" />Descripción {automaticDescription ? 'generada automáticamente' : 'manual'}</span><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-900"><input type="checkbox" checked={automaticDescription} onChange={event => { const automatic = event.target.checked; if (!automatic) setManualDescription(generatedDescription); setAutomaticDescription(automatic) }} className="h-4 w-4 accent-emerald-600" />Automática</label><span className="hidden h-4 w-px bg-emerald-200 sm:block" /><span className="text-xs text-emerald-800"><span className="mr-2 font-semibold uppercase tracking-[.35px]">Código interno</span><code className="font-mono font-bold tracking-wide text-emerald-950">{codePreview}</code></span></div>{automaticDescription ? <p className="px-4 py-3 text-sm font-semibold text-emerald-950">{description}</p> : <div className="p-3"><Input value={manualDescription} onChange={event => setManualDescription(event.target.value)} placeholder="Escribe el nombre comercial del producto" className="border-emerald-200 bg-white" /></div>}</div><p className="mt-2 text-right text-xs text-muted">{item?.code ? 'Código asignado al producto.' : 'Vista previa según categoría y tipo.'}</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Unidad de inventario *"><SearchCombo value={unit} options={activeUnits.map(candidate => ({ id: candidate.code, label: candidate.code, detail: candidate.description }))} placeholder="Buscar unidad…" onChange={setUnit} /></Field><NumericField label="Factor de conversión" value={factor} initialValue="1" onChange={setFactor} /><NumericField label="Stock mínimo" value={minimum} initialValue="0" onChange={setMinimum} /><NumericField label="Stock actual" value={stock} initialValue="0" onChange={setStock} /></div></Section>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </form>
  </Dialog>
}

function SearchCombo({ value, options, placeholder, disabled, onChange }: { value: string; options: Option[]; placeholder: string; disabled?: boolean; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.id === value); const visible = options.filter(option => `${option.label} ${option.detail ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])
  return <div ref={ref} className="relative"><div className={`flex h-11 items-center rounded-md border bg-white px-3 shadow-sm transition-all ${open ? 'border-brand ring-2 ring-blue-100' : 'border-border hover:border-blue-200'} ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-70' : ''}`}><Search className="mr-2 h-4 w-4 text-slate-400" /><input disabled={disabled} value={open ? query : selected?.label ?? ''} onFocus={() => { setQuery(''); setOpen(true) }} onChange={event => { setQuery(event.target.value); setOpen(true) }} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-slate-400 disabled:cursor-not-allowed" /><button type="button" disabled={disabled} onClick={() => setOpen(current => !current)} aria-label={`Mostrar ${placeholder}`} className="rounded p-1 hover:bg-slate-100"><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>{open && !disabled && <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-white shadow-panel"><p className="border-b border-border bg-[#f8fbff] px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">Resultados · {visible.length}</p><div className="max-h-52 overflow-y-auto">{visible.length ? visible.map(option => <button type="button" key={option.id} onClick={() => { onChange(option.id); setQuery(''); setOpen(false) }} className="flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"><span className="min-w-0"><span className="block text-sm font-medium">{option.label}</span>{option.detail && <span className="block text-xs text-muted">{option.detail}</span>}</span></button>) : <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>}</div></div>}</div>
}
function NumericField({ label, value, initialValue, onChange }: { label: string; value: string; initialValue: string; onChange: (value: string) => void }) { return <Field label={label}><Input inputMode="decimal" value={value} onFocus={() => { if (value === initialValue) onChange('') }} onChange={event => onChange(cleanNumericText(event.target.value))} onBlur={() => { if (!value.trim()) onChange(initialValue) }} /></Field> }
function Section({ number, title, icon: Icon, required, tag, children }: { number: string; title: string; icon: typeof Boxes; required?: boolean; tag?: string; children: React.ReactNode }) { return <section className="rounded-xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.025)]"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-brand"><Icon className="h-4 w-4" /></span><div><h2 className="text-[15px] font-semibold text-ink"><span className="mr-1.5 text-brand">{number}.</span>{title}</h2><p className="mt-0.5 text-xs text-muted">{number === '1' ? 'Define la clasificación y su uso operativo.' : number === '2' ? 'Valores que identifican esta presentación.' : 'Vista previa y reglas de inventario.'}</p></div></div>{tag ? <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">{tag}</span> : required ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Obligatorio</span> : null}</header>{children}</section> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>{children}</label> }
function Empty({ text }: { text: string }) { return <p className="rounded-lg border border-dashed border-blue-200 bg-[#f8fbff] px-4 py-5 text-center text-sm text-muted">{text}</p> }
