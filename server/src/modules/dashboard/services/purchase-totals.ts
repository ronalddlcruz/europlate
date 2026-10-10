import { monthOfBusinessDate } from './dashboard-period.js'

export type PurchaseAmount = { currency: string; total: number; status: string; date: Date | string }

export function amountInPen(document: PurchaseAmount, usdPenRate: number) {
  if (document.currency === 'PEN') return document.total
  if (document.currency === 'USD' && usdPenRate > 0) return document.total * usdPenRate
  return 0
}

export function totalInPen(documents: PurchaseAmount[], usdPenRate: number) {
  return documents.reduce((total, document) => total + amountInPen(document, usdPenRate), 0)
}

export type MonthlyTotals = {
  period: string
  nationalPen: number
  importsPen: number
  nationalCount: number
  importCount: number
  nationalUnconvertedUsd: number
  importsUnconvertedUsd: number
  totalPen: number
}

/** Una importación se agrupa por su fecha de registro, no por la llegada logística. */
export function summarizeMonths(purchases: PurchaseAmount[], imports: PurchaseAmount[], periods: string[], usdPenRate: number): MonthlyTotals[] {
  const byPeriod = new Map(periods.map(period => [period, {
    period, nationalPen: 0, importsPen: 0, nationalCount: 0, importCount: 0,
    nationalUnconvertedUsd: 0, importsUnconvertedUsd: 0, totalPen: 0,
  }]))
  const collect = (documents: PurchaseAmount[], kind: 'national' | 'import') => {
    for (const document of documents) {
      if (document.status === 'CANCELLED') continue
      const month = monthOfBusinessDate(document.date)
      const totals = byPeriod.get(month)
      if (!totals) continue
      const pen = amountInPen(document, usdPenRate)
      totals.totalPen += pen
      if (kind === 'national') {
        totals.nationalCount++
        totals.nationalPen += pen
        if (document.currency === 'USD' && usdPenRate <= 0) totals.nationalUnconvertedUsd += document.total
      } else {
        totals.importCount++
        totals.importsPen += pen
        if (document.currency === 'USD' && usdPenRate <= 0) totals.importsUnconvertedUsd += document.total
      }
    }
  }
  collect(purchases, 'national')
  collect(imports, 'import')
  return [...byPeriod.values()]
}
