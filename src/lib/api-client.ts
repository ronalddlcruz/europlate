export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error { constructor(message: string, public readonly status: number) { super(message); this.name = 'ApiError' } }
export const accessToken = () => localStorage.getItem('europlate.access_token')
export const saveAccessToken = (token: string) => localStorage.setItem('europlate.access_token', token)
export const clearAccessToken = () => localStorage.removeItem('europlate.access_token')
export const unauthorizedEvent = 'europlate:unauthorized'

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = accessToken()
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...options.headers } })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/auth/login') {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent(unauthorizedEvent))
    }
    throw new ApiError(body?.error?.message ?? (response.status === 401 ? 'Tu sesión expiró. Ingresa nuevamente para continuar.' : 'No se pudo completar la solicitud.'), response.status)
  }
  return body.data as T
}
