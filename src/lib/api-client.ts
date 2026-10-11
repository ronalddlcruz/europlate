export const apiBaseUrl = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001'
export const unauthorizedEvent = 'europlate:unauthorized'

const tokenStorageKey = 'europlate.access_token'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const accessToken = () => localStorage.getItem(tokenStorageKey)
export const saveAccessToken = (token: string) => localStorage.setItem(tokenStorageKey, token)
export const clearAccessToken = () => localStorage.removeItem(tokenStorageKey)

class ApiClient {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = accessToken()
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
    if (response.status === 204) return undefined as T
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status === 401 && path !== '/api/auth/login') {
        clearAccessToken()
        window.dispatchEvent(new CustomEvent(unauthorizedEvent))
      }
      throw new ApiError(
        body?.error?.message ??
          (response.status === 401
            ? 'Tu sesión expiró. Ingresa nuevamente para continuar.'
            : 'No se pudo completar la solicitud.'),
        response.status,
      )
    }
    return body.data as T
  }

  async uploadPdf<T>(path: string, file: File, errorMessage: string): Promise<T> {
    const token = accessToken()
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-File-Name': encodeURIComponent(file.name),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: file,
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      throw new ApiError(body?.error?.message ?? errorMessage, response.status)
    }
    return body.data as T
  }

  warmUp(): Promise<Response> {
    return fetch(`${apiBaseUrl}/health`, { cache: 'no-store' })
  }
}

export const apiClient = new ApiClient()

// Fachada compatible para los servicios de módulo existentes.
export const api = <T>(path: string, options: RequestInit = {}) =>
  apiClient.request<T>(path, options)
