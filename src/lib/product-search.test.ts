import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesProductSearch } from './product-search'

test('busca insumos por palabras internas, medidas y tildes en cualquier orden', () => {
  const name = 'Papel Foldcote 70 x 100 cm 150 g/m² 250 pliegos'
  assert.equal(matchesProductSearch(name, 'foldcote 150'), true)
  assert.equal(matchesProductSearch(name, '250 papel'), true)
  assert.equal(matchesProductSearch(name, '70x100'), true)
  assert.equal(matchesProductSearch('Barniz sintético', 'sintetico'), true)
  assert.equal(matchesProductSearch(name, '345'), false)
})
