import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type Permission,
  type Role,
  type SystemUser,
} from '@/features/users/services/user-api.service'
import { Mini, moduleName, RoleBadge, StatusBadge } from '@/features/users/components/shared'
import { permissionsForUser } from '@/features/users/domain/user-permissions'

export function UsersTable({
  users,
  roles: catalogRoles,
  permissions,
  loading,
  error,
  onNew,
  onEdit,
  onDelete,
}: {
  users: SystemUser[]
  roles: Role[]
  permissions: Permission[]
  loading: boolean
  error?: string
  onNew: () => void
  onEdit: (user: SystemUser) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="rounded-[10px] border border-border bg-white p-5 shadow-card">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">Usuarios y Permisos</h1>
        <Button size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </header>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead>
            <tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">
              {['Nombre', 'Email', 'Roles', 'Alcance', 'Estado', 'Acceso a módulos', ''].map(
                (item) => (
                  <th className="border-y border-border px-4 py-2.5" key={item}>
                    {item}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-muted">
                  Cargando usuarios…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-red-600">
                  No se pudieron cargar los usuarios: {error}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roles = user.roles ?? []
                const assignedWarehouses = user.assignedWarehouses ?? []
                const granted = permissionsForUser(user, catalogRoles)
                const grantedKeys = new Set(granted.map((permission) => permission.key))
                const hasGlobalScope = grantedKeys.has('operations.global')
                const allModules =
                  permissions.filter((permission) => permission.module !== 'operations').length >
                    0 &&
                  permissions
                    .filter((permission) => permission.module !== 'operations')
                    .every((permission) => grantedKeys.has(permission.key))
                const modules = [
                  ...new Set(
                    granted
                      .filter((permission) => permission.module !== 'operations')
                      .map((permission) => moduleName[permission.module] ?? permission.module),
                  ),
                ]
                const access = allModules
                  ? 'Todos los módulos'
                  : modules.join(', ') || 'Sin módulos asignados'
                const scope = hasGlobalScope
                  ? 'Global'
                  : user.site
                    ? `${user.site.name} · ${assignedWarehouses.map((warehouse) => warehouse.name).join(', ') || 'Sin almacenes'}`
                    : 'Sin asignar'
                return (
                  <tr key={user.id} className="border-b border-border text-[13px]">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {roles.map((role) => (
                          <RoleBadge key={role.id} role={role} />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-muted">{scope}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="max-w-[330px] px-4 py-3 text-xs text-muted">{access}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Mini onClick={() => onEdit(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Mini>
                      <Mini
                        danger
                        onClick={() => {
                          if (window.confirm(`¿Eliminar a ${user.name}?`)) onDelete(user.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Mini>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
