import { ChevronDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import type { ProductBase, Unit } from '../../products/types/product.types'
import type { ImportCatalog } from '../services/import-api.service'
import { calculateImportLineSubtotal } from '../utils/import-line-calculator'

export type WeightDraft = { attributeId?: string; name: string; unit: string; value: number }
export type VariableDraft = { name: string; values: Record<string, string>; unit: string; factor: number; minimumStock: number; stock: number; roles: ProductBase['roles']; weight?: WeightDraft }
export type ImportDraftLine = { productId: string; presentationId: string; variableSubcategoryId: string; variableDraft?: VariableDraft; isVariable: boolean; warehouseId: string; quantity: number; unitCostUsd: number; weight?: WeightDraft }
export const createImportLine = (warehouseId = ''): ImportDraftLine => ({ productId: '', presentationId: '', variableSubcategoryId: '', isVariable: false, warehouseId, quantity: 0, unitCostUsd: 0 })

const variableSubcategoryPrefix = '__variable_subcategory__:'
const money = (value: number) => value.toFixed(2)
const selectClass = 'h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand'
type PickerItem = { id: string; title: string; detail?: string }

const toNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function CatalogPicker({ items, value, onChange, label, disabled = false, clearSelectionOnInput = true }: { items: PickerItem[]; value: string; onChange: (id: string) => void; label: string; disabled?: boolean; clearSelectionOnInput?: boolean }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find(item => item.id === value)
  const filtered = items.filter(item => (item.title + (item.detail ?? '')).toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const tableContainer = ref.current?.closest('section')?.querySelector(':scope > div') as HTMLElement | null
    if (tableContainer) tableContainer.style.overflow = 'visible'
  }, [])
  useEffect(() => { setQuery(selected?.title ?? '') }, [selected?.title])
  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return <div ref={ref} className="relative"><div className={disabled ? 'flex h-10 items-center rounded-md border border-border bg-slate-50 px-3 opacity-60' : open ? 'flex h-10 items-center rounded-md border border-brand bg-white px-3 ring-1 ring-brand' : 'flex h-10 items-center rounded-md border border-border bg-white px-3'}><Search className="mr-2 h-4 w-4 text-slate-400" /><input disabled={disabled} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); if (clearSelectionOnInput) onChange(''); setOpen(true) }} placeholder={`Buscar ${label}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button disabled={disabled} type="button" onClick={() => setOpen(current => !current)}><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>{open && !disabled && <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel"><p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase text-muted">{filtered.length} resultado(s)</p><div className="max-h-56 overflow-y-auto">{filtered.map(item => <button type="button" key={item.id} onClick={() => { onChange(item.id); setOpen(false) }} className="flex w-full gap-3 px-3 py-2.5 text-left hover:bg-blue-50"><span className="rounded bg-blue-50 px-2 py-1.5 text-[10px] font-bold text-brand">{item.title.slice(0, 3).toUpperCase()}</span><span><span className="block text-sm font-medium">{item.title}</span>{item.detail && <span className="text-xs text-muted">{item.detail}</span>}</span></button>)}{!filtered.length && <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>}</div></div>}</div>
}

type Props = { catalog: ImportCatalog; units: Unit[]; currency: 'USD' | 'PEN'; lines: ImportDraftLine[]; onChange: (lines: ImportDraftLine[]) => void; onConfigureVariable: (index: number, subcategoryId: string) => void; onToggleVariableEditor: (index: number) => void; renderVariableEditor: (index: number) => ReactNode }
export function lineWeight(line: ImportDraftLine) { return line.isVariable ? line.variableDraft?.weight : line.weight }
export function lineSubtotal(line: ImportDraftLine) { const weight = lineWeight(line); return calculateImportLineSubtotal({ calculationType: weight ? 'WEIGHT_BASED' : 'STANDARD', weight: weight?.value, quantity: line.quantity, unitCostUsd: line.unitCostUsd }) }

export function ImportProductLines({ catalog, units, currency, lines, onChange, onConfigureVariable, onToggleVariableEditor, renderVariableEditor }: Props) {
  const [weightEditorIndex, setWeightEditorIndex] = useState<number | null>(null)
  const patch = (index: number, value: Partial<ImportDraftLine>) => onChange(lines.map((line, position) => position === index ? { ...line, ...value } : line))
  const productFor = (line: ImportDraftLine) => catalog.products.find(product => product.id === line.productId)
  const presentationFor = (line: ImportDraftLine) => productFor(line)?.presentations.find(presentation => presentation.id === line.presentationId)
  const weightForProduct = (productId: string, presentationId: string): WeightDraft | undefined => {
    const product = catalog.products.find(value => value.id === productId)
    const presentation = product?.presentations.find(value => value.id === presentationId)
    const attribute = product?.attributes.find(value => value.isWeight)
    return attribute ? { attributeId: attribute.id, name: attribute.name, unit: attribute.suffix ?? '', value: toNumber(presentation?.attributeValues?.[attribute.id]) } : undefined
  }
  const pickerItems = (line: ImportDraftLine): PickerItem[] => [
    ...catalog.products.map(product => ({ id: product.id, title: product.name })),
    ...catalog.variableSubcategories.map(subcategory => ({ id: `${variableSubcategoryPrefix}${subcategory.id}`, title: line.isVariable && line.variableSubcategoryId === subcategory.id && line.variableDraft ? line.variableDraft.name : subcategory.name, detail: `Producto variable · ${subcategory.category.name}${subcategory.code ? ` · ${subcategory.code}` : ''}` })),
  ]
  const total = lines.reduce((sum, line) => sum + lineSubtotal(line), 0)
  const currencySymbol = currency === 'PEN' ? 'S/' : 'USD'
  const patchWeight = (index: number, value: number) => {
    const line = lines[index]
    const weight = lineWeight(line)
    if (!weight) return
    if (line.isVariable && line.variableDraft) patch(index, { variableDraft: { ...line.variableDraft, weight: { ...weight, value } } })
    else patch(index, { weight: { ...weight, value } })
  }
  const selectProduct = (index: number, selection: string) => {
    if (selection.startsWith(variableSubcategoryPrefix)) {
      const variableSubcategoryId = selection.slice(variableSubcategoryPrefix.length)
      patch(index, { productId: '', presentationId: '', variableSubcategoryId, variableDraft: undefined, weight: undefined, isVariable: true })
      setWeightEditorIndex(null)
      onConfigureVariable(index, variableSubcategoryId)
      return
    }
    const product = catalog.products.find(value => value.id === selection)
    const presentationId = product?.presentations[0]?.id ?? ''
    patch(index, { productId: selection, presentationId, variableSubcategoryId: '', variableDraft: undefined, weight: weightForProduct(selection, presentationId), isVariable: false })
    setWeightEditorIndex(null)
    onConfigureVariable(index, '')
  }

  return <section className="mt-4">
    <h3 className="mb-2 text-[15px] font-semibold text-ink">Productos</h3>
    <div className="relative overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[820px] text-left">
        <thead><tr className="bg-[#f7f9fc] text-[11px] font-semibold uppercase tracking-[.35px] text-muted">{['Producto', 'Almacén', 'UM', 'Cant.', 'Costo unit.', 'Subtotal', ''].map(header => <th className="border-b border-border px-3 py-2" key={header}>{header}</th>)}</tr></thead>
        <tbody>{lines.map((line, index) => {
          const weight = lineWeight(line)
          const subtotal = lineSubtotal(line)
          const variableEditor = renderVariableEditor(index)
          return <Fragment key={index}>
            <tr className="border-b border-border">
              <td className="min-w-[280px] p-2"><div className="relative"><div className="flex items-center gap-1.5"><div className="min-w-0 flex-1"><CatalogPicker label="producto" items={pickerItems(line)} value={line.isVariable && line.variableSubcategoryId ? `${variableSubcategoryPrefix}${line.variableSubcategoryId}` : line.productId} disabled={line.isVariable && Boolean(line.variableDraft)} onChange={selection => selectProduct(index, selection)} /></div>{weight && <button type="button" onClick={() => setWeightEditorIndex(current => current === index ? null : index)} aria-label={`Editar ${weight.name}`} title={`Editar ${weight.name}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-xs font-bold text-brand transition hover:bg-blue-100">P</button>}{line.isVariable && line.variableSubcategoryId && <button type="button" onClick={() => onToggleVariableEditor(index)} aria-label="Editar atributos del producto variable" title="Editar atributos" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-brand transition hover:bg-blue-100"><Pencil className="h-4 w-4" /></button>}</div>{weight && weightEditorIndex === index && <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 rounded-lg border border-blue-200 bg-white p-3 shadow-panel"><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-semibold text-ink">{weight.name}</p><p className="text-[11px] text-muted">Unidad: {weight.unit || 'sin unidad'}</p></div><button type="button" onClick={() => setWeightEditorIndex(null)} className="text-xs font-semibold text-brand">Listo</button></div><Input autoFocus type="number" min="0" step="any" value={weight.value || ''} placeholder={weight.unit ? `Peso en ${weight.unit}` : 'Peso'} onFocus={event => event.currentTarget.select()} onChange={event => patchWeight(index, Number(event.target.value) || 0)} /></div>}</div></td>
              <td className="p-2"><select className={selectClass} value={line.warehouseId} onChange={event => patch(index, { warehouseId: event.target.value })}>{catalog.warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></td>
              <td className="min-w-[190px] p-2">{line.isVariable && line.variableDraft ? <CatalogPicker label="unidad" items={units.filter(unit => unit.status === 'Activo').map(unit => ({ id: unit.code, title: unit.description, detail: unit.code }))} value={line.variableDraft.unit} clearSelectionOnInput={false} onChange={unit => patch(index, { variableDraft: { ...line.variableDraft!, unit } })} /> : <Input value={line.isVariable ? '' : presentationFor(line)?.unit.description ?? presentationFor(line)?.unit.code ?? ''} placeholder="UM" readOnly />}</td>
              <td className="p-2"><Input type="number" min="0" step="any" value={line.quantity || ''} placeholder="0" onFocus={event => event.currentTarget.select()} onChange={event => patch(index, { quantity: Number(event.target.value) || 0 })} /></td>
              <td className="p-2">{weight && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[.35px] text-brand">Costo por {weight.unit || 'unidad'}</span>}<Input type="number" min="0" step="0.0001" value={line.unitCostUsd || ''} placeholder="0.00" onFocus={event => event.currentTarget.select()} onChange={event => patch(index, { unitCostUsd: Number(event.target.value) || 0 })} /></td>
              <td className="p-2 font-mono text-sm text-amber-600">{currencySymbol} {money(subtotal)}</td>
              <td className="p-2 text-center"><Button type="button" variant="outline" size="icon" className="border-red-300 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600" aria-label="Eliminar producto" onClick={() => onChange(lines.length > 1 ? lines.filter((_, position) => position !== index) : lines)}><Trash2 className="h-4 w-4" /></Button></td>
            </tr>
            {variableEditor && <tr className="border-b border-blue-200 bg-blue-50/60"><td colSpan={7} className="px-2 pb-2"><div className="min-w-[780px]"><VariableEditorInline editor={variableEditor} /></div></td></tr>}
          </Fragment>
        })}</tbody>
      </table>
    </div>
    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onChange([...lines, createImportLine(catalog.warehouses[0]?.id ?? '')])}><Plus className="h-3.5 w-3.5" />Agregar producto</Button>
    <div className="mt-4 text-right"><span className="mr-1 text-xs font-semibold text-muted">TOTAL:</span><span className="font-mono text-lg font-medium text-amber-600">{currencySymbol} {money(total)}</span></div>
  </section>
}

function VariableEditorInline({ editor }: { editor: ReactNode }) {
  return <>{editor}</>
}
