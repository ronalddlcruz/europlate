export type AuthorizationUser = {
  id: string
  companyId: string
  name: string
  email: string
  roles: { role: { key: string; permissions: { permission: { key: string } }[] } }[]
  permissions: { permission: { key: string } }[]
}

export type SessionUser = {
  id: string
  name: string
  email: string
  companyId: string
  permissions: string[]
}
