import { DashboardMetric } from '../../../components/dashboard/dashboard-components'

export function DashboardMetrics({ periodLabel }: { periodLabel: string }) {
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"><DashboardMetric label="Compras del mes" value="S/ 0.00" detail={periodLabel} tone="emerald" chart={[34, 48, 37, 74, 44, 62, 88]} /><DashboardMetric label="Productos activos" value="13" detail="En catálogo" tone="blue" chart={[48, 38, 55, 46, 74, 64, 92]} /><DashboardMetric label="Importaciones" value="4" detail="Total registradas" tone="amber" chart={[24, 44, 40, 72, 58, 84, 68]} /></section>
}
