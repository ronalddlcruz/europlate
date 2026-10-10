import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { matchesProductSearch } from '../../../lib/product-search'
import { useAuth } from '../../auth/hooks/use-auth'
import { departments, peruLocations } from '../data/peru-locations'
import {
  createWarehouse, deleteWarehouse, listWarehouseResponsibles, listWarehouses,
  updateWarehouse, type Warehouse, type WarehouseResponsible,
} from '../services/inventory-api.service'

type WarehousePayload = Omit<Warehouse, 'id' | 'responsible'>
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.35px] text-slate-600">{label}</span>
    {children}
  </label>
)
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white" {...props}>{children}</select>
)

function LocationPicker({ options, value, onChange, placeholder, disabled = false }: {
  options: string[]; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const visible = options.filter(option => normalize(option).includes(normalize(query)))
  useEffect(() => setQuery(value), [value])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(value) }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [value])
  const fieldClass = 'flex h-10 items-center rounded-md border px-3 ' +
    (disabled ? 'cursor-not-allowed border-border bg-slate-100' : open ? 'border-brand bg-white ring-1 ring-brand' : 'border-border bg-[#f4f7fb]')
  return <div ref={root} className="relative">
    <div className={fieldClass}>
      <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
      <input disabled={disabled} value={query} onFocus={() => { setQuery(''); setOpen(true) }}
        onChange={event => { setQuery(event.target.value); setOpen(true) }}
        placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed" />
      <button type="button" disabled={disabled} onClick={() => { setQuery(open ? value : ''); setOpen(current => !current) }} aria-label="Mostrar opciones">
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
    </div>
    {open && !disabled && <div className="absolute z-[70] mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
      <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase text-muted">Resultados · {visible.length}</p>
      <div className="max-h-56 overflow-y-auto">
        {visible.map(option => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }}
          className="block w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50">{option}</button>)}
        {!visible.length && <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>}
      </div>
    </div>}
  </div>
}

function ResponsiblePicker({ users, value, onChange, loading }: {
  users: WarehouseResponsible[]; value: string; onChange: (id: string) => void; loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const selected = users.find(user => user.id === value)
  const visible = users.filter(user => matchesProductSearch(`${user.name} ${user.email} ${user.roles?.map(entry => entry.role.name).join(' ') ?? ''}`, query))

  useEffect(() => { if (!open) setQuery(selected?.name ?? '') }, [selected?.name, open])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(selected?.name ?? '') }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [selected?.name])

  return <div ref={root} className="relative">
    <div className={`flex h-10 items-center rounded-md border bg-[#f4f7fb] px-3 transition ${open ? 'border-brand bg-white ring-1 ring-brand' : 'border-border hover:border-blue-200'}`}>
      <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
      <input value={query} role="combobox" aria-expanded={open} aria-controls="warehouse-responsible-options"
        onFocus={() => { setQuery(''); setOpen(true) }} onChange={event => { setQuery(event.target.value); setOpen(true) }}
        placeholder="Buscar responsable..." className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" />
      {value && <button type="button" onClick={() => { onChange(''); setQuery(''); setOpen(false) }} aria-label="Quitar responsable" className="mr-2 text-slate-400 hover:text-red-600"><X className="h-4 w-4" /></button>}
      <button type="button" onClick={() => { setQuery(open ? (selected?.name ?? '') : ''); setOpen(current => !current) }} aria-label="Mostrar responsables" className="text-slate-400"><ChevronDown className="h-4 w-4" /></button>
    </div>
    {open && <div id="warehouse-responsible-options" className="absolute z-[70] mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
      <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">Resultados · {visible.length}</p>
      <div className="max-h-56 overflow-y-auto">
        {visible.map(user => <button key={user.id} type="button" onClick={() => { onChange(user.id); setQuery(user.name); setOpen(false) }} className="block w-full px-3 py-2.5 text-left hover:bg-blue-50">
          <span className="block text-sm font-medium text-ink">{user.name}</span>
          <span className="block truncate text-xs text-muted">{user.email}{user.roles?.length ? ` · ${user.roles.map(entry => entry.role.name).join(', ')}` : ''}</span>
        </button>)}
        {!visible.length && <p className="p-4 text-center text-sm text-muted">{loading ? 'Cargando usuarios…' : 'No se encontraron usuarios.'}</p>}
      </div>
    </div>}
  </div>
}

export function WarehousesPage() {
  const client = useQueryClient()
  const { session } = useAuth()
  const canManage = Boolean(session?.user.permissions.includes('*') || session?.user.permissions.includes('users.manage'))
  const warehouses = useQuery({ queryKey: ['inventory', 'warehouses'], queryFn: listWarehouses, staleTime: 0, refetchOnMount: 'always' })
  const responsibles = useQuery({ queryKey: ['inventory', 'warehouse-responsibles'], queryFn: listWarehouseResponsibles, enabled: canManage })
  const [editing, setEditing] = useState<Warehouse>()
  const [modal, setModal] = useState(false)
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }
  const sync = () => Promise.all([
    client.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
  ])
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: WarehousePayload }) => id ? updateWarehouse(id, payload) : createWarehouse(payload),
    onSuccess: () => { setModal(false); void sync(); notify('Almacén guardado y sincronizado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se pudo guardar el almacén.'),
  })
  const remove = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => { void sync(); notify('Almacén eliminado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se puede eliminar este almacén.'),
  })
  return <div className="mx-auto max-w-7xl">
    <section className="card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-sm font-semibold">Almacenes</h1>
          <p className="mt-1 text-xs text-muted">Ubicación física y responsable de cada almacén.</p></div>
        {canManage && <Button size="sm" onClick={() => { setEditing(undefined); setModal(true) }}><Plus className="h-4 w-4" />Nuevo almacén</Button>}
      </header>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1080px] text-left">
        <thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">
          {['Nombre', 'Responsable', 'Departamento', 'Provincia', 'Distrito', 'Calle / dirección', 'Estado', ...(canManage ? [''] : [])].map((value, index) =>
            <th key={value || index} className="border-y border-border px-3 py-3">{value}</th>)}
        </tr></thead>
        <tbody>
          {warehouses.isLoading ? <tr><td colSpan={canManage ? 8 : 7} className="p-10 text-center text-muted">Cargando almacenes…</td></tr>
            : (warehouses.data ?? []).length ? warehouses.data!.map(item => <tr key={item.id} className="border-b border-border text-[13px]">
              <td className="px-3 py-3 font-medium">{item.name}</td>
              <td className="px-3 py-3">{item.responsible?.name ?? 'Sin asignar'}</td>
              <td className="px-3 py-3">{item.department ?? '—'}</td>
              <td className="px-3 py-3">{item.province ?? '—'}</td>
              <td className="px-3 py-3">{item.district ?? '—'}</td>
              <td className="max-w-[250px] px-3 py-3">{item.address ?? item.location ?? '—'}</td>
              <td className="px-3 py-3">{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>
              {canManage && <td className="whitespace-nowrap px-3 py-3 text-right">
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded border border-border" aria-label={'Editar ' + item.name}
                  onClick={() => { setEditing(item); setModal(true) }}><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" disabled={remove.isPending} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 disabled:opacity-50"
                  aria-label={'Eliminar ' + item.name} onClick={() => { if (window.confirm('¿Eliminar el almacén ' + item.name + '?')) remove.mutate(item.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>}
            </tr>) : <tr><td colSpan={canManage ? 8 : 7} className="p-10 text-center text-muted">Aún no hay almacenes registrados.</td></tr>}
        </tbody>
      </table></div>
    </section>
    {modal && <WarehouseDialog item={editing} responsibles={responsibles.data ?? []} loadingResponsibles={responsibles.isLoading} saving={save.isPending}
      onClose={() => setModal(false)} onSave={payload => save.mutate({ id: editing?.id, payload })} />}
    {notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}
  </div>
}

function WarehouseDialog({ item, responsibles, loadingResponsibles, saving, onClose, onSave }: {
  item?: Warehouse; responsibles: WarehouseResponsible[]; loadingResponsibles: boolean; saving: boolean; onClose: () => void; onSave: (payload: WarehousePayload) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [responsibleUserId, setResponsibleUserId] = useState(item?.responsibleUserId ?? '')
  const [department, setDepartment] = useState(item?.department ?? '')
  const [province, setProvince] = useState(item?.province ?? '')
  const [district, setDistrict] = useState(item?.district ?? '')
  const [address, setAddress] = useState(item?.address ?? item?.location ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<Warehouse['status']>(item?.status ?? 'ACTIVE')
  const departmentOptions = department && !departments.includes(department) ? [department, ...departments] : departments
  const listedProvinces = department ? Object.keys(peruLocations[department] ?? {}).sort((a, b) => a.localeCompare(b, 'es')) : []
  const provinces = province && !listedProvinces.includes(province) ? [province, ...listedProvinces] : listedProvinces
  const listedDistricts = department && province ? peruLocations[department]?.[province] ?? [] : []
  const districts = district && !listedDistricts.includes(district) ? [district, ...listedDistricts] : listedDistricts
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || saving) return
    onSave({
      name: name.trim(), responsibleUserId: responsibleUserId || null,
      location: null, department: department || null, province: province || null,
      district: district || null, address: address.trim() || null,
      description: description.trim() || null, status,
    })
  }
  return <Dialog open wide title={item ? 'Editar almacén' : 'Nuevo almacén'} onClose={onClose}
    footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
      <Button type="submit" form="warehouse-form" disabled={!name.trim() || saving}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}>
    <form id="warehouse-form" className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *"><Input value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Almacén principal" /></Field>
        <Field label="Responsable de almacén"><ResponsiblePicker users={responsibles} value={responsibleUserId} onChange={setResponsibleUserId} loading={loadingResponsibles} /></Field>
      </div>
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-slate-700">Ubicación física <span className="font-normal text-muted">(campos opcionales)</span></p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Departamento"><LocationPicker options={departmentOptions} value={department}
            onChange={value => { setDepartment(value); setProvince(''); setDistrict('') }} placeholder="Busca un departamento..." /></Field>
          <Field label="Provincia"><LocationPicker options={provinces} value={province}
            onChange={value => { setProvince(value); setDistrict('') }} disabled={!department} placeholder="Busca una provincia..." /></Field>
          <Field label="Distrito"><LocationPicker options={districts} value={district} onChange={setDistrict}
            disabled={!province} placeholder="Busca un distrito..." /></Field>
        </div>
        <div className="mt-4"><Field label="Calle / dirección exacta"><Input value={address} onChange={event => setAddress(event.target.value)} placeholder="Ej. Av. Industrial 123" /></Field></div>
      </section>
      <Field label="Descripción"><textarea value={description} onChange={event => setDescription(event.target.value)}
        className="min-h-20 w-full rounded-md border border-border bg-[#f4f7fb] p-3 text-sm outline-none focus:border-brand" /></Field>
      <Field label="Estado"><Select value={status} onChange={event => setStatus(event.target.value as Warehouse['status'])}>
        <option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option>
      </Select></Field>
    </form>
  </Dialog>
}
