import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
export const authRoutes = Router()
authRoutes.post('/login', authController.login)
authRoutes.get('/session', requireAuthentication, authController.session)
