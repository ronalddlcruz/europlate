import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
const ruc = z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos.')
const optionalText = (max: number) => z.string().trim().max(max).default('')
const optionalEmail = z.string().trim().max(160).refine(value => !value || z.string().email().safeParse(value).success, 'Ingresa un correo electrónico válido.').default('')

export const customerPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ruc: z.preprocess(emptyToUndefined, ruc.optional()),
  phone: optionalText(40),
  email: optionalEmail,
  address: optionalText(240),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  status: statusSchema.default('ACTIVE'),
})

export const createCustomerSchema = customerPayloadSchema
export const updateCustomerSchema = customerPayloadSchema.partial()
export const customerQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional() })
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
