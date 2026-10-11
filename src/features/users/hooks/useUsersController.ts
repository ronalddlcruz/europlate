import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { type Tab } from '@/features/users/components/shared'
import { createUser,deleteUser,listUserAudit,listUsers,loadUsersCatalog,updateRolePermissions,updateUser,type SystemUser,type UserPayload } from '@/features/users/services/user-api.service'

export function useUsersController() {
  const client = useQueryClient(); const [tab, setTab] = useState<Tab>('users'); const [editing, setEditing] = useState<SystemUser>(); const [open, setOpen] = useState(false); const [notice, setNotice] = useState('')
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers }); const catalog = useQuery({ queryKey: ['users', 'catalog'], queryFn: loadUsersCatalog }); const audit = useQuery({ queryKey: ['users', 'audit'], queryFn: listUserAudit, enabled: tab === 'audit' })
  const refresh = () => { void client.invalidateQueries({ queryKey: ['users'] }) }; const say = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3500) }
  const save = useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: UserPayload }) => id ? updateUser(id, payload) : createUser(payload), onSuccess: () => { refresh(); setOpen(false); say('Usuario guardado correctamente.') }, onError: (error: Error) => say(error.message) })
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: () => { refresh(); say('Usuario eliminado correctamente.') }, onError: (error: Error) => say(error.message) })
  const permissionMutation = useMutation({ mutationFn: (updates: { id: string; ids: string[] }[]) => Promise.all(updates.map(update => updateRolePermissions(update.id, update.ids))), onSuccess: () => { refresh(); say('Permisos actualizados correctamente.') }, onError: (error: Error) => say(error.message) })
  const roleList = catalog.data?.roles ?? []; const permissions = catalog.data?.permissions ?? []

  return { client, tab, setTab, editing, setEditing, open, setOpen, notice, setNotice, users, catalog, audit, refresh, say, save, remove, permissionMutation, roleList, permissions }
}
