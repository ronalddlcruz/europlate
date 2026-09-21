import { reportService } from '../../reports/services/report.service.js'

const monthOf = (value: Date | string) => new Date(value).toISOString().slice(0, 7)
const monthLabel = (value: string) => new Date(`${value}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
const shortMonthLabel = (value: string) => new Date(`${value}-01T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
const previousMonth = (value: string, offset: number) => {
  const date = new Date(`${value}-01T12:00:00`)
  date.setMonth(date.getMonth() - offset)
  return date.toISOString().slice(0, 7)
}

export const dashboardService = {
  async summary(companyId: string, requestedPeriod?: string) {
    const source = await reportService.dashboard(companyId)
    const knownPeriods = new Set<string>([monthOf(new Date())])
    for (const row of source.purchases) knownPeriods.add(monthOf(row.date))
    for (const row of source.imports) knownPeriods.add(monthOf(row.date))
    for (const row of source.production) knownPeriods.add(monthOf(row.date))
    for (const row of source.movements) knownPeriods.add(monthOf(row.createdAt))
    const periods = [...knownPeriods].sort((left, right) => right.localeCompare(left)).slice(0, 24)
    const period = requestedPeriod && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriod) ? requestedPeriod : periods[0]
    const isInPeriod = (value: Date | string) => monthOf(value) === period
    const completedPurchases = source.purchases.filter(row => row.currency === 'PEN' && row.status !== 'CANCELLED' && isInPeriod(row.date))
    const periodImports = source.imports.filter(row => isInPeriod(row.date))
    const movementByProduct = new Map<string, { code: string; name: string; unit: string; units: number; movements: number }>()
    for (const row of source.movements.filter(row => isInPeriod(row.createdAt))) {
      const current = movementByProduct.get(row.productId) ?? { code: row.code, name: row.product, unit: row.unit, units: 0, movements: 0 }
      current.units += Math.abs(row.quantity)
      current.movements += 1
      movementByProduct.set(row.productId, current)
    }
    const monthSeries = Array.from({ length: 8 }, (_, index) => previousMonth(period, 7 - index)).map(month => ({
      label: shortMonthLabel(month),
      value: source.purchases.filter(row => row.currency === 'PEN' && row.status !== 'CANCELLED' && monthOf(row.date) === month).reduce((sum, row) => sum + row.total, 0),
    }))
    const activeImports = source.imports.filter(row => row.status === 'IN_TRANSIT').slice(0, 3)
    return {
      period,
      periods: periods.map(value => ({ value, label: monthLabel(value) })),
      metrics: {
        purchasesPen: completedPurchases.reduce((sum, row) => sum + row.total, 0),
        activeProducts: source.stock.filter(row => row.status === 'ACTIVE').length,
        imports: periodImports.length,
        totalStock: source.stock.reduce((sum, row) => sum + row.total, 0),
      },
      purchasesByMonth: monthSeries,
      rotation: [...movementByProduct.values()].sort((left, right) => right.units - left.units).slice(0, 5),
      activeImports: activeImports.map(row => ({ number: row.number, supplier: row.supplier, status: row.status })),
    }
  },
}
