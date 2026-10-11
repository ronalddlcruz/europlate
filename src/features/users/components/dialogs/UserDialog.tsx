import { useState,type FormEvent } from 'react'
import { Button } from '../../../../components/ui/button'
import { Dialog } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { type Role,type SystemUser,type UserPayload,type UserStatus } from '../../services/user-api.service'
import { Field,Select,statusName } from '../shared'

export function UserDialog({ item, roles, saving, onClose, onSave }: { item?: SystemUser; roles: Role[]; saving: boolean; onClose: () => void; onSave: (payload: UserPayload) => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleIds, setRoleIds] = useState<string[]>(item?.roles.map(role => role.id) ?? [])
  const [status, setStatus] = useState<UserStatus>(item?.status ?? 'ACTIVE')
  const toggleRole = (id: string) => setRoleIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  return <Dialog open title={item ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button form="user-form" type="submit" disabled={saving || roleIds.length === 0}>Guardar</Button></>}>
    <form id="user-form" className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); if (roleIds.length) onSave({ name: name.trim(), email: email.trim(), ...(password && { password }), roleIds, status }) }}>
      <Field label="Nombre completo *"><Input required value={name} onChange={event => setName(event.target.value)}/></Field>
      <Field label="Correo *"><Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="usuario@europlate.pe"/></Field>
      <Field label={item ? 'Contraseña (opcional)' : 'Contraseña *'}><Input required={!item} minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)}/></Field>
      <div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">Roles * <span className="font-normal normal-case">(puedes elegir varios)</span></p><div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border bg-[#f4f7fb] p-3">{roles.map(role => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)}/>{role.name}</label>)}</div><p className="mt-1 text-xs text-muted">Administrador y Gerente General conservan acceso global aunque sean responsables de un almacén.</p></div>
      <Field label="Estado"><Select value={status} onChange={event => setStatus(event.target.value as UserStatus)}>{Object.entries(statusName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
    </form>
  </Dialog>
}
