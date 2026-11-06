import assert from 'node:assert/strict'
import test from 'node:test'
import { setOpeningStockSchema } from './product.schema.js'

test('permite corregir a cero y conservar el costo en la moneda elegida', () => {
  assert.deepEqual(
    setOpeningStockSchema.parse({ quantity: 0, currency: 'USD', unitCost: 12.3456 }),
    { quantity: 0, currency: 'USD', unitCost: 12.3456 },
  )
})

test('rechaza saldos negativos y precisión mayor que la admitida por la base', () => {
  for (const input of [
    { quantity: -1, currency: 'PEN', unitCost: 1 },
    { quantity: 1.0001, currency: 'PEN', unitCost: 1 },
    { quantity: 1, currency: 'PEN', unitCost: 1.00001 },
  ]) {
    assert.equal(setOpeningStockSchema.safeParse(input).success, false)
  }
})
