import { API_GROUPS } from '../openapi/openapi.document.js'
import type { HttpMetric } from './http-metrics.js'

export type MeasuredModule = 'auth' | 'products'

const MODULE_BASE_PATH: Record<MeasuredModule, string> = {
  auth: '/api/auth',
  products: '/api/products',
}

export function modulePerformanceRows(module: MeasuredModule, metrics: HttpMetric[]) {
  const basePath = MODULE_BASE_PATH[module]
  const group = API_GROUPS.find(entry => entry.basePath === basePath)
  if (!group) throw new Error(`No hay rutas registradas para ${module}`)
  const byEndpoint = new Map(metrics.map(metric => [`${metric.method} ${metric.route}`, metric]))
  return group.routes.map(endpoint => {
    const [method, suffix] = endpoint.split(' ', 2)
    const route = `${basePath}${suffix === '/' ? '' : suffix.replace(/\{([^}]+)\}/g, ':$1')}`
    const metric = byEndpoint.get(`${method} ${route}`)
    return {
      method,
      route,
      count: metric?.count ?? 0,
      errors: metric?.errors ?? 0,
      p50Ms: metric?.p50Ms ?? null,
      p95Ms: metric?.p95Ms ?? null,
      p99Ms: metric?.p99Ms ?? null,
    }
  })
}
