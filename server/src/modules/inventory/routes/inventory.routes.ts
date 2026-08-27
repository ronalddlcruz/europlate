import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { inventoryController } from '../controllers/inventory.controller.js'
export const inventoryRoutes = Router()
inventoryRoutes.use(requireAuthentication)
inventoryRoutes.get('/stock', requirePermission('inventory.read'), inventoryController.stock)
inventoryRoutes.get('/movements', requirePermission('inventory.read'), inventoryController.movements)
inventoryRoutes.get('/transfers', requirePermission('inventory.read'), inventoryController.transfers)
inventoryRoutes.get('/adjustments', requirePermission('inventory.read'), inventoryController.adjustments)
inventoryRoutes.get('/warehouses', requirePermission('inventory.read'), inventoryController.warehouses)
inventoryRoutes.get('/catalog', requirePermission('inventory.read'), inventoryController.catalog)
inventoryRoutes.post('/transfers', requirePermission('inventory.manage'), inventoryController.createTransfer)
inventoryRoutes.post('/adjustments', requirePermission('inventory.manage'), inventoryController.createAdjustment)
inventoryRoutes.post('/warehouses', requirePermission('inventory.manage'), inventoryController.createWarehouse)
inventoryRoutes.patch('/warehouses/:id', requirePermission('inventory.manage'), inventoryController.updateWarehouse)
inventoryRoutes.delete('/warehouses/:id', requirePermission('inventory.manage'), inventoryController.removeWarehouse)
