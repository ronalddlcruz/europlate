import type { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../../infrastructure/database/prisma.client.js'
import { AppError } from '../errors/app-error.js'

/** Los permisos indican el módulo; este alcance define qué registros puede operar. */
export type OperationScope = { userId: string; warehouseIds: string[] } | null

export function scopeForUserPermissions(permissions: Iterable<string>, userId: string, warehouseIds: string[]): OperationScope {
  const keys = new Set(permissions)
  // La política vive en la base: un permiso global prevalece sobre cualquier
  // asignación de almacén. Un responsable sin almacenes sigue limitado.
  if (keys.has('operations.global')) return null
  if (!keys.has('operations.scoped') && warehouseIds.length === 0) return null
  return { userId, warehouseIds }
}

export async function resolveOperationScope(companyId: string, userId: string): Promise<OperationScope> {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, status: 'ACTIVE' },
    select: {
      roles: { select: { role: { select: { permissions: { select: { permission: { select: { key: true } } } } } } } },
      permissions: { select: { permission: { select: { key: true } } } },
      responsibleWarehouses: { where: { companyId, status: 'ACTIVE' }, select: { id: true } },
    },
  })
  if (!user) throw new AppError('INVALID_SESSION', 'La sesión no es válida.', 401)
  return scopeForUserPermissions([
    ...user.roles.flatMap(entry => entry.role.permissions.map(item => item.permission.key)),
    ...user.permissions.map(item => item.permission.key),
  ], userId, user.responsibleWarehouses.map(warehouse => warehouse.id))
}

export function assertWarehouseScope(scope: OperationScope, warehouseIds: string[]) {
  if (scope && warehouseIds.some(id => !scope.warehouseIds.includes(id))) {
    throw new AppError('WAREHOUSE_SCOPE_DENIED', 'Solo puedes operar en los almacenes asignados a tu usuario.', 403)
  }
}

export async function requireGlobalAccess(request: Request, _response: Response, next: NextFunction) {
  const scope = await resolveOperationScope(request.auth!.companyId, request.auth!.id)
  if (scope) throw new AppError('GLOBAL_ACCESS_REQUIRED', 'La administración de usuarios y almacenes requiere acceso global.', 403)
  next()
}

export const purchaseScopeWhere = (scope: OperationScope): Prisma.PurchaseWhereInput => scope ? {
  createdByUserId: scope.userId,
  items: { some: {}, every: { warehouseId: { in: scope.warehouseIds } } },
} : {}

export const importScopeWhere = (scope: OperationScope): Prisma.ImportWhereInput => scope ? {
  createdByUserId: scope.userId,
  items: { some: {}, every: { warehouseId: { in: scope.warehouseIds } } },
} : {}

export const productionScopeWhere = (scope: OperationScope): Prisma.ProductionOrderWhereInput => scope ? {
  createdByUserId: scope.userId,
  warehouseId: { in: scope.warehouseIds },
  materials: { every: { warehouseId: { in: scope.warehouseIds } } },
} : {}
