import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.')
export const exchangeRatePayloadSchema = z.object({ effectiveDate: date, value: z.coerce.number().positive().max(100), source: z.string().trim().max(100).optional(), note: z.string().trim().max(500).optional() })
export const createExchangeRateSchema = exchangeRatePayloadSchema
export const updateExchangeRateSchema = exchangeRatePayloadSchema.partial()
export type ExchangeRateInput = z.infer<typeof exchangeRatePayloadSchema>
