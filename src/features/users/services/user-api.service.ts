import { api } from '@/lib/api-client'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type Permission = { id: string; key: string; module: string; action: string }
export type Role = {
  id: string
  key: string
  name: string
  permissions: { permission: Permission }[]
}
export type UserWarehouse = {
  id: string
  name: string
  site: { id: string; name: string }
  department: string | null
  province: string | null
  district: string | null
  address: string | null
}
export type UserSite = { id: string; name: string }
export type SystemUser = {
  id: string
  name: string
  email: string
  status: UserStatus
  siteId: string | null
  site: UserSite | null
  roles: Role[]
  directPermissions: Permission[]
  assignedWarehouses: UserWarehouse[]
}
export type UserPayload = {
  name: string
  email: string
  password?: string
  roleIds: string[]
  siteId: string | null
  warehouseIds: string[]
  status: UserStatus
}
export type AuditLog = {
  id: string
  action: string
  module: string
  detail: Record<string, unknown> | null
  createdAt: string
  user: { name: string; email: string } | null
}
export async function listUsers() {
  return api<SystemUser[]>('/api/users')
}
export async function loadUsersCatalog() {
  return api<{
    roles: Role[]
    permissions: Permission[]
    sites: UserSite[]
    warehouses: UserWarehouse[]
  }>('/api/users/catalog')
}
export async function listUserAudit() {
  return api<AuditLog[]>('/api/users/audit')
}
export async function createUser(payload: UserPayload) {
  return api<SystemUser>('/api/users', { method: 'POST', body: JSON.stringify(payload) })
}
export async function updateUser(id: string, payload: UserPayload) {
  return api<SystemUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}
export async function deleteUser(id: string) {
  await api<void>(`/api/users/${id}`, { method: 'DELETE' })
}
export async function updateRolePermissions(id: string, permissionIds: string[]) {
  return api<Role>(`/api/users/roles/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  })
}
