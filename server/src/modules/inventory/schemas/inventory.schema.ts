import { z } from 'zod'

const productLine = z.object({ productId: z.string().cuid(), presentationId: z.string().cuid(), warehouseId: z.string().cuid() })
export const stockTransferSchema = z.object({ productId: z.string().cuid(), presentationId: z.string().cuid(), fromWarehouseId: z.string().cuid(), toWarehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), note: z.string().trim().max(1_000).optional().nullable() }).superRefine((input, context) => { if (input.fromWarehouseId === input.toWarehouseId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['toWarehouseId'], message: 'El almacén destino debe ser distinto al origen.' }) })
export const inventoryAdjustmentSchema = productLine.extend({ delta: z.coerce.number().refine(value => value !== 0, 'El ajuste debe ser distinto de cero.'), reason: z.string().trim().min(3).max(1_000) })
export const warehouseSchema = z.object({ name: z.string().trim().min(2).max(120), location: z.string().trim().max(255).optional().nullable(), description: z.string().trim().max(1_000).optional().nullable(), status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE') })
export const updateWarehouseSchema = warehouseSchema.partial()
export const inventoryQuerySchema = z.object({ search: z.string().trim().max(160).optional(), warehouseId: z.string().cuid().optional() })
export type StockTransferInput = z.infer<typeof stockTransferSchema>
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>
export type WarehouseInput = z.infer<typeof warehouseSchema>
