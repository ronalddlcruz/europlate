import type { Request, Response } from 'express'
import { createCategorySchema, createProductSchema, createUnitSchema, productQuerySchema, updateCategorySchema, updateProductSchema, updateUnitSchema } from '../schemas/product.schema.js'
import { productService } from '../services/product.service.js'

const paramId = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id

export const productController = {
  async list(request: Request, response: Response) { const filters = productQuerySchema.parse(request.query); response.json({ data: await productService.getCatalog(filters) }) },
  async get(request: Request, response: Response) { response.json({ data: await productService.getById(paramId(request)) }) },
  async create(request: Request, response: Response) { const product = await productService.create(createProductSchema.parse(request.body)); response.status(201).json({ data: product }) },
  async update(request: Request, response: Response) { response.json({ data: await productService.update(paramId(request), updateProductSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await productService.remove(paramId(request)); response.status(204).send() },
  async listUnits(_request: Request, response: Response) { response.json({ data: await productService.getUnits() }) },
  async listCategories(_request: Request, response: Response) { response.json({ data: await productService.getCategories() }) },
  async createUnit(request: Request, response: Response) { response.status(201).json({ data: await productService.createUnit(createUnitSchema.parse(request.body)) }) },
  async updateUnit(request: Request, response: Response) { response.json({ data: await productService.updateUnit(paramId(request), updateUnitSchema.parse(request.body)) }) },
  async removeUnit(request: Request, response: Response) { await productService.removeUnit(paramId(request)); response.status(204).send() },
  async createCategory(request: Request, response: Response) { response.status(201).json({ data: await productService.createCategory(createCategorySchema.parse(request.body)) }) },
  async updateCategory(request: Request, response: Response) { response.json({ data: await productService.updateCategory(paramId(request), updateCategorySchema.parse(request.body)) }) },
  async removeCategory(request: Request, response: Response) { await productService.removeCategory(paramId(request)); response.status(204).send() },
}
