import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { supplierController } from '../controllers/supplier.controller.js'

export const supplierRoutes = Router()
supplierRoutes.use(requireAuthentication)
supplierRoutes.get('/', requirePermission('suppliers.read'), supplierController.list)
supplierRoutes.post('/', requirePermission('suppliers.manage'), supplierController.create)
supplierRoutes.get('/:id', requirePermission('suppliers.read'), supplierController.get)
supplierRoutes.patch('/:id', requirePermission('suppliers.manage'), supplierController.update)
supplierRoutes.delete('/:id', requirePermission('suppliers.manage'), supplierController.remove)
