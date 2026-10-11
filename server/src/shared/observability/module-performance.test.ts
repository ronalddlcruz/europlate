import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpMetricsStore } from './http-metrics.js'
import { modulePerformanceRows } from './module-performance.js'

test('presenta todas las rutas de Auth y Productos, incluso sin muestras', () => {
  const store = new HttpMetricsStore()
  store.record('POST', '/api/auth/login', 200, 120)
  store.record('GET', '/api/products/:id', 200, 60)
  const auth = modulePerformanceRows('auth', store.snapshot())
  const products = modulePerformanceRows('products', store.snapshot())
  assert.equal(auth.length, 2)
  assert.deepEqual(auth[0], { method: 'POST', route: '/api/auth/login', count: 1, errors: 0, p50Ms: 120, p95Ms: 120, p99Ms: 120 })
  assert.equal(auth[1].count, 0)
  assert.equal(products.length, 18)
  assert.equal(products.find(row => row.route === '/api/products/:id' && row.method === 'GET')?.p95Ms, 60)
  assert.equal(products.find(row => row.route === '/api/products/categories')?.count, 0)
})
