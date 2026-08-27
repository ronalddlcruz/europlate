import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { userRepository } from '../repositories/user.repository.js'
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema.js'

const notFound = () => new AppError('USER_NOT_FOUND', 'Usuario no encontrado.', 404)
const sanitize = (user: Awaited<ReturnType<typeof userRepository.findById>>) => user && ({ ...user, roles: user.roles.map(item => item.role), directPermissions: user.permissions.map(item => item.permission) })
async function recordAudit(actorId: string, action: string, detail: Record<string, unknown>) {
  try {
    await userRepository.audit(prisma, { user: { connect: { id: actorId } }, action, module: 'USERS', detail: detail as Prisma.InputJsonValue })
  } catch (error) {
    // La auditoría no debe revertir una operación de negocio que ya fue confirmada.
    console.error('No se pudo registrar la auditoría de usuarios.', error)
  }
}
export const userService = {
  async list(companyId: string) { return (await userRepository.findMany(companyId)).map(user => sanitize(user)) },
  async get(companyId: string, id: string) { const user = await userRepository.findById(companyId, id); if (!user) throw notFound(); return sanitize(user) },
  async catalog() { return { roles: await userRepository.findRoles(), permissions: await userRepository.findPermissions() } },
  audit(companyId: string) { return userRepository.auditLogs(companyId) },
  async create(companyId: string, actorId: string, input: CreateUserInput) {
    if (await userRepository.findByEmail(input.email)) throw new AppError('USER_EMAIL_EXISTS', 'Ya existe un usuario con este correo.', 409)
    if (!await userRepository.findRole(input.roleId)) throw new AppError('ROLE_NOT_FOUND', 'El rol seleccionado no existe.', 422)
    const passwordHash = await bcrypt.hash(input.password!, 12)
    // La creación anidada de UserRole es una única sentencia atómica y funciona
    // correctamente con el pooler en modo transacción de Supabase.
    const user = await userRepository.create(prisma, { company: { connect: { id: companyId } }, name: input.name, email: input.email, passwordHash, status: input.status, roles: { create: { roleId: input.roleId } } })
    await recordAudit(actorId, 'CREATE', { targetUserId: user.id, email: user.email })
    return sanitize(user)
  },
  async update(companyId: string, actorId: string, id: string, input: UpdateUserInput) {
    const current = await userRepository.findById(companyId, id); if (!current) throw notFound()
    if (input.email && input.email !== current.email) { const existing = await userRepository.findByEmail(input.email); if (existing) throw new AppError('USER_EMAIL_EXISTS', 'Ya existe un usuario con este correo.', 409) }
    if (input.roleId && !await userRepository.findRole(input.roleId)) throw new AppError('ROLE_NOT_FOUND', 'El rol seleccionado no existe.', 422)
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined
    const user = await userRepository.update(prisma, id, { ...(input.name && { name: input.name }), ...(input.email && { email: input.email }), ...(input.status && { status: input.status }), ...(passwordHash && { passwordHash }), ...(input.roleId && { roles: { deleteMany: {}, create: { roleId: input.roleId } } }) })
    await recordAudit(actorId, 'UPDATE', { targetUserId: id, email: user.email })
    return sanitize(user)
  },
  async remove(companyId: string, actorId: string, id: string) {
    const user = await userRepository.findById(companyId, id); if (!user) throw notFound(); if (id === actorId) throw new AppError('CANNOT_DELETE_SELF', 'No puedes eliminar tu propio usuario.', 422)
    await recordAudit(actorId, 'DELETE', { targetUserId: id, email: user.email })
    await userRepository.remove(prisma, id)
  },
  async updateRolePermissions(actorId: string, roleId: string, permissionIds: string[]) {
    if (!await userRepository.findRole(roleId)) throw new AppError('ROLE_NOT_FOUND', 'Rol no encontrado.', 404)
    const permissions = await userRepository.findPermissions(); if (permissionIds.some(id => !permissions.some(permission => permission.id === id))) throw new AppError('PERMISSION_NOT_FOUND', 'Uno o más permisos no existen.', 422)
    const role = await userRepository.replaceRolePermissions(prisma, roleId, permissionIds)
    await recordAudit(actorId, 'UPDATE_PERMISSIONS', { roleId })
    return role
  },
}
