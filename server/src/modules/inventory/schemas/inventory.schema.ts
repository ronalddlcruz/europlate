import { z } from 'zod'
import { databaseIdSchema } from '../../../shared/schemas/database-id.schema.js'

const productLine = z.object({ productId: databaseIdSchema, presentationId: databaseIdSchema, warehouseId: databaseIdSchema })
export const stockTransferSchema = z.object({ productId: databaseIdSchema, fromWarehouseId: databaseIdSchema, toWarehouseId: databaseIdSchema, quantity: z.coerce.number().positive(), note: z.string().trim().max(1_000).optional().nullable() }).superRefine((input, context) => { if (input.fromWarehouseId === input.toWarehouseId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['toWarehouseId'], message: 'El almacén destino debe ser distinto al origen.' }) })
export const inventoryAdjustmentSchema = z.object({
  productId: databaseIdSchema,
  warehouseId: databaseIdSchema,
  type: z.enum(['IN', 'OUT', 'WASTE']),
  quantity: z.coerce.number().finite().positive('La cantidad debe ser mayor que cero.'),
  customerId: databaseIdSchema.optional().nullable(),
  reason: z.string().trim().min(3).max(1_000),
}).transform(input => ({ ...input, customerId: input.type === 'WASTE' ? null : input.customerId, delta: input.type === 'IN' ? input.quantity : -input.quantity }))
const optionalLocationField = z.string().trim().max(120).optional().nullable()
export const warehouseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  // location se mantiene solo para compatibilidad con registros y clientes antiguos.
  location: z.string().trim().max(255).optional().nullable(),
  department: optionalLocationField,
  province: optionalLocationField,
  district: optionalLocationField,
  address: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(1_000).optional().nullable(),
  responsibleUserId: databaseIdSchema.optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})
export const updateWarehouseSchema = warehouseSchema.partial()
export const inventoryQuerySchema = z.object({ search: z.string().trim().max(160).optional(), warehouseId: databaseIdSchema.optional(), status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE') })
export type StockTransferInput = z.infer<typeof stockTransferSchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
export type WarehouseInput = z.infer<typeof warehouseSchema>
