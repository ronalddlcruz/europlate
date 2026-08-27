import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { exchangeRateController } from '../controllers/exchange-rate.controller.js'
export const exchangeRateRoutes = Router()
exchangeRateRoutes.use(requireAuthentication)
exchangeRateRoutes.get('/', requirePermission('settings.read'), exchangeRateController.list)
exchangeRateRoutes.get('/current', requirePermission('settings.read'), exchangeRateController.current)
exchangeRateRoutes.post('/', requirePermission('settings.manage'), exchangeRateController.create)
exchangeRateRoutes.post('/refresh', requirePermission('settings.manage'), exchangeRateController.refresh)
exchangeRateRoutes.patch('/:id', requirePermission('settings.manage'), exchangeRateController.update)
exchangeRateRoutes.delete('/:id', requirePermission('settings.manage'), exchangeRateController.remove)
