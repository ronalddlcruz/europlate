import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { importController } from '../controllers/import.controller.js'

export const importRoutes = Router()
importRoutes.use(requireAuthentication)
importRoutes.get('/', requirePermission('imports.read'), importController.list)
importRoutes.get('/catalog', requirePermission('imports.read'), importController.catalog)
importRoutes.post('/', requirePermission('imports.manage'), importController.create)
importRoutes.get('/:id', requirePermission('imports.read'), importController.get)
importRoutes.patch('/:id', requirePermission('imports.manage'), importController.update)
importRoutes.post('/:id/receive', requirePermission('imports.manage'), importController.receive)
importRoutes.delete('/:id', requirePermission('imports.manage'), importController.remove)
