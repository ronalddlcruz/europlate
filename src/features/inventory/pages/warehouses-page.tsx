import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { createWarehouse, deleteWarehouse, listWarehouses, updateWarehouse, type Warehouse } from '../services/inventory-api.service'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.35px] text-slate-600">{label}</span>{children}</label>
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand" {...props}>{children}</select>

export function WarehousesPage() {
  const client = useQueryClient()
  const warehouses = useQuery({ queryKey: ['inventory', 'warehouses'], queryFn: listWarehouses, staleTime: 0, refetchOnMount: 'always' })
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Warehouse>()
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }
  const sync = () => Promise.all([
    client.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
  ])
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Omit<Warehouse, 'id'> }) => id ? updateWarehouse(id, payload) : createWarehouse(payload),
    onSuccess: async () => { await sync(); setModal(false); notify('Almacén guardado y sincronizado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se pudo guardar el almacén.'),
  })
  const remove = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: async () => { await sync(); notify('Almacén eliminado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se puede eliminar este almacén.'),
  })
  const rows = warehouses.data ?? []
  return <div className="mx-auto max-w-7xl"><section className="card"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Almacenes</h1><p className="mt-1 text-xs text-muted">Configura los almacenes disponibles para compras, importaciones e inventario.</p></div><Button size="sm" onClick={() => { setEditing(undefined); setModal(true) }}><Plus className="h-4 w-4" />Nuevo almacén</Button></header><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">{['Nombre', 'Ubicación', 'Descripción', 'Estado', ''].map(value => <th key={value} className="border-y border-border px-4 py-3">{value}</th>)}</tr></thead><tbody>{warehouses.isLoading ? <tr><td colSpan={5} className="p-10 text-center text-sm text-muted">Cargando almacenes…</td></tr> : rows.length ? rows.map(item => <tr className="border-b border-border text-[13px]" key={item.id}><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.location ?? '—'}</td><td className="px-4 py-3">{item.description ?? '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span></td><td className="px-4 py-3 text-right"><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded border border-border" aria-label={`Editar ${item.name}`} onClick={() => { setEditing(item); setModal(true) }}><Pencil className="h-3.5 w-3.5" /></button><button type="button" className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600" aria-label={`Eliminar ${item.name}`} onClick={() => { if (window.confirm(`¿Eliminar el almacén ${item.name}?`)) remove.mutate(item.id) }}><Trash2 className="h-3.5 w-3.5" /></button></td></tr>) : <tr><td colSpan={5} className="p-10 text-center text-sm text-muted">Aún no hay almacenes registrados.</td></tr>}</tbody></table></div></section>{modal && <WarehouseDialog item={editing} saving={save.isPending} onClose={() => setModal(false)} onSave={payload => save.mutate({ id: editing?.id, payload })} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}

function WarehouseDialog({ item, saving, onClose, onSave }: { item?: Warehouse; saving: boolean; onClose: () => void; onSave: (payload: Omit<Warehouse, 'id'>) => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [location, setLocation] = useState(item?.location ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<Warehouse['status']>(item?.status ?? 'ACTIVE')
  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim()) onSave({ name: name.trim(), location: location.trim() || null, description: description.trim() || null, status }) }
  return <Dialog open title={item ? 'Editar almacén' : 'Nuevo almacén'} onClose={onClose} footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" form="warehouse-form" disabled={!name.trim() || saving}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}><form id="warehouse-form" className="space-y-4" onSubmit={submit}><Field label="Nombre *"><Input value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Almacén principal" /></Field><Field label="Ubicación"><Input value={location} onChange={event => setLocation(event.target.value)} /></Field><Field label="Descripción"><textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] p-3 text-sm outline-none focus:border-brand" /></Field><Field label="Estado"><Select value={status} onChange={event => setStatus(event.target.value as Warehouse['status'])}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select></Field></form></Dialog>
}
