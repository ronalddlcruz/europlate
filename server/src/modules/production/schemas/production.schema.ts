import { z } from 'zod'
export const productionOrderSchema = z.object({ productId: z.string().cuid(), quantity: z.coerce.number().positive(), scheduledAt: z.coerce.date(), materials: z.array(z.object({ productId: z.string().cuid(), quantity: z.coerce.number().positive() })).min(1) })
