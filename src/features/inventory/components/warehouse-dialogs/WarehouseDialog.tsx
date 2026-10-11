import { useState,type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { departments,peruLocations } from '@/features/inventory/data/peru-locations'
import {
type Warehouse,type WarehouseResponsible
} from '@/features/inventory/services/inventory-api.service'
import { Field,LocationPicker,ResponsiblePicker,Select,WarehousePayload } from '@/features/inventory/components/warehouses-shared'

export function WarehouseDialog({ item, responsibles, loadingResponsibles, saving, onClose, onSave }: {
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
