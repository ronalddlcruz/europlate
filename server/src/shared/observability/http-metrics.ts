export type HttpMetric = {
  method: string
  route: string
  count: number
  errors: number
  statusCodes: Record<string, number>
  meanMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  maxMs: number
  lastSeenAt: string
}

type MetricBucket = {
  method: string
  route: string
  count: number
  errors: number
  totalMs: number
  maxMs: number
  lastSeenAt: string
  statusCodes: Map<number, number>
  samples: number[]
  nextSampleIndex: number
}

const MAX_ROUTES = 200
const MAX_SAMPLES_PER_ROUTE = 512

function percentile(sorted: number[], fraction: number): number {
  if (!sorted.length) return 0
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)]
}

export class HttpMetricsStore {
  private readonly buckets = new Map<string, MetricBucket>()

  record(method: string, route: string, statusCode: number, durationMs: number): void {
    const key = `${method} ${route}`
    let bucket = this.buckets.get(key)
    if (!bucket) {
      if (this.buckets.size >= MAX_ROUTES) return
      bucket = {
        method,
        route,
        count: 0,
        errors: 0,
        totalMs: 0,
        maxMs: 0,
        lastSeenAt: '',
        statusCodes: new Map(),
        samples: [],
        nextSampleIndex: 0,
      }
      this.buckets.set(key, bucket)
    }
    const duration = Math.max(0, Math.round(durationMs * 10) / 10)
    bucket.count++
    bucket.errors += Number(statusCode >= 500)
    bucket.totalMs += duration
    bucket.maxMs = Math.max(bucket.maxMs, duration)
    bucket.lastSeenAt = new Date().toISOString()
    bucket.statusCodes.set(statusCode, (bucket.statusCodes.get(statusCode) ?? 0) + 1)
    if (bucket.samples.length < MAX_SAMPLES_PER_ROUTE) bucket.samples.push(duration)
    else bucket.samples[bucket.nextSampleIndex] = duration
    bucket.nextSampleIndex = (bucket.nextSampleIndex + 1) % MAX_SAMPLES_PER_ROUTE
  }

  snapshot(): HttpMetric[] {
    return [...this.buckets.values()]
      .map((bucket) => {
        const sorted = [...bucket.samples].sort((a, b) => a - b)
        return {
          method: bucket.method,
          route: bucket.route,
          count: bucket.count,
          errors: bucket.errors,
          statusCodes: Object.fromEntries(bucket.statusCodes),
          meanMs: Math.round((bucket.totalMs / bucket.count) * 10) / 10,
          p50Ms: percentile(sorted, 0.5),
          p95Ms: percentile(sorted, 0.95),
          p99Ms: percentile(sorted, 0.99),
          maxMs: bucket.maxMs,
          lastSeenAt: bucket.lastSeenAt,
        }
      })
      .sort((a, b) => b.p95Ms - a.p95Ms)
  }
}

export const httpMetrics = new HttpMetricsStore()
