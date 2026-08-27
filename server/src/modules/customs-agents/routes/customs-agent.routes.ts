import { Router } from 'express'
import { requireAuthentication } from '../../../shared/middleware/require-authentication.js'
import { requirePermission } from '../../../shared/middleware/require-permission.js'
import { customsAgentController } from '../controllers/customs-agent.controller.js'
export const customsAgentRoutes = Router()
customsAgentRoutes.use(requireAuthentication)
customsAgentRoutes.get('/', requirePermission('customs_agents.read'), customsAgentController.list)
customsAgentRoutes.post('/', requirePermission('customs_agents.manage'), customsAgentController.create)
customsAgentRoutes.get('/:id', requirePermission('customs_agents.read'), customsAgentController.get)
customsAgentRoutes.patch('/:id', requirePermission('customs_agents.manage'), customsAgentController.update)
customsAgentRoutes.delete('/:id', requirePermission('customs_agents.manage'), customsAgentController.remove)
