import type { Request, Response } from 'express'
import { createExchangeRateSchema, updateExchangeRateSchema } from '../schemas/exchange-rate.schema.js'
import { exchangeRateService } from '../services/exchange-rate.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const exchangeRateController = {
  async list(request: Request, response: Response) { response.json({ data: await exchangeRateService.list(request.auth!.companyId) }) },
  async current(request: Request, response: Response) { response.json({ data: await exchangeRateService.current(request.auth!.companyId) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await exchangeRateService.create(request.auth!.companyId, request.auth!.id, createExchangeRateSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await exchangeRateService.update(request.auth!.companyId, request.auth!.id, idFrom(request), updateExchangeRateSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await exchangeRateService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
  async refresh(request: Request, response: Response) { response.json({ data: await exchangeRateService.refresh(request.auth!.companyId, request.auth!.id) }) },
}
