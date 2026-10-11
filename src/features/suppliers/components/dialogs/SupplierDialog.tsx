import { useState,type FormEvent } from 'react'
import { Button } from '../../../../components/ui/button'
import { Dialog } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { type Supplier,type SupplierStatus,type SupplierType } from '../../services/supplier-api.service'
import { Field,Select } from '../shared'

export function SupplierDialog({ item, onClose, onSave }: { item?: Supplier; onClose: () => void; onSave: (supplier: Omit<Supplier, 'id'>) => Promise<void> }) {
  const [type, setType] = useState<SupplierType>(item?.type ?? 'Nacional'); const [name, setName] = useState(item?.name ?? ''); const [document, setDocument] = useState(item?.document ?? ''); const [phone, setPhone] = useState(item?.phone ?? ''); const [email, setEmail] = useState(item?.email ?? ''); const [status, setStatus] = useState<SupplierStatus>(item?.status ?? 'Activo'); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedDocument = document.trim()
    if (!name.trim()) return setFormError('Ingresa la razón social del proveedor.')
    if (normalizedDocument && type === 'Nacional' && !/^\d{11}$/.test(normalizedDocument)) return setFormError('El RUC debe tener exactamente 11 dígitos.')
    if (normalizedDocument && type === 'Extranjero' && normalizedDocument.length < 8) return setFormError('El Tax ID debe tener al menos 8 caracteres.')
    setFormError(''); setSaving(true)
    try { await onSave({ name: name.trim(), type, document: normalizedDocument, phone: phone.trim(), email: email.trim(), status }) }
    catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo guardar el proveedor. Inténtalo nuevamente.') }
    finally { setSaving(false) }
  }
  const clearError = () => { if (formError) setFormError('') }
  return <Dialog open title={item ? 'Editar Proveedor' : 'Nuevo Proveedor'} onClose={onClose} footer={<><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button><Button form="supplier-form" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button></>}><form id="supplier-form" className="grid gap-4 md:grid-cols-2" onSubmit={submit} noValidate><fieldset className="md:col-span-2"><legend className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">Tipo de proveedor *</legend><div className="flex gap-5 text-sm"><label className="flex cursor-pointer items-center gap-2"><input type="radio" checked={type === 'Nacional'} onChange={() => { setType('Nacional'); clearError() }} />Nacional</label><label className="flex cursor-pointer items-center gap-2"><input type="radio" checked={type === 'Extranjero'} onChange={() => { setType('Extranjero'); clearError() }} />Extranjero</label></div></fieldset><div className="md:col-span-2"><Field label="Razón Social *"><Input required value={name} onChange={event => { setName(event.target.value); clearError() }} /></Field></div><Field label={type === 'Nacional' ? 'RUC (opcional)' : 'NIF / Tax ID (opcional)'}><Input inputMode={type === 'Nacional' ? 'numeric' : 'text'} maxLength={type === 'Nacional' ? 11 : 20} value={document} onChange={event => { setDocument(type === 'Nacional' ? event.target.value.replace(/\D/g, '') : event.target.value.replace(/[^A-Za-z0-9-]/g, '')); clearError() }} placeholder={type === 'Nacional' ? '20000000000' : 'Tax ID'} /></Field><Field label="Teléfono"><Input inputMode="tel" value={phone} onChange={event => setPhone(event.target.value.replace(/[^0-9+()\-\s]/g, ''))} /></Field><Field label="Correo"><Input type="email" value={email} onChange={event => setEmail(event.target.value)} /></Field><Field label="Estado"><Select value={status} onChange={event => setStatus(event.target.value as SupplierStatus)}><option>Activo</option><option>Inactivo</option></Select></Field>{formError && <p role="alert" className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}</form></Dialog>
}
