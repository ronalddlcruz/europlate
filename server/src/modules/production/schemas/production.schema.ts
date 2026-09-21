import { z } from 'zod'

const status = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
const material = z.object({ productId: z.string().cuid(), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), immediateConsumption: z.boolean().default(false), shareReservation: z.boolean().default(false) }).superRefine((input, context) => { if (input.immediateConsumption && input.shareReservation) context.addIssue({ code: z.ZodIssueCode.custom, path: ['shareReservation'], message: 'Un insumo inmediato no puede compartir una reserva.' }) })

const productionOrderBaseSchema = z.object({
  productId: z.string().cuid(), warehouseId: z.string().cuid(), quantity: z.coerce.number().positive(), scheduledAt: z.coerce.date(), note: z.string().trim().max(1_000).optional().nullable(), outputDispatched: z.boolean().default(false), outputJustification: z.string().trim().max(1_000).optional().nullable(), outputCustomerId: z.string().cuid().optional().nullable(), materials: z.array(material).min(1),
})
export const productionOrderSchema = productionOrderBaseSchema.superRefine((input, context) => { if (input.outputDispatched && !input.outputJustification) context.addIssue({ code: z.ZodIssueCode.custom, path: ['outputJustification'], message: 'La justificación de la salida es obligatoria.' }); if (input.outputDispatched && !input.outputCustomerId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['outputCustomerId'], message: 'Selecciona el cliente de la salida.' }) })
export const updateProductionOrderSchema = productionOrderBaseSchema.partial().extend({ materials: z.array(material).min(1).optional() })
export const completeProductionOrderSchema = z.object({ outputDispatched: z.boolean().default(false), outputJustification: z.string().trim().max(1_000).optional().nullable(), outputCustomerId: z.string().cuid().optional().nullable() }).superRefine((input, context) => { if (input.outputDispatched && !input.outputJustification) context.addIssue({ code: z.ZodIssueCode.custom, path: ['outputJustification'], message: 'La justificación de la salida es obligatoria.' }); if (input.outputDispatched && !input.outputCustomerId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['outputCustomerId'], message: 'Selecciona el cliente de la salida.' }) })
export const productionQuerySchema = z.object({ status: status.optional(), search: z.string().trim().max(160).optional() })
export type ProductionOrderInput = z.infer<typeof productionOrderSchema>
export type UpdateProductionOrderInput = z.infer<typeof updateProductionOrderSchema>
export type CompleteProductionOrderInput = z.infer<typeof completeProductionOrderSchema>
