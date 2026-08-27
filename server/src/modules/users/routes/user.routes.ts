import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { userController } from '../controllers/user.controller.js'
export const userRoutes = Router()
userRoutes.use(requireAuthentication)
userRoutes.get('/', requirePermission('users.read'), userController.list)
userRoutes.get('/catalog', requirePermission('users.read'), userController.catalog)
userRoutes.get('/audit', requirePermission('users.read'), userController.audit)
userRoutes.post('/', requirePermission('users.manage'), userController.create)
userRoutes.patch('/:id', requirePermission('users.manage'), userController.update)
userRoutes.delete('/:id', requirePermission('users.manage'), userController.remove)
userRoutes.put('/roles/:id/permissions', requirePermission('users.manage'), userController.updateRolePermissions)
