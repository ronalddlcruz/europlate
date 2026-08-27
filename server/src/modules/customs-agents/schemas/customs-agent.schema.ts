import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
export const customsAgentPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  ruc: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  contactName: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(160).optional()),
  status: statusSchema.default('ACTIVE'),
})
export const createCustomsAgentSchema = customsAgentPayloadSchema
export const updateCustomsAgentSchema = customsAgentPayloadSchema.partial()
export const customsAgentQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional() })
export type CreateCustomsAgentInput = z.infer<typeof createCustomsAgentSchema>
export type UpdateCustomsAgentInput = z.infer<typeof updateCustomsAgentSchema>
