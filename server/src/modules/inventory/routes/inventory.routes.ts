import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { inventoryController } from '../controllers/inventory.controller.js'
import { requireGlobalAccess } from '../../../shared/security/operation-scope.js'
export const inventoryRoutes = Router()
inventoryRoutes.use(requireAuthentication)
inventoryRoutes.get('/stock', requirePermission('inventory.read'), inventoryController.stock)
inventoryRoutes.get('/movements', requirePermission('inventory.read'), inventoryController.movements)
inventoryRoutes.get('/transfers', requirePermission('inventory.read'), inventoryController.transfers)
inventoryRoutes.get('/adjustments', requirePermission('inventory.read'), inventoryController.adjustments)
inventoryRoutes.get('/warehouses', requirePermission('inventory.read'), inventoryController.warehouses)
inventoryRoutes.get('/warehouse-responsibles', requirePermission('users.manage'), requireGlobalAccess, inventoryController.warehouseResponsibles)
inventoryRoutes.get('/catalog', requirePermission('inventory.read'), inventoryController.catalog)
inventoryRoutes.post('/transfers', requirePermission('inventory.manage'), inventoryController.createTransfer)
inventoryRoutes.post('/adjustments', requirePermission('inventory.manage'), inventoryController.createAdjustment)
inventoryRoutes.post('/warehouses', requirePermission('users.manage'), requireGlobalAccess, inventoryController.createWarehouse)
inventoryRoutes.patch('/warehouses/:id', requirePermission('users.manage'), requireGlobalAccess, inventoryController.updateWarehouse)
inventoryRoutes.delete('/warehouses/:id', requirePermission('users.manage'), requireGlobalAccess, inventoryController.removeWarehouse)
