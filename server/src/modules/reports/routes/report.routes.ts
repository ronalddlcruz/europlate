import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { reportController } from '../controllers/report.controller.js'

export const reportRoutes = Router()

reportRoutes.use(requireAuthentication)
reportRoutes.get('/dashboard', requirePermission('inventory.read'), reportController.dashboard)
