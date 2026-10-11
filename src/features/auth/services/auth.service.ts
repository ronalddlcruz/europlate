import { api, saveAccessToken } from '@/lib/api-client'
import {
  loginInputSchema,
  loginResponseSchema,
  sessionResponseSchema,
  type Session,
} from '@/features/auth/schemas/auth.schema'

export type { Session } from '@/features/auth/schemas/auth.schema'

export async function login(email: string, password: string): Promise<Session> {
  const credentials = loginInputSchema.parse({ email, password })
  const response = await api<unknown>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  const session = loginResponseSchema.parse(response)
  saveAccessToken(session.accessToken)
  return session
}

export async function getSession(): Promise<Session> {
  const response = await api<unknown>('/api/auth/session')
  return { ...sessionResponseSchema.parse(response), accessToken: '' }
}
