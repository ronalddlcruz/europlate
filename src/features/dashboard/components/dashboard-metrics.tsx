import { DashboardMetric } from '../../../components/dashboard/dashboard-components'

export function DashboardMetrics({ periodLabel, purchasesPen, nationalPurchaseCount, purchasesUnconvertedUsd, purchasesUsdRate, activeProducts, imports, totalStock, chart }: { periodLabel: string; purchasesPen: number; nationalPurchaseCount: number; purchasesUnconvertedUsd: number; purchasesUsdRate: number | null; activeProducts: number; imports: number; totalStock: number; chart: number[] }) {
  const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(purchasesPen)
  const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 })
  const purchaseDetail = `${nationalPurchaseCount} compras + ${imports} importaciones${purchasesUnconvertedUsd > 0 ? ` · USD ${number.format(purchasesUnconvertedUsd)} sin convertir` : purchasesUsdRate ? ` · T.C. ${number.format(purchasesUsdRate)}` : ''}`
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4"><DashboardMetric label="Compras e importaciones del mes" value={`S/ ${money}`} detail={purchaseDetail} tone="emerald" chart={chart} /><DashboardMetric label="Productos activos" value={number.format(activeProducts)} detail="En catálogo" tone="blue" /><DashboardMetric label="Importaciones del mes" value={number.format(imports)} detail={`${periodLabel} · registradas`} tone="amber" /><DashboardMetric label="Stock total" value={number.format(totalStock)} detail="Unidades físicas registradas" tone="blue" /></section>
}
