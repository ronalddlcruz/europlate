import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { productController } from '../controllers/product.controller.js'

export const productRoutes = Router()
productRoutes.use(requireAuthentication)
productRoutes.get('/', requirePermission('products.read'), productController.list)
productRoutes.post('/', requirePermission('products.manage'), productController.create)
productRoutes.get('/units', requirePermission('products.read'), productController.listUnits)
productRoutes.get('/categories', requirePermission('products.read'), productController.listCategories)
productRoutes.get('/attributes', requirePermission('products.read'), productController.listAttributeDefinitions)
productRoutes.post('/units', requirePermission('products.manage'), productController.createUnit)
productRoutes.post('/categories', requirePermission('products.manage'), productController.createCategory)
productRoutes.post('/attributes', requirePermission('products.manage'), productController.createAttributeDefinition)
productRoutes.patch('/units/:id', requirePermission('products.manage'), productController.updateUnit)
productRoutes.delete('/units/:id', requirePermission('products.manage'), productController.removeUnit)
productRoutes.patch('/categories/:id', requirePermission('products.manage'), productController.updateCategory)
productRoutes.delete('/categories/:id', requirePermission('products.manage'), productController.removeCategory)
productRoutes.patch('/attributes/:id', requirePermission('products.manage'), productController.updateAttributeDefinition)
productRoutes.delete('/attributes/:id', requirePermission('products.manage'), productController.removeAttributeDefinition)
productRoutes.get('/:id', requirePermission('products.read'), productController.get)
productRoutes.patch('/:id', requirePermission('products.manage'), productController.update)
productRoutes.delete('/:id', requirePermission('products.manage'), productController.remove)
