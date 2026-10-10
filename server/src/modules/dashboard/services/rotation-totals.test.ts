import assert from 'node:assert/strict'
import test from 'node:test'
import { topRotatingProducts } from './rotation-totals.js'

test('la rotación usa salidas y consumo, no carga inicial ni transferencias', () => {
  const rows = [
    { type: 'INITIAL_STOCK', productId: 'a', code: 'A', product: 'A', quantity: 1000, createdAt: '2026-10-01' },
    { type: 'PURCHASE_RECEIPT', productId: 'a', code: 'A', product: 'A', quantity: 100, createdAt: '2026-10-01' },
    { type: 'TRANSFER_OUT', productId: 'a', code: 'A', product: 'A', quantity: -50, createdAt: '2026-10-01' },
    { type: 'ADJUSTMENT_OUT', productId: 'a', code: 'A', product: 'A', quantity: -4, createdAt: '2026-10-02' },
    { type: 'PRODUCTION_CONSUMPTION', productId: 'a', code: 'A', product: 'A', quantity: -6, createdAt: '2026-10-03' },
    { type: 'ADJUSTMENT_WASTE', productId: 'b', code: 'B', product: 'B', quantity: -80, createdAt: '2026-10-03' },
    { type: 'ADJUSTMENT_OUT', productId: 'b', code: 'B', product: 'B', quantity: -2, createdAt: '2026-09-30' },
  ]
  assert.deepEqual(topRotatingProducts(rows, '2026-10'), [{ productId: 'a', code: 'A', name: 'A', units: 10, outboundUnits: 4, consumedUnits: 6, movements: 2 }])
})

test('ubica cada movimiento en el mes calendario de Perú', () => {
  const rows = [
    { type: 'ADJUSTMENT_OUT', productId: 'a', code: 'A', product: 'A', quantity: -2, createdAt: '2026-10-01T02:00:00.000Z' },
    { type: 'ADJUSTMENT_OUT', productId: 'a', code: 'A', product: 'A', quantity: -3, createdAt: '2026-10-01T06:00:00.000Z' },
  ]
  assert.equal(topRotatingProducts(rows, '2026-09')[0]?.units, 2)
  assert.equal(topRotatingProducts(rows, '2026-10')[0]?.units, 3)
})
