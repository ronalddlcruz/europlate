import { z } from 'zod'
import { databaseIdSchema } from '../../../shared/schemas/database-id.schema.js'

const status = z.enum(['IN_TRANSIT', 'RECEIVED', 'CANCELLED'])
const weightInput = {
  weightAttributeId: databaseIdSchema.optional(),
  weightValue: z.coerce.number().positive().optional(),
}
const catalogItem = z.object({
  productId: z.string().trim().min(1),
  presentationId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitCostUsd: z.coerce.number().nonnegative(),
  ...weightInput,
})
const variableItem = z.object({
  variableSubcategoryId: databaseIdSchema, name: z.string().trim().min(1).max(160), values: z.record(z.string().trim()).default({}), unitCode: z.string().trim().min(1).max(12), factor: z.coerce.number().positive().default(1), minimumStock: z.coerce.number().nonnegative().default(0), roles: z.array(z.enum(['MERCHANDISE', 'SUPPLY', 'FINISHED_PRODUCT'])).min(1), warehouseId: databaseIdSchema, quantity: z.coerce.number().positive(), unitCostUsd: z.coerce.number().nonnegative(), ...weightInput,
})
const item = z.union([catalogItem, variableItem])
const document = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(120).optional(),
  size: z.coerce.number().int().nonnegative().optional(),
  storageKey: z.string().trim().max(500).optional(),
  linkUrl: z.string().url().max(500).optional(),
})

export const importInputSchema = z.object({
  supplierId: z.string().trim().min(1),
  customsAgentId: z.string().trim().min(1).optional().nullable(),
  containerNumber: z.string().trim().min(1).max(80),
  duaNumber: z.string().trim().min(1).max(100),
  purchaseOrderNumber: z.string().trim().min(1).max(100),
  countryOfOrigin: z.string().trim().min(1).max(100),
  status: status.default('RECEIVED'),
  currency: z.enum(['USD', 'PEN']).default('USD'),
  arrivalDate: z.coerce.date().optional().nullable(),
  customsCostUsd: z.coerce.number().nonnegative().default(0),
  customsCostPen: z.coerce.number().nonnegative().default(0),
  items: z.array(item).min(1),
  documents: z.array(document).default([]),
})

export const updateImportSchema = importInputSchema.partial().extend({
  items: z.array(item).min(1).optional(),
  documents: z.array(document).optional(),
})
export const importQuerySchema = z.object({
  status: status.optional(),
  supplierId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(160).optional(),
})

export type ImportInput = z.infer<typeof importInputSchema>
export type UpdateImportInput = z.infer<typeof updateImportSchema>
