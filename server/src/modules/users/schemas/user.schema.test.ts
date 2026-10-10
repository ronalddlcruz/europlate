import assert from 'node:assert/strict'
import test from 'node:test'
import { createUserSchema, updateUserSchema } from './user.schema.js'

const base = { name: 'Empleado de almacén', email: 'empleado@example.com', password: 'secret123', status: 'ACTIVE' }

test('acepta múltiples roles y mantiene compatible el rol único anterior', () => {
  assert.deepEqual(createUserSchema.parse({ ...base, roleIds: ['operador', 'warehouse_manager'] }).roleIds, ['operador', 'warehouse_manager'])
  assert.equal(createUserSchema.parse({ ...base, roleId: 'admin' }).roleId, 'admin')
})

test('rechaza usuarios sin rol y roles duplicados', () => {
  assert.equal(createUserSchema.safeParse(base).success, false)
  assert.equal(createUserSchema.safeParse({ ...base, roleIds: ['admin', 'admin'] }).success, false)
  assert.equal(updateUserSchema.safeParse({ roleIds: [] }).success, false)
})
