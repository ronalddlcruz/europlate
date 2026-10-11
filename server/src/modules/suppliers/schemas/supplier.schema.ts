import { z } from 'zod'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const typeSchema = z.enum(['NATIONAL', 'FOREIGN'])
const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
const emptyToNull = (value: unknown) => typeof value === 'string' && !value.trim() ? null : value
const nationalRuc = z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos.')
const foreignTaxId = z.string().trim().min(8).max(20).regex(/^[A-Z0-9-]+$/i, 'El Tax ID solo puede contener letras, números y guiones.')
const phone = z.string().trim().min(6).max(40).regex(/^[0-9+()\-\s]+$/, 'El teléfono solo puede contener números y símbolos de llamada.')

const supplierPayloadBaseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: typeSchema.default('NATIONAL'),
  taxId: z.preprocess(emptyToNull, z.string().trim().min(1).max(20).nullable().optional()),
  phone: z.preprocess(emptyToUndefined, phone.optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(160).optional()),
  status: statusSchema.default('ACTIVE'),
})

const validateTaxId = (value: { type?: 'NATIONAL' | 'FOREIGN'; taxId?: string | null }, context: z.RefinementCtx) => {
  if (!value.type || !value.taxId) return
  const result = value.type === 'NATIONAL' ? nationalRuc.safeParse(value.taxId) : foreignTaxId.safeParse(value.taxId)
  if (!result.success) context.addIssue({ code: z.ZodIssueCode.custom, path: ['taxId'], message: result.error.issues[0]?.message ?? 'Documento inválido.' })
}

export const supplierPayloadSchema = supplierPayloadBaseSchema.superRefine(validateTaxId)

export const createSupplierSchema = supplierPayloadSchema
export const updateSupplierSchema = supplierPayloadBaseSchema.partial().superRefine(validateTaxId)
export const supplierQuerySchema = z.object({ search: z.string().trim().max(160).optional(), status: statusSchema.optional(), type: typeSchema.optional() })

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
