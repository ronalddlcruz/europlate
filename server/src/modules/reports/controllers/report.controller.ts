import type { Request, Response } from 'express'
import { reportService } from '../services/report.service.js'
import { resolveOperationScope } from '../../../shared/security/operation-scope.js'

export const reportController = {
  async stock(request: Request, response: Response) {
    response.json({ data: await reportService.stock(request.auth!.companyId) })
  },
  async movements(request: Request, response: Response) {
    const scope = await resolveOperationScope(request.auth!.companyId, request.auth!.id)
    response.json({ data: await reportService.movements(request.auth!.companyId, scope) })
  },
  async purchases(request: Request, response: Response) {
    const scope = await resolveOperationScope(request.auth!.companyId, request.auth!.id)
    response.json({ data: await reportService.purchases(request.auth!.companyId, scope) })
  },
  async production(request: Request, response: Response) {
    const scope = await resolveOperationScope(request.auth!.companyId, request.auth!.id)
    response.json({ data: await reportService.production(request.auth!.companyId, scope) })
  },
  async dashboard(request: Request, response: Response) {
    const scope = await resolveOperationScope(request.auth!.companyId, request.auth!.id)
    response.json({ data: await reportService.dashboard(request.auth!.companyId, scope) })
  },
}
