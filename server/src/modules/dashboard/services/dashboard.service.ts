import { reportService } from '../../reports/services/report.service.js'
import { exchangeRateRepository } from '../../exchange-rates/repositories/exchange-rate.repository.js'
import { resolveOperationScope } from '../../../shared/security/operation-scope.js'
import { summarizeMonths } from './purchase-totals.js'
import { topRotatingProducts } from './rotation-totals.js'
import { currentBusinessMonth, monthOfBusinessDate, monthOfEvent } from './dashboard-period.js'

const monthLabel = (value: string) => new Date(`${value}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
const shortMonthLabel = (value: string) => new Date(`${value}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
const previousMonth = (value: string, offset: number) => {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 - offset, 1))
  return date.toISOString().slice(0, 7)
}

export const dashboardService = {
  async summary(companyId: string, actorId: string, requestedPeriod?: string) {
    const scope = await resolveOperationScope(companyId, actorId)
    const [source, exchangeRate] = await Promise.all([reportService.dashboard(companyId, scope), exchangeRateRepository.current(companyId)])
    const rate = Number(exchangeRate?.value ?? 0)
    // La fecha de llegada es logística. La importación entra al indicador de
    // compras en el mes en que se registró, aunque llegue más adelante.
    const registeredImports = source.imports.map(row => ({ ...row, date: `${monthOfEvent(row.registeredAt)}-01` }))
    const knownPeriods = new Set<string>([currentBusinessMonth()])
    for (const row of source.purchases) knownPeriods.add(monthOfBusinessDate(row.date))
    for (const row of registeredImports) knownPeriods.add(monthOfBusinessDate(row.date))
    for (const row of source.production) knownPeriods.add(monthOfBusinessDate(row.date))
    for (const row of source.movements) knownPeriods.add(monthOfEvent(row.createdAt))
    const periods = [...knownPeriods].sort((left, right) => right.localeCompare(left)).slice(0, 24)
    const period = requestedPeriod && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriod) ? requestedPeriod : periods[0]
    const chartPeriods = Array.from({ length: 8 }, (_, index) => previousMonth(period, 7 - index))
    const monthTotals = summarizeMonths(source.purchases, registeredImports, [...new Set([...chartPeriods, period])], rate)
    const selectedTotals = monthTotals.find(row => row.period === period)!
    const monthSeries = chartPeriods.map(month => ({ ...monthTotals.find(row => row.period === month)!, label: `${shortMonthLabel(month)} ${month.slice(2, 4)}` }))
    const hasUsdPurchases = [...source.purchases, ...registeredImports].some(row =>
      row.status !== 'CANCELLED' && row.currency === 'USD' && monthOfBusinessDate(row.date) === period,
    )
    return {
      period,
      periods: periods.map(value => ({ value, label: monthLabel(value) })),
      metrics: {
        purchasesPen: selectedTotals.totalPen,
        nationalPurchasesPen: selectedTotals.nationalPen,
        importsPen: selectedTotals.importsPen,
        nationalPurchaseCount: selectedTotals.nationalCount,
        purchasesUnconvertedUsd: selectedTotals.nationalUnconvertedUsd + selectedTotals.importsUnconvertedUsd,
        purchasesUsdRate: hasUsdPurchases && rate > 0 ? rate : null,
        activeProducts: source.stock.filter(row => row.status === 'ACTIVE').length,
        imports: selectedTotals.importCount,
        totalStock: source.stock.reduce((sum, row) => sum + row.total, 0),
      },
      purchasesByMonth: monthSeries,
      rotation: topRotatingProducts(source.movements, period),
    }
  },
}
