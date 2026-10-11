import { UserDialog } from '@/features/users/components/dialogs/UserDialog'
import { Profiles } from '@/features/users/components/sections/Profiles'
import { AuditTable } from '@/features/users/components/tables/AuditTable'
import { UsersTable } from '@/features/users/components/tables/UsersTable'
import { useUsersController } from '@/features/users/hooks/useUsersController'

export function UsersPage() {
  const { client, tab, setTab, editing, setEditing, open, setOpen, notice, setNotice, users, catalog, audit, refresh, say, save, remove, permissionMutation, roleList, permissions } = useUsersController()
  return <div className="mx-auto max-w-none"><nav className="mb-6 flex gap-1 overflow-x-auto rounded-t-[10px] border border-border bg-white px-2">{([['users', 'Usuarios y Permisos'], ['profiles', 'Perfiles y Permisos'], ['audit', 'Registro de Auditoría']] as const).map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-medium ${tab === value ? 'border-brand text-brand' : 'border-transparent text-muted'}`}>{label}</button>)}</nav>
    {tab === 'users' && <UsersTable users={users.data ?? []} loading={users.isLoading} error={users.error?.message} onNew={() => { setEditing(undefined); setOpen(true) }} onEdit={item => { setEditing(item); setOpen(true) }} onDelete={id => remove.mutate(id)}/>}
    {tab === 'profiles' && <Profiles roles={roleList} permissions={permissions} saving={permissionMutation.isPending} onSave={updates => permissionMutation.mutate(updates)}/>}
    {tab === 'audit' && <AuditTable loading={audit.isLoading} logs={audit.data ?? []}/>}
    {open && <UserDialog item={editing} roles={roleList} saving={save.isPending} onClose={() => setOpen(false)} onSave={payload => save.mutate({ id: editing?.id, payload })}/>} {notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}
