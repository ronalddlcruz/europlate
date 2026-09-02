import type { Request, Response } from 'express'
import { AppError } from '../../../shared/errors/app-error.js'
import { importInputSchema, importQuerySchema, updateImportSchema } from '../schemas/import.schema.js'
import { importService } from '../services/import.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const importController = {
  async list(request: Request, response: Response) { response.json({ data: await importService.list(request.auth!.companyId, importQuerySchema.parse(request.query)) }) },
  async catalog(request: Request, response: Response) { const [suppliers, customsAgents, products, warehouses] = await importService.catalog(request.auth!.companyId); response.json({ data: { suppliers, customsAgents, products, warehouses } }) },
  async uploadDocument(request: Request, response: Response) { const fileName = request.header('x-file-name'); if (!fileName || !Buffer.isBuffer(request.body) || request.body.length === 0) throw new AppError('IMPORT_DOCUMENT_INVALID', 'Adjunta un archivo PDF válido.', 422); response.status(201).json({ data: await importService.uploadDocument(request.auth!.companyId, decodeURIComponent(fileName), request.body) }) },
  async removeDocument(request: Request, response: Response) { const storageKey = typeof request.body?.storageKey === 'string' ? request.body.storageKey : ''; if (!storageKey) throw new AppError('IMPORT_DOCUMENT_INVALID', 'No se encontró el archivo adjunto.', 422); await importService.removeDocument(request.auth!.companyId, storageKey); response.status(204).send() },
  async get(request: Request, response: Response) { response.json({ data: await importService.getById(request.auth!.companyId, idFrom(request)) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await importService.create(request.auth!.companyId, importInputSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await importService.update(request.auth!.companyId, idFrom(request), updateImportSchema.parse(request.body)) }) },
  async receive(request: Request, response: Response) { response.json({ data: await importService.receive(request.auth!.companyId, idFrom(request)) }) },
  async remove(request: Request, response: Response) { await importService.remove(request.auth!.companyId, idFrom(request)); response.status(204).send() },
}
