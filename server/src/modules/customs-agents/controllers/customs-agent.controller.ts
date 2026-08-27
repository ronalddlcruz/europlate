import type { Request, Response } from 'express'
import { createCustomsAgentSchema, customsAgentQuerySchema, updateCustomsAgentSchema } from '../schemas/customs-agent.schema.js'
import { customsAgentService } from '../services/customs-agent.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const customsAgentController = {
  async list(request: Request, response: Response) { response.json({ data: await customsAgentService.list(request.auth!.companyId, customsAgentQuerySchema.parse(request.query)) }) },
  async get(request: Request, response: Response) { response.json({ data: await customsAgentService.getById(request.auth!.companyId, idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await customsAgentService.create(request.auth!.companyId, createCustomsAgentSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await customsAgentService.update(request.auth!.companyId, idFrom(request), updateCustomsAgentSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await customsAgentService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
