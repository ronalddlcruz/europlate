export type ProductRole = 'Mercadería' | 'Insumo' | 'Producto terminado'
export type ProductStatus = 'Activo' | 'Inactivo'
export interface Attribute { id: string; name: string; type: 'Texto' | 'Numérico'; required: boolean; suffix: string; status?: ProductStatus; useInSubtotal?: boolean }
export interface ProductBase { id: string; code: string; name: string; categoryId?: string | null; subcategoryId?: string | null; categoryName?: string | null; subcategoryName?: string | null; roles: ProductRole[]; status: ProductStatus; variantType: 'Con variantes' | 'Básico'; immediateConsumption?: boolean; attributes: Attribute[] }
export interface ProductVariant { id: string; code: string; baseId: string; values: Record<string, string>; name: string; unit: string; factor: number; minimum: number; stock: number; status: ProductStatus }
export interface Unit { id: string; code: string; description: string; status: ProductStatus }
export interface ProductCategory { id: string; name: string; subcategories: { id: string; name: string }[] }
