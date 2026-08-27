import type { Request, Response } from 'express'
import { importInputSchema, importQuerySchema, updateImportSchema } from '../schemas/import.schema.js'
import { importService } from '../services/import.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const importController = {
  async list(request: Request, response: Response) { response.json({ data: await importService.list(request.auth!.companyId, importQuerySchema.parse(request.query)) }) },
  async catalog(request: Request, response: Response) { const [suppliers, customsAgents, products, warehouses] = await importService.catalog(request.auth!.companyId); response.json({ data: { suppliers, customsAgents, products, warehouses } }) },
  async get(request: Request, response: Response) { response.json({ data: await importService.getById(request.auth!.companyId, idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await importService.create(request.auth!.companyId, importInputSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await importService.update(request.auth!.companyId, idFrom(request), updateImportSchema.parse(request.body)) }) },
  async receive(request: Request, response: Response) { response.json({ data: await importService.receive(request.auth!.companyId, idFrom(request)) }) },
  async remove(request: Request, response: Response) { await importService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
