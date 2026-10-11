import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveDatabaseUrl } from './database-url'

const transactionUrl =
  'postgresql://user:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

test('Nest usa el pooler de sesión con conexiones acotadas y sin cambiar la base', () => {
  const resolved = new URL(resolveDatabaseUrl(transactionUrl))
  assert.equal(resolved.port, '5432')
  assert.equal(resolved.hostname, new URL(transactionUrl).hostname)
  assert.equal(resolved.pathname, '/postgres')
  assert.equal(resolved.searchParams.has('pgbouncer'), false)
  assert.equal(resolved.searchParams.get('connection_limit'), '5')
})

test('el modo transaccional y URLs no Supabase permanecen intactos', () => {
  assert.equal(resolveDatabaseUrl(transactionUrl, 'transaction'), transactionUrl)
  const other = 'postgresql://user:pass@db.example.com:5432/example'
  assert.equal(resolveDatabaseUrl(other), other)
})

test('rechaza límites de conexiones inválidos', () => {
  assert.throws(() => resolveDatabaseUrl(transactionUrl, 'session', 0))
  assert.throws(() => resolveDatabaseUrl(transactionUrl, 'session', 21))
})
