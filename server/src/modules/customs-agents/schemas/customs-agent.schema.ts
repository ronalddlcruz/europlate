import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
const ruc = z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos.')
const phone = z.string().trim().min(6).max(40).regex(/^[0-9+()\-\s]+$/, 'El teléfono solo puede contener números y símbolos de llamada.')
export const customsAgentPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ruc: z.preprocess(emptyToUndefined, ruc.optional()),
  contactName: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  phone: z.preprocess(emptyToUndefined, phone.optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(160).optional()),
  status: statusSchema.default('ACTIVE'),
})
export const createCustomsAgentSchema = customsAgentPayloadSchema
export const updateCustomsAgentSchema = customsAgentPayloadSchema.partial()
export const customsAgentQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional() })
export type CreateCustomsAgentInput = z.infer<typeof createCustomsAgentSchema>
export type UpdateCustomsAgentInput = z.infer<typeof updateCustomsAgentSchema>
