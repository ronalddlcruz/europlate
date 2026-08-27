import { z } from 'zod'

const status = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
const material = z.object({ productId: z.string().cuid(), presentationId: z.string().cuid(), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), immediateConsumption: z.boolean().default(false) })

export const productionOrderSchema = z.object({
  productId: z.string().cuid(), presentationId: z.string().cuid(), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), scheduledAt: z.coerce.date(), note: z.string().trim().max(1_000).optional().nullable(), status: z.enum(['PLANNED', 'IN_PROGRESS']).default('IN_PROGRESS'), materials: z.array(material).min(1),
})
export const updateProductionOrderSchema = productionOrderSchema.partial().extend({ materials: z.array(material).min(1).optional() })
export const completeProductionOrderSchema = z.object({ outputDispatched: z.boolean().default(false), outputJustification: z.string().trim().max(1_000).optional().nullable() }).superRefine((input, context) => { if (input.outputDispatched && !input.outputJustification) context.addIssue({ code: z.ZodIssueCode.custom, path: ['outputJustification'], message: 'La justificación de la salida es obligatoria.' }) })
export const productionQuerySchema = z.object({ status: status.optional(), search: z.string().trim().max(160).optional() })
export type ProductionOrderInput = z.infer<typeof productionOrderSchema>
export type UpdateProductionOrderInput = z.infer<typeof updateProductionOrderSchema>
export type CompleteProductionOrderInput = z.infer<typeof completeProductionOrderSchema>
