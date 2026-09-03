import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { customerController } from '../controllers/customer.controller.js'

export const customerRoutes = Router()
customerRoutes.use(requireAuthentication)
customerRoutes.get('/', requirePermission('customers.read'), customerController.list)
customerRoutes.post('/', requirePermission('customers.manage'), customerController.create)
customerRoutes.get('/:id', requirePermission('customers.read'), customerController.get)
customerRoutes.patch('/:id', requirePermission('customers.manage'), customerController.update)
customerRoutes.delete('/:id', requirePermission('customers.manage'), customerController.remove)
