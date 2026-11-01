import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { userRepository } from '../repositories/user.repository.js'
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema.js'

const notFound = () => new AppError('USER_NOT_FOUND', 'Usuario no encontrado.', 404)
const GLOBAL_ROLE_KEYS = new Set(['admin', 'general_manager'])
const sanitize = (user: Awaited<ReturnType<typeof userRepository.findById>>) =>
  user && {
    id: user.id,
    siteId: user.siteId,
    name: user.name,
    email: user.email,
    status: user.status,
    site: user.site,
    roles: user.roles.map((item) => item.role),
    directPermissions: user.permissions.map((item) => item.permission),
    assignedWarehouses: user.warehouseAssignments.map((item) => item.warehouse),
  }
const selectedRoleIds = (input: { roleIds?: string[]; roleId?: string }) =>
  input.roleIds ?? (input.roleId ? [input.roleId] : undefined)
async function validateRoleIds(ids: string[]) {
  const roles = await userRepository.findRolesByIds(ids)
  if (roles.length !== ids.length) {
    throw new AppError('ROLE_NOT_FOUND', 'Uno o más roles seleccionados no existen.', 422)
  }
  return roles
}
async function validateAccessScope(
  companyId: string,
  roleIds: string[],
  siteId: string | null | undefined,
  warehouseIds: string[],
) {
  const roles = await validateRoleIds(roleIds)
  if (roles.some((role) => role.key === 'admin')) {
    throw new AppError(
      'SYSTEM_ROLE_PROTECTED',
      'El rol técnico no puede asignarse desde la aplicación.',
      403,
    )
  }
  const hasGlobalAccess = roles.some((role) => GLOBAL_ROLE_KEYS.has(role.key))
  if (hasGlobalAccess) return { siteId: null, warehouseIds: [] }
  if (!siteId || !(await userRepository.findSite(companyId, siteId))) {
    throw new AppError('USER_SITE_REQUIRED', 'Selecciona una sede válida para este usuario.', 422)
  }
  const warehouses = warehouseIds.length
    ? await userRepository.findWarehousesByIds(companyId, warehouseIds)
    : []
  if (warehouses.length !== warehouseIds.length) {
    throw new AppError(
      'WAREHOUSE_NOT_FOUND',
      'Uno o más almacenes seleccionados no pertenecen a la empresa.',
      422,
    )
  }
  if (warehouses.some((warehouse) => warehouse.siteId !== siteId)) {
    throw new AppError(
      'WAREHOUSE_SITE_MISMATCH',
      'Todos los almacenes seleccionados deben pertenecer a la sede del usuario.',
      422,
    )
  }
  if (warehouseIds.length === 0) {
    throw new AppError(
      'USER_SCOPE_REQUIRED',
      'Selecciona al menos un almacén para este usuario.',
      422,
    )
  }
  return { siteId, warehouseIds }
}
async function recordAudit(actorId: string, action: string, detail: Record<string, unknown>) {
  try {
    await userRepository.audit(prisma, {
      user: { connect: { id: actorId } },
      action,
      module: 'USERS',
      detail: detail as Prisma.InputJsonValue,
    })
  } catch (error) {
    // La auditoría no debe revertir una operación de negocio que ya fue confirmada.
    console.error('No se pudo registrar la auditoría de usuarios.', error)
  }
}
export const userService = {
  async list(companyId: string) {
    return (await userRepository.findMany(companyId))
      .filter((user) => !user.roles.some((entry) => entry.role.key === 'admin'))
      .map((user) => sanitize(user))
  },
  async get(companyId: string, id: string) {
    const user = await userRepository.findById(companyId, id)
    if (!user) throw notFound()
    return sanitize(user)
  },
  async catalog(companyId: string) {
    return {
      roles: (await userRepository.findRoles()).filter((role) => role.key !== 'admin'),
      permissions: await userRepository.findPermissions(),
      sites: await userRepository.findSites(companyId),
      warehouses: await userRepository.findWarehouses(companyId),
    }
  },
  audit(companyId: string) {
    return userRepository.auditLogs(companyId)
  },
  async create(companyId: string, actorId: string, input: CreateUserInput) {
    if (await userRepository.findByEmail(input.email))
      throw new AppError('USER_EMAIL_EXISTS', 'Ya existe un usuario con este correo.', 409)
    const roleIds = selectedRoleIds(input)!
    const scope = await validateAccessScope(
      companyId,
      roleIds,
      input.siteId,
      input.warehouseIds ?? [],
    )
    const passwordHash = await bcrypt.hash(input.password!, 12)
    // La creación anidada de UserRole es una única sentencia atómica y funciona
    // correctamente con el pooler en modo transacción de Supabase.
    const user = await userRepository.create(prisma, {
      company: { connect: { id: companyId } },
      name: input.name,
      email: input.email,
      passwordHash,
      status: input.status,
      ...(scope.siteId && { site: { connect: { id: scope.siteId } } }),
      roles: { create: roleIds.map((roleId) => ({ roleId })) },
      warehouseAssignments: {
        create: scope.warehouseIds.map((warehouseId) => ({ warehouseId })),
      },
    })
    await recordAudit(actorId, 'CREATE', {
      targetUserId: user.id,
      email: user.email,
      roleIds,
      siteId: scope.siteId,
      warehouseIds: scope.warehouseIds,
    })
    return sanitize(user)
  },
  async update(companyId: string, actorId: string, id: string, input: UpdateUserInput) {
    const current = await userRepository.findById(companyId, id)
    if (!current) throw notFound()
    if (input.email && input.email !== current.email) {
      const existing = await userRepository.findByEmail(input.email)
      if (existing)
        throw new AppError('USER_EMAIL_EXISTS', 'Ya existe un usuario con este correo.', 409)
    }
    const roleIds = selectedRoleIds(input)
    const warehouseIds = input.warehouseIds
    const siteId = input.siteId
    const effectiveRoleIds = roleIds ?? current.roles.map((entry) => entry.roleId)
    const effectiveWarehouseIds =
      warehouseIds ?? current.warehouseAssignments.map((entry) => entry.warehouseId)
    const scope = await validateAccessScope(
      companyId,
      effectiveRoleIds,
      siteId === undefined ? current.siteId : siteId,
      effectiveWarehouseIds,
    )
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined
    const user = await userRepository.update(prisma, id, {
      ...(input.name && { name: input.name }),
      ...(input.email && { email: input.email }),
      ...(input.status && { status: input.status }),
      site: scope.siteId ? { connect: { id: scope.siteId } } : { disconnect: true },
      ...(passwordHash && { passwordHash }),
      ...(roleIds && { roles: { deleteMany: {}, create: roleIds.map((roleId) => ({ roleId })) } }),
      warehouseAssignments: {
        deleteMany: {},
        create: scope.warehouseIds.map((warehouseId) => ({ warehouseId })),
      },
    })
    await recordAudit(actorId, 'UPDATE', {
      targetUserId: id,
      email: user.email,
      ...(roleIds && { previousRoleIds: current.roles.map((entry) => entry.roleId), roleIds }),
      siteId: scope.siteId,
      warehouseIds: scope.warehouseIds,
    })
    return sanitize(user)
  },
  async remove(companyId: string, actorId: string, id: string) {
    const user = await userRepository.findById(companyId, id)
    if (!user) throw notFound()
    if (id === actorId)
      throw new AppError('CANNOT_DELETE_SELF', 'No puedes eliminar tu propio usuario.', 422)
    if (user.roles.some((entry) => entry.role.key === 'admin'))
      throw new AppError(
        'SYSTEM_USER_PROTECTED',
        'El usuario técnico no puede eliminarse desde la aplicación.',
        403,
      )
    await recordAudit(actorId, 'DELETE', { targetUserId: id, email: user.email })
    await userRepository.remove(prisma, id)
  },
  async updateRolePermissions(actorId: string, roleId: string, permissionIds: string[]) {
    const existingRole = await userRepository.findRole(roleId)
    if (!existingRole) throw new AppError('ROLE_NOT_FOUND', 'Rol no encontrado.', 404)
    if (existingRole.key === 'admin')
      throw new AppError(
        'SYSTEM_ROLE_PROTECTED',
        'El rol técnico no puede modificarse desde la aplicación.',
        403,
      )
    const permissions = await userRepository.findPermissions()
    if (permissionIds.some((id) => !permissions.some((permission) => permission.id === id)))
      throw new AppError('PERMISSION_NOT_FOUND', 'Uno o más permisos no existen.', 422)
    const role = await userRepository.replaceRolePermissions(prisma, roleId, permissionIds)
    await recordAudit(actorId, 'UPDATE_PERMISSIONS', { roleId })
    return role
  },
}
