import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeMonths, totalInPen } from './purchase-totals.js'

test('suma compras nacionales e importaciones, convirtiendo USD a soles', () => {
  const documents = [
    { currency: 'PEN', total: 100, status: 'RECEIVED', date: '2026-10-01' },
    { currency: 'USD', total: 50, status: 'RECEIVED', date: '2026-10-02' },
  ]
  assert.equal(totalInPen(documents, 3.5), 275)
})

test('no inventa una valorización en soles si falta tipo de cambio', () => {
  assert.equal(totalInPen([{ currency: 'USD', total: 50, status: 'RECEIVED', date: '2026-10-02' }], 0), 0)
})

test('desglosa compras e importaciones por mes, sin contar anuladas', () => {
  const months = summarizeMonths(
    [{ currency: 'PEN', total: 100, status: 'RECEIVED', date: '2026-10-01' }, { currency: 'PEN', total: 40, status: 'CANCELLED', date: '2026-10-02' }],
    [{ currency: 'USD', total: 50, status: 'IN_TRANSIT', date: '2026-10-03' }],
    ['2026-09', '2026-10'], 3.5,
  )
  assert.deepEqual(months[0], { period: '2026-09', nationalPen: 0, importsPen: 0, nationalCount: 0, importCount: 0, nationalUnconvertedUsd: 0, importsUnconvertedUsd: 0, totalPen: 0 })
  assert.deepEqual(months[1], { period: '2026-10', nationalPen: 100, importsPen: 175, nationalCount: 1, importCount: 1, nationalUnconvertedUsd: 0, importsUnconvertedUsd: 0, totalPen: 275 })
})

test('conserva el importe USD sin convertir cuando falta tipo de cambio', () => {
  const [month] = summarizeMonths([], [{ currency: 'USD', total: 50, status: 'RECEIVED', date: '2026-10-03' }], ['2026-10'], 0)
  assert.equal(month.totalPen, 0)
  assert.equal(month.importsUnconvertedUsd, 50)
  assert.equal(month.importCount, 1)
})

test('el indicador suma una compra y una importación reales sin duplicar cantidades', () => {
  const [month] = summarizeMonths(
    [{ currency: 'PEN', total: 2000, status: 'RECEIVED', date: '2026-10-08' }],
    [{ currency: 'USD', total: 2000, status: 'RECEIVED', date: '2026-10-08' }],
    ['2026-10'], 3.4426,
  )
  assert.equal(month.nationalCount, 1)
  assert.equal(month.importCount, 1)
  assert.equal(month.totalPen, 8885.2)
})
