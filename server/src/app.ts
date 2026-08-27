import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { productRoutes } from './modules/products/routes/product.routes.js'
import { authRoutes } from './modules/auth/routes/auth.routes.js'
import { supplierRoutes } from './modules/suppliers/routes/supplier.routes.js'
import { customsAgentRoutes } from './modules/customs-agents/routes/customs-agent.routes.js'
import { purchaseRoutes } from './modules/purchases/routes/purchase.routes.js'
import { importRoutes } from './modules/imports/routes/import.routes.js'
import { AppError } from './shared/errors/app-error.js'
export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || localOrigin.test(origin) || origin === env.WEB_ORIGIN), credentials: true }))
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/suppliers', supplierRoutes)
  app.use('/api/customs-agents', customsAgentRoutes)
  app.use('/api/purchases', purchaseRoutes)
  app.use('/api/imports', importRoutes)
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) return response.status(error.statusCode).json({ error: { code: error.code, message: error.message } })
    if (error instanceof Error && error.name === 'ZodError') return response.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'La información enviada no es válida.' } })
    console.error(error)
    return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' } })
  })
  return app
}
export { env }
