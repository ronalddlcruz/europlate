import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
export const authRoutes = Router()
authRoutes.post('/login', authController.login)
