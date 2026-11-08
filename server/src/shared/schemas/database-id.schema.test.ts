import assert from 'node:assert/strict'
import test from 'node:test'
import { databaseIdSchema } from './database-id.schema.js'
import { updateWarehouseSchema } from '../../modules/inventory/schemas/inventory.schema.js'

test('acepta el identificador histórico de sede al editar un almacén', () => {
  const siteId = 'dcbea590476ccab22650f93f65166e99'
  assert.equal(databaseIdSchema.parse(siteId), siteId)
  assert.equal(updateWarehouseSchema.parse({ name: 'Tienda nueva', siteId }).siteId, siteId)
})

test('rechaza identificadores arbitrarios', () => {
  assert.equal(databaseIdSchema.safeParse('site-lima').success, false)
  assert.equal(databaseIdSchema.safeParse('a'.repeat(31)).success, false)
})
