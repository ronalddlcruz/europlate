import assert from 'node:assert/strict'
import test from 'node:test'
import { ProductStatus } from '@prisma/client'
import { productRepository } from '../repositories/product.repository.js'
import { productService } from './product.service.js'

test('busca solo la categoría propietaria y conserva el nombre dinámico', async () => {
  const lookup = productRepository.findCategoryBySubcategoryId
  const create = productService.create
  let searchedId = ''
  let createdName = ''
  productRepository.findCategoryBySubcategoryId = (async (id: string) => {
    searchedId = id
    return {
      id: 'category-1', name: 'Papel', attributes: [],
      subcategories: [{ id: 'subcategory-1', name: 'Bond', isVariable: true, attributes: [] }],
    }
  }) as unknown as typeof lookup
  productService.create = async (input) => {
    createdName = input.name
    return { id: 'product-1' } as never
  }
  try {
    const result = await productService.createFromVariableSubcategory({
      subcategoryId: 'subcategory-1', values: {}, unitId: 'unit-1', factor: 1,
      minimumStock: 0, currentStock: 0, roles: ['MERCHANDISE'], status: ProductStatus.ACTIVE,
    })
    assert.equal(searchedId, 'subcategory-1')
    assert.equal(createdName, 'Papel Bond')
    assert.equal(result.id, 'product-1')
  } finally {
    productRepository.findCategoryBySubcategoryId = lookup
    productService.create = create
  }
})
