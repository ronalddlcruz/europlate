import { Pencil,Plus,Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type SystemUser } from '@/features/users/services/user-api.service';
import { Mini,moduleName,RoleBadge,StatusBadge } from '@/features/users/components/shared';

export function UsersTable({ users, loading, error, onNew, onEdit, onDelete }: { users: SystemUser[]; loading: boolean; error?: string; onNew: () => void; onEdit: (user: SystemUser) => void; onDelete: (id: string) => void }) {
  return <section className="rounded-[10px] border border-border bg-white p-5 shadow-card">
    <header className="flex items-center justify-between"><h1 className="text-sm font-semibold">Usuarios y Permisos</h1><Button size="sm" onClick={onNew}><Plus className="h-4 w-4"/>Nuevo usuario</Button></header>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left">
      <thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['Nombre', 'Email', 'Roles', 'Estado', 'Acceso a módulos', ''].map(item => <th className="border-y border-border px-4 py-2.5" key={item}>{item}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-sm text-muted">Cargando usuarios…</td></tr> : error ? <tr><td colSpan={6} className="p-8 text-center text-sm text-red-600">No se pudieron cargar los usuarios: {error}</td></tr> : users.map(user => {
        const all = user.roles.some(role => role.key === 'admin')
        const access = all ? 'Todos los módulos' : [...new Set(user.roles.flatMap(role => role.permissions.map(p => moduleName[p.permission.module] ?? p.permission.module)))].join(', ') || 'Sin módulos asignados'
        return <tr key={user.id} className="border-b border-border text-[13px]"><td className="px-4 py-3 font-medium">{user.name}</td><td className="px-4 py-3 text-slate-600">{user.email}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.roles.map(role => <RoleBadge key={role.id} role={role}/>)}</div></td><td className="px-4 py-3"><StatusBadge status={user.status}/></td><td className="max-w-[330px] px-4 py-3 text-xs text-muted">{access}</td><td className="whitespace-nowrap px-4 py-3 text-right"><Mini onClick={() => onEdit(user)}><Pencil className="h-3.5 w-3.5"/></Mini><Mini danger onClick={() => { if (window.confirm(`¿Eliminar a ${user.name}?`)) onDelete(user.id) }}><Trash2 className="h-3.5 w-3.5"/></Mini></td></tr>
      })}</tbody>
    </table></div>
  </section>
}
