import assert from 'node:assert/strict'
import test from 'node:test'
import {
  loginInputSchema,
  loginResponseSchema,
  sessionResponseSchema,
} from '@/features/auth/schemas/auth.schema'

const user = {
  id: 'user-1',
  name: 'Usuario',
  email: 'usuario@empresa.com',
  companyId: 'company-1',
  permissions: ['products.read'],
}

test('normaliza el correo y conserva la contraseña tal como se ingresó', () => {
  assert.deepEqual(
    loginInputSchema.parse({ email: '  USUARIO@empresa.com  ', password: ' secreto123 ' }),
    { email: 'USUARIO@empresa.com', password: ' secreto123 ' },
  )
})

test('rechaza credenciales incompletas o mal formadas antes de llamar a la API', () => {
  assert.equal(
    loginInputSchema.safeParse({ email: 'incorrecto', password: 'secreto123' }).success,
    false,
  )
  assert.equal(
    loginInputSchema.safeParse({ email: 'usuario@empresa.com', password: 'corta' }).success,
    false,
  )
})

test('valida el contrato de login y de restauración de sesión', () => {
  assert.deepEqual(loginResponseSchema.parse({ user, accessToken: 'jwt' }), {
    user,
    accessToken: 'jwt',
  })
  assert.deepEqual(sessionResponseSchema.parse({ user }), { user })
  assert.equal(loginResponseSchema.safeParse({ user, accessToken: '' }).success, false)
  assert.equal(
    sessionResponseSchema.safeParse({ user: { ...user, permissions: null } }).success,
    false,
  )
})
