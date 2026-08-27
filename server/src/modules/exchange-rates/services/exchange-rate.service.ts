import { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { exchangeRateRepository } from '../repositories/exchange-rate.repository.js'
import type { ExchangeRateInput } from '../schemas/exchange-rate.schema.js'

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`)
const notFound = () => new AppError('EXCHANGE_RATE_NOT_FOUND', 'Tipo de cambio no encontrado.', 404)
type FrankfurterResponse = { date?: string; rate?: number }
async function latestUsdPen() {
  try {
    const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/PEN', { signal: AbortSignal.timeout(8_000) })
    if (!response.ok) throw new Error(`Proveedor respondió ${response.status}`)
    const data = await response.json() as FrankfurterResponse
    if (!data.date || !data.rate || data.rate <= 0) throw new Error('La respuesta no contiene USD/PEN.')
    return { effectiveDate: data.date, value: data.rate }
  } catch (error) {
    console.error('No se pudo obtener USD/PEN desde Frankfurter.', error)
    throw new AppError('EXCHANGE_RATE_PROVIDER_UNAVAILABLE', 'No se pudo consultar la cotización actual. Puedes registrarla manualmente.', 502)
  }
}
export const exchangeRateService = {
  list: (companyId: string) => exchangeRateRepository.list(companyId),
  current: (companyId: string) => exchangeRateRepository.current(companyId),
  async create(companyId: string, userId: string, input: ExchangeRateInput) {
    const effectiveDate = toDate(input.effectiveDate)
    return exchangeRateRepository.upsertForDate(prisma, companyId, effectiveDate, { createdByUserId: userId, value: new Prisma.Decimal(input.value), source: input.source || 'Manual', note: input.note || null })
  },
  async update(companyId: string, userId: string, id: string, input: Partial<ExchangeRateInput>) {
    const current = await exchangeRateRepository.findById(companyId, id); if (!current) throw notFound()
    return exchangeRateRepository.update(prisma, id, { ...(input.effectiveDate && { effectiveDate: toDate(input.effectiveDate) }), ...(input.value !== undefined && { value: new Prisma.Decimal(input.value) }), ...(input.source !== undefined && { source: input.source || null }), ...(input.note !== undefined && { note: input.note || null }), createdBy: { connect: { id: userId } } })
  },
  async remove(companyId: string, id: string) { const current = await exchangeRateRepository.findById(companyId, id); if (!current) throw notFound(); const count = await prisma.exchangeRate.count({ where: { companyId } }); if (count <= 1) throw new AppError('EXCHANGE_RATE_REQUIRED', 'Debe existir al menos un tipo de cambio.', 422); await exchangeRateRepository.remove(prisma, id) },
  async refresh(companyId: string, userId: string) { const quote = await latestUsdPen(); return exchangeRateRepository.upsertForDate(prisma, companyId, toDate(quote.effectiveDate), { createdByUserId: userId, value: new Prisma.Decimal(quote.value), source: 'Frankfurter', note: 'Actualización automática USD → PEN' }) },
}
