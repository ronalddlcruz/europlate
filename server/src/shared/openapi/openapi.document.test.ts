import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { API_GROUPS, createOpenApiDocument } from './openapi.document.js'

test('Swagger cubre cada endpoint declarado por los routers Express', () => {
  for (const group of API_GROUPS) {
    const source = readFileSync(join(process.cwd(), 'server/src/modules', group.source), 'utf8')
    const actual = [...source.matchAll(/\b\w+Routes\.(get|post|patch|put|delete)\('([^']+)'/g)]
      .map((match) => `${match[1].toUpperCase()} ${match[2]}`)
      .sort()
    assert.deepEqual([...group.routes].sort(), actual, group.source)
  }
})

test('Swagger expone métodos, parámetros y seguridad sin confundir rutas dinámicas', () => {
  const document = createOpenApiDocument()
  assert.equal(document.openapi, '3.0.3')
  assert.ok(document.paths['/api/products/{id}'].patch)
  assert.ok(document.paths['/api/production/{id}/materials/{materialId}/consume'].post)
  assert.ok(document.paths['/internal/performance'].get)
  assert.deepEqual(document.paths['/api/auth/login'].post.security, [])
  assert.deepEqual(document.paths['/api/products'].get.security, [{ bearerAuth: [] }])
  assert.equal(document.paths['/api/products/{id}'].patch.parameters?.[0].name, 'id')
})
