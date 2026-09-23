import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
const ruc = z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos.')

export const customerPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ruc: z.preprocess(emptyToUndefined, ruc.optional()),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(160),
  address: z.string().trim().min(1).max(240),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  status: statusSchema.default('ACTIVE'),
})

export const createCustomerSchema = customerPayloadSchema
export const updateCustomerSchema = customerPayloadSchema.partial()
export const customerQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional() })
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
