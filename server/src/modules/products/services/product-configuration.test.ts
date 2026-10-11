import assert from 'node:assert/strict'
import test from 'node:test'
import { productRepository } from '../repositories/product.repository.js'
import { productService } from './product.service.js'

test('la configuración de categorías conserva códigos, atributos y contrato del servicio', async () => {
  const findByName = productRepository.findCategoryByName
  const create = productRepository.createCategory
  let createInput: unknown
  productRepository.findCategoryByName = (async () => null) as unknown as typeof findByName
  productRepository.createCategory = (async (input: unknown) => {
    createInput = input
    return { id: 'category-1' }
  }) as unknown as typeof create
  try {
    const result = await productService.createCategory({
      name: 'Cajas', status: 'ACTIVE', attributes: [],
      subcategories: [
        { name: 'Pizza', status: 'ACTIVE', isVariable: false, attributes: [] },
        { name: 'Pizza', status: 'ACTIVE', isVariable: false, attributes: [] },
      ],
    })
    assert.equal(result.id, 'category-1')
    assert.deepEqual(createInput, {
      code: null, name: 'Cajas', description: null, status: 'ACTIVE', attributes: { create: [] },
      subcategories: { create: [
        { code: 'PIZ', name: 'Pizza', description: null, status: 'ACTIVE', isVariable: false, attributes: { create: [] } },
        { code: 'PIZ-2', name: 'Pizza', description: null, status: 'ACTIVE', isVariable: false, attributes: { create: [] } },
      ] },
    })
  } finally {
    productRepository.findCategoryByName = findByName
    productRepository.createCategory = create
  }
})

test('retirar un atributo conserva la desactivación a través de la fachada de productos', async () => {
  const update = productService.updateAttributeDefinition
  let call: unknown
  productService.updateAttributeDefinition = (async (id: string, input: unknown) => {
    call = { id, input }
    return { id, status: 'INACTIVE' }
  }) as unknown as typeof update
  try {
    await productService.removeAttributeDefinition('attribute-1')
    assert.deepEqual(call, { id: 'attribute-1', input: { status: 'INACTIVE' } })
  } finally {
    productService.updateAttributeDefinition = update
  }
})
