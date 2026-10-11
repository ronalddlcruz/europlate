import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpMetricsStore } from './http-metrics.js'

test('agrega latencias y errores por ruta plantilla sin retener URLs ni cuerpos', () => {
  const store = new HttpMetricsStore()
  store.record('PATCH', '/api/products/:id', 200, 100)
  store.record('PATCH', '/api/products/:id', 500, 200)
  store.record('PATCH', '/api/products/:id', 422, 300)
  assert.deepEqual(store.snapshot(), [
    {
      method: 'PATCH',
      route: '/api/products/:id',
      count: 3,
      errors: 1,
      statusCodes: { 200: 1, 422: 1, 500: 1 },
      meanMs: 200,
      p50Ms: 200,
      p95Ms: 300,
      p99Ms: 300,
      maxMs: 300,
      lastSeenAt: store.snapshot()[0].lastSeenAt,
    },
  ])
})

test('limita la memoria de muestras por endpoint', () => {
  const store = new HttpMetricsStore()
  for (let index = 0; index < 600; index++) store.record('GET', '/api/products', 200, index)
  const metric = store.snapshot()[0]
  assert.equal(metric.count, 600)
  assert.equal(metric.maxMs, 599)
  assert.equal(metric.p50Ms, 343)
})
