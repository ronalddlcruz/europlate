import assert from 'node:assert/strict'
import test from 'node:test'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { UserStatus } from '@prisma/client'
import { createApp } from '../../app.js'
import { env } from '../../config/env.js'
import { authRepository } from './repositories/auth.repository.js'

test('login y session conservan el contrato; session realiza una sola lectura de autorización', async () => {
  const findUserByEmail = authRepository.findUserByEmail
  const findAuthorizationById = authRepository.findAuthorizationById
  const user = {
    id: 'user-1', companyId: 'company-1', name: 'Usuario', email: 'test@example.com',
    status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash('password-123', 4),
    roles: [{ role: { key: 'warehouse_manager', permissions: [{ permission: { key: 'products.read' } }] } }],
    permissions: [{ permission: { key: 'inventory.read' } }],
  }
  let authorizationReads = 0
  authRepository.findUserByEmail = (async () => user) as unknown as typeof findUserByEmail
  authRepository.findAuthorizationById = (async () => {
    authorizationReads += 1
    return user
  }) as unknown as typeof findAuthorizationById
  try {
    const app = createApp()
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password-123' })
    assert.equal(login.status, 200)
    assert.deepEqual(login.body.data.user, {
      id: user.id, name: user.name, email: user.email, companyId: user.companyId,
      permissions: ['products.read', 'inventory.read'],
    })
    const payload = jwt.verify(login.body.data.accessToken, env.JWT_SECRET) as jwt.JwtPayload
    assert.equal(payload.sub, user.id)
    assert.equal(payload.exp! - payload.iat!, 8 * 60 * 60)

    const session = await request(app).get('/api/auth/session').set('Authorization', `Bearer ${login.body.data.accessToken}`)
    assert.equal(session.status, 200)
    assert.deepEqual(session.body, { data: { user: login.body.data.user } })
    assert.equal(authorizationReads, 1)
  } finally {
    authRepository.findUserByEmail = findUserByEmail
    authRepository.findAuthorizationById = findAuthorizationById
  }
})
