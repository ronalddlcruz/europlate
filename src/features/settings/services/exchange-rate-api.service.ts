import { api } from '../../../lib/api-client'
export type ExchangeRate = { id: string; effectiveDate: string; value: string | number; source: string | null; note: string | null; createdBy: { name: string; email: string } | null }
export type ExchangeRatePayload = { effectiveDate: string; value: number; source?: string; note?: string }
export const listExchangeRates = () => api<ExchangeRate[]>('/api/exchange-rates')
export const getCurrentExchangeRate = () => api<ExchangeRate | null>('/api/exchange-rates/current')
export const createExchangeRate = (payload: ExchangeRatePayload) => api<ExchangeRate>('/api/exchange-rates', { method: 'POST', body: JSON.stringify(payload) })
export const updateExchangeRate = (id: string, payload: Partial<ExchangeRatePayload>) => api<ExchangeRate>(`/api/exchange-rates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteExchangeRate = (id: string) => api<void>(`/api/exchange-rates/${id}`, { method: 'DELETE' })
export const refreshExchangeRate = () => api<ExchangeRate>('/api/exchange-rates/refresh', { method: 'POST' })
