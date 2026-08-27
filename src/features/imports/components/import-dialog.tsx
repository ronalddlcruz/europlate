import { Paperclip } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { createImportLine, ImportProductLines, type ImportDraftLine } from './import-product-lines'
import type { ImportCatalog, ImportPayload, ImportRecord } from '../services/import-api.service'

const countries = ['China', 'Estados Unidos', 'Brasil', 'Chile', 'Colombia']
const fieldClassName = 'h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm text-ink outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand'
const toApiStatus = (status: ImportRecord['status']): ImportPayload['status'] => status === 'En tránsito' ? 'IN_TRANSIT' : status === 'Cancelado' ? 'CANCELLED' : 'RECEIVED'
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label> }

export function ImportDialog({ catalog, item, saving, onClose, onSave }: { catalog: ImportCatalog; item?: ImportRecord; saving: boolean; onClose: () => void; onSave: (payload: ImportPayload) => Promise<void> }) {
  const [supplierId, setSupplierId] = useState(() => item ? catalog.suppliers.find(supplier => supplier.name === item.supplier)?.id ?? '' : '')
  const [supplierName, setSupplierName] = useState(item?.supplier ?? '')
  const [country, setCountry] = useState(item?.country ?? '')
  const [container, setContainer] = useState(item?.container ?? '')
  const [dua, setDua] = useState(item?.dua ?? '')
  const [purchaseOrder, setPurchaseOrder] = useState(item?.purchaseOrder ?? '')
  const [status, setStatus] = useState<ImportRecord['status']>(item?.status ?? 'Recibido')
  const [currency, setCurrency] = useState<'USD' | 'PEN'>(item?.currency ?? 'USD')
  const [agentId, setAgentId] = useState(() => item?.customsAgent ? catalog.customsAgents.find(agent => agent.name === item.customsAgent)?.id ?? '' : '')
  const [agentName, setAgentName] = useState(item?.customsAgent ?? '')
  const [arrivalDate, setArrivalDate] = useState(item?.date ?? '')
  const [customsCostUsd, setCustomsCostUsd] = useState(item?.customsCostUsd ?? 0)
  const [customsCostPen, setCustomsCostPen] = useState(item?.customsCostPen ?? 0)
  const [lines, setLines] = useState<ImportDraftLine[]>(() => item?.lines.map(line => ({ productId: line.productId, presentationId: line.presentationId, warehouseId: line.warehouseId, quantity: line.quantity, unitCostUsd: line.unitCostUsd })) ?? [createImportLine(catalog.warehouses[0]?.id ?? '')])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity * line.unitCostUsd, 0), [lines])
  const selectSupplier = (name: string) => { setSupplierName(name); setSupplierId(catalog.suppliers.find(supplier => supplier.name === name)?.id ?? '') }
  const selectAgent = (name: string) => { setAgentName(name); setAgentId(catalog.customsAgents.find(agent => agent.name === name)?.id ?? '') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supplierId || !country.trim() || !container.trim() || !dua.trim() || !purchaseOrder.trim()) { setError('Completa los campos obligatorios y selecciona un proveedor extranjero.'); return }
    if (agentName && !agentId) { setError('Selecciona un agente de aduanas registrado o deja el campo vacío.'); return }
    if (lines.some(line => !line.productId || !line.presentationId || !line.warehouseId || line.quantity <= 0)) { setError('Completa el producto, presentación, almacén y cantidad de cada línea.'); return }
    await onSave({ supplierId, customsAgentId: agentId || null, containerNumber: container.trim(), duaNumber: dua.trim(), purchaseOrderNumber: purchaseOrder.trim(), countryOfOrigin: country.trim(), status: toApiStatus(status), currency, arrivalDate: arrivalDate || null, customsCostUsd, customsCostPen, items: lines, documents: files.map(file => ({ fileName: file.name, mimeType: file.type || undefined, size: file.size, linkUrl: `https://pending.local/imports/${encodeURIComponent(file.name)}` })) })
  }
  return <Dialog open title={item ? 'Editar Importación' : 'Nueva Importación'} onClose={onClose} extraWide footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button form="import-form" type="submit" disabled={saving}>{saving ? 'Registrando…' : item ? 'Guardar cambios' : 'Registrar Importación'}</Button></>}><form id="import-form" onSubmit={submit}><div className="grid gap-x-5 gap-y-4 md:grid-cols-2"><Field label="Proveedor extranjero *"><Input required list="foreign-suppliers" placeholder="Buscar proveedor extranjero..." value={supplierName} onChange={event => selectSupplier(event.target.value)} /></Field><Field label="País de origen *"><Input required list="country-options" placeholder="Buscar país..." value={country} onChange={event => setCountry(event.target.value)} /></Field><Field label="N° contenedor *"><Input required placeholder="ABCD1234567" value={container} onChange={event => setContainer(event.target.value)} /></Field><Field label="N° DUA *"><Input required placeholder="118-2026-10-000000" value={dua} onChange={event => setDua(event.target.value)} /></Field><Field label="N° orden de compra *"><Input required placeholder="OCI-2026-001" value={purchaseOrder} onChange={event => setPurchaseOrder(event.target.value)} /></Field><Field label="Estado"><select className={fieldClassName} value={status} onChange={event => setStatus(event.target.value as ImportRecord['status'])}><option>Recibido</option><option>En tránsito</option><option>Cancelado</option></select></Field><Field label="Moneda"><select className={fieldClassName} value={currency} onChange={event => setCurrency(event.target.value as 'USD' | 'PEN')}><option>USD</option><option>PEN</option></select></Field><Field label="Agente de Aduanas"><Input list="customs-agent-options" placeholder="Buscar agente..." value={agentName} onChange={event => selectAgent(event.target.value)} /></Field><Field label="Fecha de llegada"><Input type="date" value={arrivalDate} onChange={event => setArrivalDate(event.target.value)} /></Field><Field label="Costos desaduanaje (USD)"><Input type="number" min="0" step="0.01" placeholder="0.00" value={customsCostUsd || ''} onChange={event => setCustomsCostUsd(Number(event.target.value) || 0)} /></Field><Field label="Costos desaduanaje (PEN)"><Input type="number" min="0" step="0.01" placeholder="0.00" value={customsCostPen || ''} onChange={event => setCustomsCostPen(Number(event.target.value) || 0)} /></Field></div><datalist id="foreign-suppliers">{catalog.suppliers.map(supplier => <option key={supplier.id} value={supplier.name} />)}</datalist><datalist id="country-options">{countries.map(value => <option key={value} value={value} />)}</datalist><datalist id="customs-agent-options">{catalog.customsAgents.map(agent => <option key={agent.id} value={agent.name} />)}</datalist><ImportProductLines catalog={catalog} lines={lines} onChange={setLines} /><div className="mt-5 border-t border-border pt-5"><h3 className="mb-2 text-[15px] font-semibold text-ink">Documentos adjuntos</h3><input ref={fileInput} className="hidden" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" onChange={event => setFiles(Array.from(event.target.files ?? []))} /><Button type="button" size="sm" variant="outline" onClick={() => fileInput.current?.click()}><Paperclip className="h-3.5 w-3.5" />Adjuntar archivo</Button><p className="mt-1 text-[11px] text-muted">Se registra el enlace provisional del documento; la carga de archivos se implementará después.</p>{files.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{files.map(file => <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600" key={`${file.name}-${file.size}`}>{file.name}</span>)}</div>}</div><p className="mt-4 text-right text-xs text-muted">Mercadería: <span className="font-mono text-base font-medium text-amber-600">USD {total.toFixed(2)}</span></p>{error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}</form></Dialog>
}
