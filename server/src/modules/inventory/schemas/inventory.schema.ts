import { z } from 'zod'
import { databaseIdSchema } from '../../../shared/schemas/database-id.schema.js'

const productLine = z.object({ productId: databaseIdSchema, presentationId: databaseIdSchema, warehouseId: databaseIdSchema })
export const stockTransferSchema = z.object({ productId: databaseIdSchema, presentationId: databaseIdSchema, fromWarehouseId: databaseIdSchema, toWarehouseId: databaseIdSchema, quantity: z.coerce.number().positive(), note: z.string().trim().max(1_000).optional().nullable() }).superRefine((input, context) => { if (input.fromWarehouseId === input.toWarehouseId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['toWarehouseId'], message: 'El almacén destino debe ser distinto al origen.' }) })
export const inventoryAdjustmentSchema = z.object({
  productId: databaseIdSchema,
  warehouseId: databaseIdSchema,
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().finite().positive('La cantidad debe ser mayor que cero.'),
  customerId: databaseIdSchema.optional().nullable(),
  reason: z.string().trim().min(3).max(1_000),
}).superRefine((input, context) => {
  if (input.type === 'OUT' && !input.customerId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Selecciona el cliente asociado a la salida.' })
}).transform(input => ({ ...input, delta: input.type === 'IN' ? input.quantity : -input.quantity }))
export const warehouseSchema = z.object({ name: z.string().trim().min(2).max(120), location: z.string().trim().max(255).optional().nullable(), description: z.string().trim().max(1_000).optional().nullable(), status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE') })
export const updateWarehouseSchema = warehouseSchema.partial()
export const inventoryQuerySchema = z.object({ search: z.string().trim().max(160).optional(), warehouseId: databaseIdSchema.optional(), status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE') })
export type StockTransferInput = z.infer<typeof stockTransferSchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
export type WarehouseInput = z.infer<typeof warehouseSchema>
