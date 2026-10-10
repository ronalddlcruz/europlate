import type { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../../infrastructure/database/prisma.client.js'
import { AppError } from '../errors/app-error.js'

/** Los permisos indican el módulo; este alcance define qué registros puede operar. */
export type OperationScope = { userId: string; warehouseIds: string[] } | null

export function scopeForUserRoles(roles: Iterable<string>, userId: string, warehouseIds: string[]): OperationScope {
  const keys = new Set(roles)
  // Ser responsable es independiente del cargo. El acceso global explícito
  // siempre prevalece; un empleado asignado solo opera en sus almacenes.
  if (keys.has('admin') || keys.has('general_manager')) return null
  if (!keys.has('warehouse_manager') && warehouseIds.length === 0) return null
  return { userId, warehouseIds }
}

export async function resolveOperationScope(companyId: string, userId: string): Promise<OperationScope> {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, status: 'ACTIVE' },
    select: {
      roles: { select: { role: { select: { key: true } } } },
      responsibleWarehouses: { where: { companyId, status: 'ACTIVE' }, select: { id: true } },
    },
  })
  if (!user) throw new AppError('INVALID_SESSION', 'La sesión no es válida.', 401)
  return scopeForUserRoles(user.roles.map(entry => entry.role.key), userId, user.responsibleWarehouses.map(warehouse => warehouse.id))
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
