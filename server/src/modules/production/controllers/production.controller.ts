import type { Request, Response } from 'express'
import { completeProductionOrderSchema, productionOrderSchema, productionQuerySchema, updateProductionOrderSchema } from '../schemas/production.schema.js'
import { productionService } from '../services/production.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const productionController = {
  async list(request: Request, response: Response) { response.json({ data: await productionService.list(request.auth!.companyId, productionQuerySchema.parse(request.query)) }) },
  async catalog(request: Request, response: Response) { const [products, materials, warehouses, stocks] = await productionService.catalog(request.auth!.companyId); response.json({ data: { products, materials, warehouses, stocks } }) },
  async get(request: Request, response: Response) { response.json({ data: await productionService.getById(request.auth!.companyId, idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await productionService.create(request.auth!.companyId, productionOrderSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await productionService.update(request.auth!.companyId, idFrom(request), updateProductionOrderSchema.parse(request.body)) }) },
  async complete(request: Request, response: Response) { response.json({ data: await productionService.complete(request.auth!.companyId, idFrom(request), completeProductionOrderSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await productionService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
