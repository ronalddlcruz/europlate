import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../common/prisma/prisma.service'
import type { AuthorizationRecord, LoginRecord } from '../types/auth.types'

const AUTHORIZATION_COLUMNS = Prisma.sql`
  u.id,
  u."companyId",
  u.name,
  u.email,
  u.status,
  ARRAY(
    SELECT r.key
    FROM "UserRole" ur
    JOIN "Role" r ON r.id = ur."roleId"
    WHERE ur."userId" = u.id
    ORDER BY r.key
  ) AS "roleKeys",
  ARRAY(
    SELECT p.key
    FROM "UserRole" ur
    JOIN "RolePermission" rp ON rp."roleId" = ur."roleId"
    JOIN "Permission" p ON p.id = rp."permissionId"
    WHERE ur."userId" = u.id
    ORDER BY p.key
  ) AS "rolePermissionKeys",
  ARRAY(
    SELECT p.key
    FROM "UserPermission" up
    JOIN "Permission" p ON p.id = up."permissionId"
    WHERE up."userId" = u.id
    ORDER BY p.key
  ) AS "directPermissionKeys"
`

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<LoginRecord | null> {
    const rows = await this.prisma.$queryRaw<LoginRecord[]>(Prisma.sql`
      SELECT ${AUTHORIZATION_COLUMNS}, u."passwordHash"
      FROM "User" u
      WHERE u.email = ${email}
      LIMIT 1
    `)
    return rows[0] ?? null
  }

  async findAuthorizationById(id: string): Promise<AuthorizationRecord | null> {
    const rows = await this.prisma.$queryRaw<AuthorizationRecord[]>(Prisma.sql`
      SELECT ${AUTHORIZATION_COLUMNS}
      FROM "User" u
      WHERE u.id = ${id}
      LIMIT 1
    `)
    return rows[0] ?? null
  }
}
