import { modulePerformanceRows, type MeasuredModule } from '../server/src/shared/observability/module-performance.js'
import type { HttpMetric } from '../server/src/shared/observability/http-metrics.js'

async function main() {
  const baseUrl = process.env.EUROPLATE_API_URL ?? 'http://localhost:3001'
  const token = process.env.EUROPLATE_ACCESS_TOKEN
  if (!token) throw new Error('Configura EUROPLATE_ACCESS_TOKEN con un token de administrador; no se imprime ni se guarda.')
  const response = await fetch(new URL('/internal/performance', baseUrl), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`No se pudo leer la medición: HTTP ${response.status}`)
  const body = await response.json() as { data: { routes: HttpMetric[] } }
  for (const module of ['auth', 'products'] satisfies MeasuredModule[]) {
    console.info(`\n${module.toUpperCase()} — métricas desde el último inicio del proceso`)
    console.table(modulePerformanceRows(module, body.data.routes))
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No se pudo generar el reporte.')
  process.exitCode = 1
})
