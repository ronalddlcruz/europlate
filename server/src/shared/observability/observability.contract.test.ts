import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import request from 'supertest'
import { createApp } from '../../app.js'
import { httpMetrics } from './http-metrics.js'
import { httpMetricsMiddleware } from './http-metrics.middleware.js'

test('Swagger Express responde y la vista de métricas exige autenticación', async () => {
  const app = createApp()
  const specification = await request(app).get('/openapi.json')
  assert.equal(specification.status, 200)
  assert.ok(specification.body.paths['/api/products/{id}'].patch)

  const swagger = await request(app).get('/docs/')
  assert.equal(swagger.status, 200)
  assert.match(swagger.text, /Europlate API · Express/)

  const privateMetrics = await request(app).get('/internal/performance')
  assert.equal(privateMetrics.status, 401)
  assert.equal(privateMetrics.body.error.code, 'AUTH_REQUIRED')

  const invalidLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'incorrecto', password: '123' })
  assert.equal(invalidLogin.status, 422)
  const metric = httpMetrics
    .snapshot()
    .find((entry) => entry.method === 'POST' && entry.route === '/api/auth/login')
  assert.equal(metric?.statusCodes[422], 1)
})

test('la métrica agrupa IDs distintos en una sola ruta sin conservar parámetros', async () => {
  const app = express()
  app.use(httpMetricsMiddleware())
  const productRouter = express.Router()
  productRouter.get('/:id', (_request, response) => response.json({ ok: true }))
  app.use('/api/products', productRouter)
  await request(app).get('/api/products/producto-uno?token=secreto')
  await request(app).get('/api/products/producto-dos')
  const metric = httpMetrics
    .snapshot()
    .find((entry) => entry.method === 'GET' && entry.route === '/api/products/:id')
  assert.equal(metric?.count, 2)
  assert.doesNotMatch(JSON.stringify(httpMetrics.snapshot()), /producto-uno|producto-dos|secreto/)
})
