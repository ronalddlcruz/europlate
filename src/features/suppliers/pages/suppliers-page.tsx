import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { createSupplier, deleteSupplier, listSuppliers, type Supplier, type SupplierStatus, type SupplierType, updateSupplier } from '../services/supplier-api.service'

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand" {...props}>{children}</select>
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>
const sortSuppliers = (items: Supplier[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))

export function SuppliersPage() {
  const queryClient = useQueryClient()
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers })
  const suppliers = suppliersQuery.data ?? []
  const [modalItem, setModalItem] = useState<Supplier | null | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const saveMutation = useMutation({
    mutationFn: ({ item, editing }: { item: Omit<Supplier, 'id'>; editing?: Supplier }) => editing ? updateSupplier(editing.id, item) : createSupplier(item),
    onSuccess: (saved) => {
      queryClient.setQueryData<Supplier[]>(['suppliers'], current => sortSuppliers([...(current ?? []).filter(item => item.id !== saved.id), saved]))
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setSearch(''); setModalItem(undefined); notify('Proveedor guardado y sincronizado con la base de datos')
    },
    onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo guardar el proveedor'),
  })
  const removeMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: (_, id) => { queryClient.setQueryData<Supplier[]>(['suppliers'], current => current?.filter(item => item.id !== id) ?? []); void queryClient.invalidateQueries({ queryKey: ['suppliers'] }); notify('Proveedor eliminado de la base de datos') },
    onError: (error) => notify(error instanceof Error ? error.message : 'No se pudo eliminar el proveedor'),
  })
  const filtered = useMemo(() => suppliers.filter(supplier => `${supplier.name} ${supplier.document} ${supplier.email}`.toLowerCase().includes(search.toLowerCase())), [suppliers, search])

  return <div className="mx-auto max-w-none"><section className="rounded-[10px] border border-border bg-white p-6 shadow-card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Proveedores</h1><p className="mt-1 text-xs text-muted">Empresas y contactos registrados para compras nacionales e importaciones.</p></div><Button size="sm" onClick={() => setModalItem(null)}><Plus className="h-4 w-4" />Nuevo Proveedor</Button></header><div className="relative mt-5 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><Input className="h-9 pl-9" placeholder="Buscar proveedor o RUC…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['Razón social', 'RUC / Tax ID', 'Tipo', 'Estado', ''].map(value => <th className="border-y border-border px-4 py-3 font-semibold" key={value}>{value}</th>)}</tr></thead><tbody>{suppliersQuery.isLoading ? <tr><td colSpan={5} className="p-10 text-center text-sm text-muted">Cargando proveedores desde la base de datos…</td></tr> : suppliersQuery.isError ? <tr><td colSpan={5} className="p-10 text-center text-sm text-red-600">No se pudieron cargar los proveedores.</td></tr> : filtered.length ? filtered.map(supplier => <tr key={supplier.id} className="border-b border-border text-[13px] text-slate-700"><td className="px-4 py-3.5 font-medium">{supplier.name}</td><td className="px-4 py-3.5 font-mono text-xs">{supplier.document || '—'}</td><td className="px-4 py-3.5"><TypeBadge type={supplier.type} /></td><td className="px-4 py-3.5"><StatusBadge status={supplier.status} /></td><td className="px-4 py-3.5 text-right"><IconButton label="Editar proveedor" onClick={() => setModalItem(supplier)}><Pencil className="h-3.5 w-3.5" /></IconButton><IconButton label="Eliminar proveedor" danger onClick={() => removeMutation.mutate(supplier.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton></td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-sm text-muted">No se encontraron proveedores.</td></tr>}</tbody></table></div></section>{modalItem !== undefined && <SupplierDialog item={modalItem ?? undefined} onClose={() => setModalItem(undefined)} onSave={async item => { await saveMutation.mutateAsync({ item, editing: modalItem ?? undefined }).catch(() => undefined) }} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}

function SupplierDialog({ item, onClose, onSave }: { item?: Supplier; onClose: () => void; onSave: (supplier: Omit<Supplier, 'id'>) => Promise<void> }) {
  const [type, setType] = useState<SupplierType>(item?.type ?? 'Nacional'); const [name, setName] = useState(item?.name ?? ''); const [document, setDocument] = useState(item?.document ?? ''); const [phone, setPhone] = useState(item?.phone ?? ''); const [email, setEmail] = useState(item?.email ?? ''); const [status, setStatus] = useState<SupplierStatus>(item?.status ?? 'Activo'); const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !document.trim()) return; setSaving(true); try { await onSave({ name: name.trim(), type, document: document.trim(), phone: phone.trim(), email: email.trim(), status }) } finally { setSaving(false) } }
  return <Dialog open title={item ? 'Editar Proveedor' : 'Nuevo Proveedor'} onClose={onClose} footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button form="supplier-form" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}><form id="supplier-form" className="grid gap-4 md:grid-cols-2" onSubmit={submit}><fieldset className="md:col-span-2"><legend className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">Tipo de proveedor *</legend><div className="flex gap-5 text-sm"><label className="flex cursor-pointer items-center gap-2"><input type="radio" checked={type === 'Nacional'} onChange={() => setType('Nacional')} />Nacional</label><label className="flex cursor-pointer items-center gap-2"><input type="radio" checked={type === 'Extranjero'} onChange={() => setType('Extranjero')} />Extranjero</label></div></fieldset><div className="md:col-span-2"><Field label="Razón Social *"><Input required value={name} onChange={event => setName(event.target.value)} /></Field></div><Field label={type === 'Nacional' ? 'RUC *' : 'NIF / Tax ID *'}><Input required value={document} onChange={event => setDocument(event.target.value)} placeholder={type === 'Nacional' ? '20000000000' : 'NIF / Tax ID'} /></Field><Field label="Teléfono"><Input value={phone} onChange={event => setPhone(event.target.value)} /></Field><Field label="Correo"><Input type="email" value={email} onChange={event => setEmail(event.target.value)} /></Field><Field label="Estado"><Select value={status} onChange={event => setStatus(event.target.value as SupplierStatus)}><option>Activo</option><option>Inactivo</option></Select></Field></form></Dialog>
}
function TypeBadge({ type }: { type: SupplierType }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${type === 'Nacional' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{type}</span> }
function StatusBadge({ status }: { status: SupplierStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{status}</span> }
function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) { return <button title={label} aria-label={label} onClick={onClick} className={`ml-1 inline-flex h-9 w-10 items-center justify-center rounded-md border ${danger ? 'border-red-300 bg-red-50 text-red-500' : 'border-border bg-white text-slate-700'}`}>{children}</button> }
