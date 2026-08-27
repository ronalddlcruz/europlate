import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { purchaseController } from '../controllers/purchase.controller.js'
export const purchaseRoutes = Router()
purchaseRoutes.use(requireAuthentication)
purchaseRoutes.get('/', requirePermission('purchases.read'), purchaseController.list)
purchaseRoutes.get('/catalog', requirePermission('purchases.read'), purchaseController.catalog)
purchaseRoutes.post('/', requirePermission('purchases.manage'), purchaseController.create)
purchaseRoutes.get('/:id', requirePermission('purchases.read'), purchaseController.get)
purchaseRoutes.patch('/:id', requirePermission('purchases.manage'), purchaseController.update)
purchaseRoutes.post('/:id/receive', requirePermission('purchases.manage'), purchaseController.receive)
purchaseRoutes.delete('/:id', requirePermission('purchases.manage'), purchaseController.remove)
