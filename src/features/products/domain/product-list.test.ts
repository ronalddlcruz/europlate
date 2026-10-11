import assert from 'node:assert/strict'
import test from 'node:test'
import { filterProductBases, orderProductBases } from '@/features/products/domain/product-list'
import type {
  ProductBase,
  ProductCategory,
  ProductVariant,
} from '@/features/products/types/product.types'

const category: ProductCategory = {
  id: 'paper',
  code: 'PAP',
  name: 'Papel',
  description: null,
  status: 'Activo',
  attributes: [],
  subcategories: [
    { id: 'foldcote', name: 'Foldcote', status: 'Activo', isVariable: false, attributes: [] },
  ],
}

const bases: ProductBase[] = [
  {
    id: '1',
    code: 'PAP-010',
    name: 'Papel Foldcote',
    categoryId: 'paper',
    subcategoryId: 'foldcote',
    roles: ['Mercadería'],
    status: 'Activo',
    variantType: 'Básico',
    attributes: [],
  },
  {
    id: '2',
    code: 'PAP-002',
    name: 'Papel Bond',
    categoryId: 'paper',
    roles: ['Insumo'],
    status: 'Activo',
    variantType: 'Básico',
    attributes: [],
  },
]

const variants: ProductVariant[] = [
  {
    id: 'v1',
    baseId: '1',
    code: 'v1',
    name: '70 x 100 cm',
    values: { weight: '150' },
    unit: 'PAQ',
    factor: 1,
    minimum: 0,
    stock: 0,
    status: 'Inactivo',
  },
]

test('filtra por palabras internas y medidas sin exigir el nombre completo', () => {
  const result = filterProductBases(bases, variants, [category], {
    role: 'Todos',
    status: 'Todos',
    search: 'foldcote 150',
  })
  assert.deepEqual(
    result.map((base) => base.id),
    ['1'],
  )
})

test('evalúa el estado mostrado por la presentación y conserva el filtro de tipo', () => {
  const result = filterProductBases(bases, variants, [category], {
    role: 'Mercadería',
    status: 'Inactivo',
    search: '',
  })
  assert.deepEqual(
    result.map((base) => base.id),
    ['1'],
  )
})

test('ordena por código numérico sin mutar el catálogo original', () => {
  assert.deepEqual(
    orderProductBases(bases).map((base) => base.code),
    ['PAP-002', 'PAP-010'],
  )
  assert.deepEqual(
    bases.map((base) => base.code),
    ['PAP-010', 'PAP-002'],
  )
})
