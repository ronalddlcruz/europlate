import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveRuntimeDatabaseUrl } from './connection-url.js'

const transactionUrl =
  'postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

test('Express usa el pooler de sesión de la misma base con cinco conexiones', () => {
  const resolved = new URL(resolveRuntimeDatabaseUrl(transactionUrl, 'session', 5))
  assert.equal(resolved.port, '5432')
  assert.equal(resolved.hostname, new URL(transactionUrl).hostname)
  assert.equal(resolved.searchParams.has('pgbouncer'), false)
  assert.equal(resolved.searchParams.get('connection_limit'), '5')
})

test('modo transaccional permite revertir el cambio sin modificar la URL', () => {
  assert.equal(resolveRuntimeDatabaseUrl(transactionUrl, 'transaction', 5), transactionUrl)
})
