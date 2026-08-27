import type { ProductBase, ProductVariant, Unit } from '../types/product.types'

export const initialBases: ProductBase[] = [
  { id: 'base-1', code: 'PRD-001', name: 'Plancha de acero', roles: ['Mercadería'], status: 'Activo', variantType: 'Con variantes', attributes: [{ id: 'a-1', name: 'Espesor', type: 'Numérico', required: true, suffix: ' mm' }, { id: 'a-2', name: 'Medida', type: 'Texto', required: true, suffix: '' }] },
  { id: 'base-2', code: 'PRD-002', name: 'Tubo rectangular', roles: ['Mercadería', 'Insumo'], status: 'Activo', variantType: 'Con variantes', attributes: [{ id: 'a-3', name: 'Medida', type: 'Texto', required: true, suffix: '' }] },
  { id: 'base-3', code: 'PRD-003', name: 'Estructura metálica', roles: ['Producto terminado'], status: 'Activo', variantType: 'Básico', attributes: [] },
]
export const initialVariants: ProductVariant[] = [
  { id: 'variant-1', code: 'VAR-001', baseId: 'base-1', values: { 'a-1': '3', 'a-2': '1.22 × 2.44 m' }, name: 'Plancha de acero 3 mm 1.22 × 2.44 m', unit: 'PLN', factor: 1, minimum: 10, stock: 24, status: 'Activo' },
  { id: 'variant-2', code: 'VAR-002', baseId: 'base-2', values: { 'a-3': '2 × 1 pulg.' }, name: 'Tubo rectangular 2 × 1 pulg.', unit: 'UND', factor: 1, minimum: 15, stock: 8, status: 'Activo' },
  { id: 'variant-3', code: 'VAR-003', baseId: 'base-3', values: {}, name: 'Estructura metálica', unit: 'UND', factor: 1, minimum: 2, stock: 5, status: 'Activo' },
]
export const initialUnits: Unit[] = [{ id: 'u-1', code: 'UND', description: 'Unidad', status: 'Activo' }, { id: 'u-2', code: 'PLN', description: 'Plancha', status: 'Activo' }, { id: 'u-3', code: 'MTR', description: 'Metro', status: 'Activo' }, { id: 'u-4', code: 'CJA', description: 'Caja', status: 'Activo' }]
