import { api, saveAccessToken } from '../../../lib/api-client'
export type Session = { accessToken: string; user: { id: string; name: string; email: string; companyId: string; permissions: string[] } }
export async function login(email: string, password: string) { const session = await api<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); saveAccessToken(session.accessToken); return session }
export async function getSession() { return api<Omit<Session, 'accessToken'>>('/api/auth/session').then(session => ({ ...session, accessToken: '' })) }
