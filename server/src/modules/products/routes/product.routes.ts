import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { productController } from '../controllers/product.controller.js'

export const productRoutes = Router()
productRoutes.use(requireAuthentication)
productRoutes.get('/', requirePermission('products.read'), productController.list)
productRoutes.post('/', requirePermission('products.manage'), productController.create)
productRoutes.get('/units', requirePermission('products.read'), productController.listUnits)
productRoutes.post('/units', requirePermission('products.manage'), productController.createUnit)
productRoutes.get('/:id', requirePermission('products.read'), productController.get)
productRoutes.patch('/:id', requirePermission('products.manage'), productController.update)
productRoutes.delete('/:id', requirePermission('products.manage'), productController.remove)
productRoutes.patch('/units/:id', requirePermission('products.manage'), productController.updateUnit)
productRoutes.delete('/units/:id', requirePermission('products.manage'), productController.removeUnit)
