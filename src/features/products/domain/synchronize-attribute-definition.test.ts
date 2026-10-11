import assert from 'node:assert/strict'
import test from 'node:test'
import { synchronizeAttributeDefinition } from '@/features/products/domain/synchronize-attribute-definition'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { AttributeDefinition } from '@/features/products/types/product.types'

const catalog: CatalogData = {
  attributes: [
    {
      id: 'definition',
      code: 'PES',
      name: 'Peso',
      type: 'Numérico',
      suffix: 'kg',
      status: 'Activo',
      isWeight: true,
    },
  ],
  categories: [
    {
      id: 'category',
      name: 'Papel',
      status: 'Activo',
      code: 'PAP',
      description: null,
      attributes: [
        {
          id: 'configured',
          definitionId: 'definition',
          name: 'Peso',
          type: 'Numérico',
          required: false,
          suffix: 'kg',
          status: 'Activo',
          isWeight: true,
        },
      ],
      subcategories: [],
    },
  ],
  products: [
    {
      base: {
        id: 'product',
        code: 'PAP-001',
        name: 'Papel 2 kg',
        roles: ['Mercadería'],
        status: 'Activo',
        variantType: 'Básico',
        attributes: [
          {
            id: 'snapshot',
            definitionId: 'definition',
            name: 'Peso',
            type: 'Numérico',
            required: false,
            suffix: 'kg',
            definitionStatus: 'Activo',
          },
        ],
      },
      variants: [],
    },
  ],
  units: [],
}

test('actualiza configuración y estado sin reescribir el nombre histórico del producto', () => {
  const definition: AttributeDefinition = {
    ...catalog.attributes[0],
    name: 'Gramaje',
    suffix: 'g',
    status: 'Inactivo',
    isWeight: false,
  }
  const updated = synchronizeAttributeDefinition(catalog, definition)

  assert.equal(updated.categories[0].attributes[0].name, 'Gramaje')
  assert.equal(updated.categories[0].attributes[0].definitionStatus, 'Inactivo')
  assert.equal(updated.products[0].base.name, 'Papel 2 kg')
  assert.equal(updated.products[0].base.attributes[0].name, 'Peso')
  assert.equal(updated.products[0].base.attributes[0].definitionStatus, 'Inactivo')
  assert.equal(catalog.products[0].base.attributes[0].definitionStatus, 'Activo')
})
