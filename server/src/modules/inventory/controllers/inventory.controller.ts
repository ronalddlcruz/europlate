import type { Request, Response } from 'express'
import { inventoryAdjustmentSchema, inventoryQuerySchema, stockTransferSchema, updateWarehouseSchema, warehouseSchema } from '../schemas/inventory.schema.js'
import { inventoryService } from '../services/inventory.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const inventoryController = {
  async stock(request: Request, response: Response) { response.json({ data: await inventoryService.stock(request.auth!.companyId, inventoryQuerySchema.parse(request.query)) }) },
  async movements(request: Request, response: Response) { response.json({ data: await inventoryService.movements(request.auth!.companyId) }) },
  async transfers(request: Request, response: Response) { response.json({ data: await inventoryService.transfers(request.auth!.companyId) }) },
  async adjustments(request: Request, response: Response) { response.json({ data: await inventoryService.adjustments(request.auth!.companyId) }) },
  async warehouses(request: Request, response: Response) { response.json({ data: await inventoryService.warehouses(request.auth!.companyId) }) },
  async catalog(request: Request, response: Response) { const [products, warehouses] = await inventoryService.catalog(request.auth!.companyId); response.json({ data: { products, warehouses } }) },
  async createTransfer(request: Request, response: Response) { response.status(201).json({ data: await inventoryService.createTransfer(request.auth!.companyId, request.auth!.id, stockTransferSchema.parse(request.body)) }) },
  async createAdjustment(request: Request, response: Response) { response.status(201).json({ data: await inventoryService.createAdjustment(request.auth!.companyId, request.auth!.id, inventoryAdjustmentSchema.parse(request.body)) }) },
  async createWarehouse(request: Request, response: Response) { response.status(201).json({ data: await inventoryService.createWarehouse(request.auth!.companyId, warehouseSchema.parse(request.body)) }) },
  async updateWarehouse(request: Request, response: Response) { response.json({ data: await inventoryService.updateWarehouse(request.auth!.companyId, idFrom(request), updateWarehouseSchema.parse(request.body)) }) },
  async removeWarehouse(request: Request, response: Response) { await inventoryService.removeWarehouse(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
