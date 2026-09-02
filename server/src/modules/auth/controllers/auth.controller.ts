import type { Request, Response } from 'express'
import { loginSchema } from '../schemas/auth.schema.js'
import { authService } from '../services/auth.service.js'
export const authController = {
  async login(request: Request, response: Response) { response.json({ data: await authService.login(loginSchema.parse(request.body)) }) },
  async session(request: Request, response: Response) { response.json({ data: await authService.getSession(request.auth!.id) }) },
}
