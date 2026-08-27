import { z } from 'zod'

const productStatus = z.enum(['ACTIVE', 'INACTIVE'])
const productRole = z.enum(['MERCHANDISE', 'SUPPLY', 'FINISHED_PRODUCT'])
const variantType = z.enum(['WITH_VARIANTS', 'BASIC'])
const attributeType = z.enum(['TEXT', 'NUMBER'])

const attributeSchema = z.object({ name: z.string().trim().min(1).max(80), dataType: attributeType.default('TEXT'), suffix: z.string().trim().max(20).optional().nullable(), required: z.boolean().default(false), status: productStatus.default('ACTIVE'), useInSubtotal: z.boolean().default(false) })
const presentationSchema = z.object({ code: z.string().trim().min(1).max(40).optional(), name: z.string().trim().min(1).max(160), unitId: z.string().cuid().optional(), unitCode: z.string().trim().min(1).max(12).optional(), factor: z.coerce.number().positive().default(1), minimumStock: z.coerce.number().nonnegative().default(0), currentStock: z.coerce.number().nonnegative().default(0), status: productStatus.default('ACTIVE') }).refine(value => value.unitId || value.unitCode, { message: 'Selecciona una unidad de inventario.', path: ['unitId'] })

const productPayloadSchema = z.object({ code: z.string().trim().min(1).max(40).optional(), name: z.string().trim().min(1).max(160), categoryId: z.string().cuid().optional().nullable(), subcategoryId: z.string().cuid().optional().nullable(), brandId: z.string().cuid().optional().nullable(), status: productStatus.default('ACTIVE'), roles: z.array(productRole).min(1), variantType: variantType.default('WITH_VARIANTS'), immediateConsumption: z.boolean().default(true), attributes: z.array(attributeSchema).default([]), presentations: z.array(presentationSchema).default([]) })
export const createProductSchema = productPayloadSchema.superRefine((value, context) => { if (value.variantType === 'BASIC' && value.presentations.length > 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['presentations'], message: 'Un producto básico admite una sola presentación.' }) })
export const updateProductSchema = productPayloadSchema.partial().extend({ roles: z.array(productRole).min(1).optional(), attributes: z.array(attributeSchema).optional(), presentations: z.array(presentationSchema).optional() })
export const createUnitSchema = z.object({ code: z.string().trim().min(1).max(12).transform(value => value.toUpperCase()), description: z.string().trim().min(1).max(80), status: productStatus.default('ACTIVE') })
export const updateUnitSchema = createUnitSchema.partial()
export const productQuerySchema = z.object({ search: z.string().trim().optional(), status: productStatus.optional(), role: productRole.optional() })
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateUnitInput = z.infer<typeof createUnitSchema>
