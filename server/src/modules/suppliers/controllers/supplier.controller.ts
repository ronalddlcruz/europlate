import type { Request, Response } from 'express'
import { createSupplierSchema, supplierQuerySchema, updateSupplierSchema } from '../schemas/supplier.schema.js'
import { supplierService } from '../services/supplier.service.js'

const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
const companyIdFrom = (request: Request) => request.auth!.companyId

export const supplierController = {
  async list(request: Request, response: Response) { response.json({ data: await supplierService.list(companyIdFrom(request), supplierQuerySchema.parse(request.query)) }) },
  async get(request: Request, response: Response) { response.json({ data: await supplierService.getById(companyIdFrom(request), idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await supplierService.create(companyIdFrom(request), createSupplierSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await supplierService.update(companyIdFrom(request), idFrom(request), updateSupplierSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await supplierService.remove(companyIdFrom(request), idFrom(request)); response.status(204).send() },
}
