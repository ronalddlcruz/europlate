import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { dashboardController } from '../controllers/dashboard.controller.js'

export const dashboardRoutes = Router()
dashboardRoutes.use(requireAuthentication)
dashboardRoutes.get('/summary', dashboardController.summary)
