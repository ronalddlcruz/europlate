import { z } from 'zod'

const emptyToUndefined = (value: unknown) => typeof value === 'string' && !value.trim() ? undefined : value
export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
export const userPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100).optional(),
  roleId: z.string().min(1),
  status: userStatusSchema.default('ACTIVE'),
})
export const createUserSchema = userPayloadSchema.refine(value => Boolean(value.password), { message: 'La contraseña es obligatoria.', path: ['password'] })
export const updateUserSchema = userPayloadSchema.partial().omit({ password: true }).extend({ password: z.preprocess(emptyToUndefined, z.string().min(8).max(100).optional()) })
export const rolePermissionsSchema = z.object({ permissionIds: z.array(z.string().min(1)).max(100) })
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
