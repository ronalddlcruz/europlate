import type { Request, Response } from 'express'
import { createCustomerSchema, customerQuerySchema, updateCustomerSchema } from '../schemas/customer.schema.js'
import { customerService } from '../services/customer.service.js'

const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id

export const customerController = {
  async list(request: Request, response: Response) { response.json({ data: await customerService.list(request.auth!.companyId, customerQuerySchema.parse(request.query)) }) },
  async get(request: Request, response: Response) { response.json({ data: await customerService.getById(request.auth!.companyId, idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await customerService.create(request.auth!.companyId, createCustomerSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await customerService.update(request.auth!.companyId, idFrom(request), updateCustomerSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await customerService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
