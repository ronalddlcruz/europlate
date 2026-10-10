import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { reportController } from '../controllers/report.controller.js'

export const reportRoutes = Router()

reportRoutes.use(requireAuthentication)
reportRoutes.get('/dashboard', requirePermission('inventory.read'), reportController.dashboard)
reportRoutes.get('/stock', requirePermission('inventory.read'), reportController.stock)
reportRoutes.get('/movements', requirePermission('inventory.read'), reportController.movements)
reportRoutes.get('/purchases', requirePermission('inventory.read'), reportController.purchases)
reportRoutes.get('/production', requirePermission('inventory.read'), reportController.production)
