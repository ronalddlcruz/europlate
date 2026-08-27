import type { Request, Response } from 'express'
import { createUserSchema, rolePermissionsSchema, updateUserSchema } from '../schemas/user.schema.js'
import { userService } from '../services/user.service.js'
const idFrom = (request: Request) => Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
export const userController = {
  async list(request: Request, response: Response) { response.json({ data: await userService.list(request.auth!.companyId) }) },
  async catalog(_request: Request, response: Response) { response.json({ data: await userService.catalog() }) },
  async audit(request: Request, response: Response) { response.json({ data: await userService.audit(request.auth!.companyId) }) },
  async create(request: Request, response: Response) { response.status(201).json({ data: await userService.create(request.auth!.companyId, request.auth!.id, createUserSchema.parse(request.body)) }) },
  async update(request: Request, response: Response) { response.json({ data: await userService.update(request.auth!.companyId, request.auth!.id, idFrom(request), updateUserSchema.parse(request.body)) }) },
  async remove(request: Request, response: Response) { await userService.remove(request.auth!.companyId, request.auth!.id, idFrom(request)); response.status(204).send() },
  async updateRolePermissions(request: Request, response: Response) { response.json({ data: await userService.updateRolePermissions(request.auth!.id, idFrom(request), rolePermissionsSchema.parse(request.body).permissionIds) }) },
}
