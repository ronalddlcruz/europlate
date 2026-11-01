import type { Role, UserWarehouse } from '@/features/users/services/user-api.service'
import type { UserSite } from '@/features/users/services/user-api.service'
import { SitePicker } from '@/features/inventory/components/warehouses-shared'

const GLOBAL_ROLE_KEYS = new Set(['admin', 'general_manager'])

function CheckboxOption({
  checked,
  title,
  details,
  onChange,
}: {
  checked: boolean
  title: string
  details?: string[]
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-white">
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 accent-brand"
        checked={checked}
        onChange={onChange}
      />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <strong className="truncate text-sm font-medium text-ink">{title}</strong>
        {details?.map((detail, index) => (
          <small key={`${detail}-${index}`} className="whitespace-nowrap text-[11px] text-muted">
            · {detail}
          </small>
        ))}
      </span>
    </label>
  )
}

export function UserAccessSelector({
  roles,
  sites,
  warehouses,
  roleIds,
  siteId,
  warehouseIds,
  onRoleIdsChange,
  onSiteIdChange,
  onWarehouseIdsChange,
}: {
  roles: Role[]
  sites: UserSite[]
  warehouses: UserWarehouse[]
  roleIds: string[]
  siteId: string
  warehouseIds: string[]
  onRoleIdsChange: (ids: string[]) => void
  onSiteIdChange: (id: string) => void
  onWarehouseIdsChange: (ids: string[]) => void
}) {
  const selectedRoles = roles.filter((role) => roleIds.includes(role.id))
  const hasGlobalAccess = selectedRoles.some((role) => GLOBAL_ROLE_KEYS.has(role.key))
  const toggle = (values: string[], id: string) =>
    values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
  const toggleRole = (role: Role) => {
    const next = toggle(roleIds, role.id)
    onRoleIdsChange(next)
    if (roles.some((item) => next.includes(item.id) && GLOBAL_ROLE_KEYS.has(item.key))) {
      onSiteIdChange('')
      onWarehouseIdsChange([])
    }
  }
  const visibleWarehouses = siteId
    ? warehouses.filter((warehouse) => warehouse.site.id === siteId)
    : []

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
          Roles * <span className="font-normal normal-case">(puedes elegir varios)</span>
        </p>
        <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-border bg-[#f4f7fb] p-1.5">
          {roles.map((role) => (
            <CheckboxOption
              key={role.id}
              checked={roleIds.includes(role.id)}
              title={role.name}
              onChange={() => toggleRole(role)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
          Alcance operativo {!hasGlobalAccess && '*'}
        </p>
        {hasGlobalAccess ? (
          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            El rol seleccionado tiene acceso global a todas las sedes y almacenes.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
                Sede *
              </p>
              <SitePicker
                sites={sites}
                value={siteId}
                onChange={(id) => {
                  onSiteIdChange(id)
                  onWarehouseIdsChange([])
                }}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
                Almacenes *
              </p>
              <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-border bg-[#f4f7fb] p-1.5">
                {visibleWarehouses.map((warehouse) => (
                  <CheckboxOption
                    key={warehouse.id}
                    checked={warehouseIds.includes(warehouse.id)}
                    title={warehouse.name}
                    details={[warehouse.site.name, warehouse.district ?? 'Sin distrito']}
                    onChange={() => onWarehouseIdsChange(toggle(warehouseIds, warehouse.id))}
                  />
                ))}
                {!siteId && (
                  <p className="px-3 py-4 text-center text-xs text-muted">
                    Selecciona una sede para ver sus almacenes.
                  </p>
                )}
                {siteId && !visibleWarehouses.length && (
                  <p className="px-3 py-4 text-center text-xs text-muted">
                    Esta sede no tiene almacenes activos disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {!hasGlobalAccess && (
          <p className="mt-1 text-xs text-muted">
            El usuario solo podrá consultar y operar en los almacenes seleccionados.
          </p>
        )}
      </div>
    </div>
  )
}
