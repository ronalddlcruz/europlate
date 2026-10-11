import 'reflect-metadata'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { UserStatus } from '@prisma/client'
import { JwtModule } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { configureHttpApp } from '../../config/application/configure-http-app'
import { AuthController } from './controllers/auth.controller'
import { JwtAccessGuard } from './guards/jwt-access.guard'
import { AuthRepository } from './repositories/auth.repository'
import { AuthService } from './services/auth.service'
import { TokenService } from './services/token.service'

const secret = 'test-only-secret-with-more-than-32-characters'
const password = 'password-123'
const initialUser = () => ({
  id: 'user-1',
  companyId: 'company-1',
  name: 'Usuario de prueba',
  email: 'test@europlate.com',
  status: UserStatus.ACTIVE as UserStatus,
  passwordHash: bcrypt.hashSync(password, 4),
  roleKeys: ['warehouse'],
  rolePermissionKeys: ['inventory:read'],
  directPermissionKeys: ['products:read'],
})

let app: INestApplication
let user = initialUser()
let authorizationReads = 0

before(async () => {
  const repository = {
    findUserByEmail: async (email: string) => (email === user.email ? user : null),
    findAuthorizationById: async (id: string) => {
      authorizationReads += 1
      return id === user.id ? user : null
    },
  }
  const module = await Test.createTestingModule({
    imports: [JwtModule.register({ secret })],
    controllers: [AuthController],
    providers: [
      AuthService,
      TokenService,
      JwtAccessGuard,
      { provide: AuthRepository, useValue: repository },
    ],
  }).compile()
  app = module.createNestApplication()
  configureHttpApp(app)
  await app.init()
})

after(async () => {
  await app?.close()
})

test('login conserva el contrato Express y el JWT es interoperable', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: ' TEST@EUROPLATE.COM ', password })
    .expect(200)
  assert.equal(typeof response.body.data.accessToken, 'string')
  assert.deepEqual(response.body.data.user, {
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: user.companyId,
    permissions: ['inventory:read', 'products:read'],
  })
  const payload = jwt.verify(response.body.data.accessToken, secret) as jwt.JwtPayload
  assert.equal(payload.sub, user.id)
  assert.equal(payload.companyId, user.companyId)
  assert.equal(payload.exp! - payload.iat!, 8 * 60 * 60)
  assert.equal(JSON.stringify(response.body).includes('passwordHash'), false)
})

test('session acepta JWT legado y relee permisos vigentes en una consulta', async () => {
  const token = jwt.sign({ companyId: user.companyId, permissions: ['old:permission'] }, secret, {
    subject: user.id,
    expiresIn: '8h',
  })
  user = {
    ...user,
    roleKeys: ['admin'],
  }
  const beforeReads = authorizationReads
  const response = await request(app.getHttpServer())
    .get('/api/auth/session')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  assert.deepEqual(response.body.data.user.permissions, ['*'])
  assert.equal(authorizationReads - beforeReads, 1)
})

test('contraseñas incorrectas y usuarios inactivos no ingresan', async () => {
  const wrongPassword = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password: 'incorrecta' })
    .expect(401)
  assert.deepEqual(wrongPassword.body, {
    error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' },
  })

  user = { ...user, status: UserStatus.INACTIVE }
  const inactive = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password })
    .expect(401)
  assert.equal(inactive.body.error.code, 'INVALID_CREDENTIALS')
  const token = jwt.sign({ companyId: user.companyId }, secret, {
    subject: user.id,
    expiresIn: '8h',
  })
  const session = await request(app.getHttpServer())
    .get('/api/auth/session')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
  assert.equal(session.body.error.code, 'INVALID_SESSION')
  user = initialUser()
})

test('validación, token ausente e inválido mantienen los códigos HTTP', async () => {
  const invalidInput = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: 'no-es-correo', password: 'corta' })
    .expect(422)
  assert.equal(invalidInput.body.error.code, 'VALIDATION_ERROR')
  const missing = await request(app.getHttpServer()).get('/api/auth/session').expect(401)
  assert.equal(missing.body.error.code, 'AUTH_REQUIRED')
  const invalid = await request(app.getHttpServer())
    .get('/api/auth/session')
    .set('Authorization', 'Bearer invalido')
    .expect(401)
  assert.equal(invalid.body.error.code, 'INVALID_TOKEN')
})

test('un JWT de otra empresa no puede restaurar la sesión', async () => {
  const token = jwt.sign({ companyId: 'company-other', permissions: ['*'] }, secret, {
    subject: user.id,
    expiresIn: '8h',
  })
  const response = await request(app.getHttpServer())
    .get('/api/auth/session')
    .set('Authorization', `Bearer ${token}`)
    .expect(401)
  assert.equal(response.body.error.code, 'INVALID_SESSION')
})

test('Swagger documenta las dos rutas Auth', async () => {
  const response = await request(app.getHttpServer()).get('/docs-json').expect(200)
  assert.ok(response.body.paths['/api/auth/login'])
  assert.ok(response.body.paths['/api/auth/session'])
})
