import { z } from 'zod'

export const loginInputSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128),
})

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  companyId: z.string(),
  permissions: z.array(z.string()),
})

export const sessionResponseSchema = z.object({
  user: authUserSchema,
})

export const loginResponseSchema = sessionResponseSchema.extend({
  accessToken: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type Session = z.infer<typeof loginResponseSchema>
