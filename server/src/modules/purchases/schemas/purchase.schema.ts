import { z } from 'zod'

const status = z.enum(['DRAFT', 'APPROVED', 'RECEIVED', 'CANCELLED'])
const catalogItem = z.object({ productId: z.string().cuid(), presentationId: z.string().cuid(), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().nonnegative() })
const variableItem = z.object({ variableSubcategoryId: z.string().cuid(), name: z.string().trim().min(1).max(160), values: z.record(z.string().trim()).default({}), unitCode: z.string().trim().min(1).max(12), factor: z.coerce.number().positive().default(1), minimumStock: z.coerce.number().nonnegative().default(0), roles: z.array(z.enum(['MERCHANDISE', 'SUPPLY', 'FINISHED_PRODUCT'])).min(1), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().nonnegative() })
const item = z.union([catalogItem, variableItem])
const document = z.object({ fileName: z.string().trim().min(1).max(255), mimeType: z.string().trim().max(120).optional(), size: z.coerce.number().int().nonnegative().optional(), storageKey: z.string().trim().max(500).optional() })
export const purchaseInputSchema = z.object({ supplierId: z.string().cuid(), supplierInvoiceNumber: z.string().trim().min(1).max(80), purchaseDate: z.coerce.date(), receiptDate: z.coerce.date(), currency: z.enum(['PEN', 'USD']).default('PEN'), status: status.default('RECEIVED'), items: z.array(item).min(1), documents: z.array(document).default([]) })
export const updatePurchaseSchema = purchaseInputSchema.partial().extend({ items: z.array(item).min(1).optional(), documents: z.array(document).optional() })
export const purchaseQuerySchema = z.object({ status: status.optional(), supplierId: z.string().cuid().optional(), search: z.string().trim().max(160).optional() })
export type PurchaseInput = z.infer<typeof purchaseInputSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
