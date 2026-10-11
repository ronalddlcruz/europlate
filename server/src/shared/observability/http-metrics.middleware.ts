import { performance } from 'node:perf_hooks'
import type { NextFunction, Request, Response } from 'express'
import { API_GROUPS } from '../openapi/openapi.document.js'
import { httpMetrics } from './http-metrics.js'

const EXCLUDED_PATHS = ['/health', '/docs', '/openapi.json', '/internal/performance']

function routeTemplate(request: Request): string {
  const pathname = request.originalUrl.split('?', 1)[0]
  const basePath = API_GROUPS.find(
    ({ basePath }) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  )?.basePath
  if (!basePath) return 'unmatched'
  if (!request.route || typeof request.route.path !== 'string') return `${basePath}/(pre-route)`
  return `${basePath}${request.route.path}`.replace(/\/$/, '') || '/'
}

export function httpMetricsMiddleware(slowThresholdMs?: number) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (
      EXCLUDED_PATHS.some((path) => request.path === path || request.path.startsWith(`${path}/`))
    ) {
      next()
      return
    }
    const started = performance.now()
    response.once('finish', () => {
      const durationMs = performance.now() - started
      const route = routeTemplate(request)
      httpMetrics.record(request.method, route, response.statusCode, durationMs)
      if (slowThresholdMs && durationMs >= slowThresholdMs) {
        console.info(
          JSON.stringify({
            event: 'slow_http_request',
            method: request.method,
            route,
            status: response.statusCode,
            durationMs: Math.round(durationMs),
          }),
        )
      }
    })
    next()
  }
}
