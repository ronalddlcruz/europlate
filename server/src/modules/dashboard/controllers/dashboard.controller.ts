import type { Request, Response } from 'express'
import { dashboardService } from '../services/dashboard.service.js'

export const dashboardController = {
  async summary(request: Request, response: Response) {
    const period = typeof request.query.period === 'string' ? request.query.period : undefined
    response.json({ data: await dashboardService.summary(request.auth!.companyId, request.auth!.id, period) })
  },
}
