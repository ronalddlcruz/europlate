import { z } from 'zod'
import { AUTH_PASSWORD_LENGTH } from '../constants/auth.constants.js'

export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(AUTH_PASSWORD_LENGTH.min).max(AUTH_PASSWORD_LENGTH.max) })
export type LoginInput = z.infer<typeof loginSchema>
