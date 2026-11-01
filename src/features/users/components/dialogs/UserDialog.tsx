import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserAccessSelector } from '@/features/users/components/user-access-selector'
import {
  type Role,
  type SystemUser,
  type UserPayload,
  type UserSite,
  type UserStatus,
  type UserWarehouse,
} from '@/features/users/services/user-api.service'
import { Field, Select, statusName } from '@/features/users/components/shared'

export function UserDialog({
  item,
  roles,
  sites,
  warehouses,
  saving,
  onClose,
  onSave,
}: {
  item?: SystemUser
  roles: Role[]
  sites: UserSite[]
  warehouses: UserWarehouse[]
  saving: boolean
  onClose: () => void
  onSave: (payload: UserPayload) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleIds, setRoleIds] = useState<string[]>(item?.roles.map((role) => role.id) ?? [])
  const [siteId, setSiteId] = useState(item?.siteId ?? '')
  const [warehouseIds, setWarehouseIds] = useState<string[]>(
    item?.assignedWarehouses.map((warehouse) => warehouse.id) ?? [],
  )
  const [status, setStatus] = useState<UserStatus>(item?.status ?? 'ACTIVE')
  const hasGlobalAccess = roles.some(
    (role) => roleIds.includes(role.id) && ['admin', 'general_manager'].includes(role.key),
  )
  const scopeIsValid = hasGlobalAccess || (Boolean(siteId) && warehouseIds.length > 0)
  return (
    <Dialog
      open
      title={item ? 'Editar usuario' : 'Nuevo usuario'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            form="user-form"
            type="submit"
            disabled={saving || roleIds.length === 0 || !scopeIsValid}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        className="space-y-4"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          if (roleIds.length)
            onSave({
              name: name.trim(),
              email: email.trim(),
              ...(password && { password }),
              roleIds,
              siteId: hasGlobalAccess ? null : siteId,
              warehouseIds,
              status,
            })
        }}
      >
        <Field label="Nombre completo *">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Correo *">
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@europlate.pe"
          />
        </Field>
        <Field label={item ? 'Contraseña (opcional)' : 'Contraseña *'}>
          <Input
            required={!item}
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <UserAccessSelector
          roles={roles}
          sites={sites}
          warehouses={warehouses}
          roleIds={roleIds}
          siteId={siteId}
          warehouseIds={warehouseIds}
          onRoleIdsChange={setRoleIds}
          onSiteIdChange={setSiteId}
          onWarehouseIdsChange={setWarehouseIds}
        />
        <Field label="Estado">
          <Select value={status} onChange={(event) => setStatus(event.target.value as UserStatus)}>
            {Object.entries(statusName).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Dialog>
  )
}
