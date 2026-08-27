import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { productionController } from '../controllers/production.controller.js'
export const productionRoutes = Router()
productionRoutes.use(requireAuthentication)
productionRoutes.get('/', requirePermission('production.read'), productionController.list)
productionRoutes.get('/catalog', requirePermission('production.read'), productionController.catalog)
productionRoutes.post('/', requirePermission('production.manage'), productionController.create)
productionRoutes.get('/:id', requirePermission('production.read'), productionController.get)
productionRoutes.patch('/:id', requirePermission('production.manage'), productionController.update)
productionRoutes.post('/:id/complete', requirePermission('production.manage'), productionController.complete)
productionRoutes.delete('/:id', requirePermission('production.manage'), productionController.remove)
