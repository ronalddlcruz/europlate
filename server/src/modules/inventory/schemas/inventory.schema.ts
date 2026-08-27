import { z } from 'zod'
export const stockTransferSchema = z.object({ productId: z.string().cuid(), fromWarehouseId: z.string().cuid(), toWarehouseId: z.string().cuid(), quantity: z.coerce.number().positive() })
