import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateImportLineSubtotal } from './import-line-calculator.js'

test('STANDARD calcula cantidad por costo unitario', () => {
  assert.equal(calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: 10, unitCostUsd: 0.75 }).toString(), '7.5')
})

test('WEIGHT_BASED calcula peso por cantidad por costo unitario y redondea moneda', () => {
  assert.equal(calculateImportLineSubtotal({ calculationType: 'WEIGHT_BASED', weight: 650, quantity: 10, unitCostUsd: 0.75 }).toString(), '4875')
  assert.equal(calculateImportLineSubtotal({ calculationType: 'WEIGHT_BASED', weight: 1.235, quantity: 1, unitCostUsd: 1 }).toString(), '1.24')
})

test('valores vacíos, cero inválido para peso o negativos no generan subtotales inválidos', () => {
  assert.equal(calculateImportLineSubtotal({ calculationType: 'WEIGHT_BASED', weight: 0, quantity: 1, unitCostUsd: 2 }).toString(), '0')
  assert.equal(calculateImportLineSubtotal({ calculationType: 'WEIGHT_BASED', weight: undefined, quantity: 1, unitCostUsd: 2 }).toString(), '0')
  assert.equal(calculateImportLineSubtotal({ calculationType: 'STANDARD', quantity: -1, unitCostUsd: 2 }).toString(), '0')
})
