import type { Request, Response } from 'express'
import { reportService } from '../services/report.service.js'

export const reportController = {
  async dashboard(request: Request, response: Response) {
    response.json({ data: await reportService.dashboard(request.auth!.companyId) })
  },
}
