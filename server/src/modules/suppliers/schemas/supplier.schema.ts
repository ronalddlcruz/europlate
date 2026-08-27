import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const typeSchema = z.enum(['NATIONAL', 'FOREIGN'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value

export const supplierPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: typeSchema.default('NATIONAL'),
  taxId: z.string().trim().min(1).max(40),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(160).optional()),
  status: statusSchema.default('ACTIVE'),
})

export const createSupplierSchema = supplierPayloadSchema
export const updateSupplierSchema = supplierPayloadSchema.partial()
export const supplierQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional(), type: typeSchema.optional() })

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
