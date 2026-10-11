import 'dotenv/config'
import { performance } from 'node:perf_hooks'
import { Prisma, PrismaClient, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.SUPABASE_DATABASE_URL
if (!databaseUrl) throw new Error('Falta SUPABASE_DATABASE_URL')
const runtimeUrl = new URL(databaseUrl)
if (process.env.AUTH_DIAGNOSE_SESSION_MODE === '1') {
  if (!runtimeUrl.hostname.endsWith('.pooler.supabase.com') || runtimeUrl.port !== '6543') {
    throw new Error('La prueba de modo sesión requiere el pooler compartido en el puerto 6543')
  }
  runtimeUrl.port = '5432'
  runtimeUrl.searchParams.delete('pgbouncer')
}
console.log(`Modo de conexión: ${runtimeUrl.port === '5432' ? 'sesión' : 'transacción'}`)
const sampleCount = Number(process.env.AUTH_DIAGNOSE_SAMPLES ?? 12)
if (!Number.isInteger(sampleCount) || sampleCount < 3 || sampleCount > 30) {
  throw new Error('AUTH_DIAGNOSE_SAMPLES debe estar entre 3 y 30')
}

const prisma = new PrismaClient({
  datasources: { db: { url: runtimeUrl.toString() } },
  log: [{ emit: 'event', level: 'query' }],
})
let queryEvents = []
prisma.$on('query', (event) => {
  const operation = /^(SELECT|WITH|BEGIN|COMMIT|SET|DEALLOCATE|ROLLBACK)/i.exec(
    event.query.trim(),
  )?.[1]
  queryEvents.push({ duration: event.duration, operation: operation?.toUpperCase() ?? 'OTHER' })
})

const authSelect = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  status: true,
  passwordHash: true,
  roles: {
    select: {
      role: {
        select: {
          key: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  },
  permissions: { select: { permission: { select: { key: true } } } },
}

function quantile(values, percent) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * percent) - 1].toFixed(1)
}

async function measure(label, fn, count = sampleCount) {
  for (let i = 0; i < 2; i++) await fn()
  const wall = []
  const database = []
  const queries = []
  let operations = []
  for (let i = 0; i < count; i++) {
    queryEvents = []
    const started = performance.now()
    await fn()
    wall.push(performance.now() - started)
    database.push(queryEvents.reduce((sum, value) => sum + value.duration, 0))
    queries.push(queryEvents.length)
    if (i === 0) operations = queryEvents.map((event) => event.operation)
  }
  console.log(
    `${label}: n=${count}, wall p50=${quantile(wall, 0.5)} ms, p95=${quantile(wall, 0.95)} ms; ` +
      `Prisma SQL p50=${quantile(database, 0.5)} ms; SQL/call=${[...new Set(queries)].join('/')}; ` +
      `tipos=${operations.join(',')}`,
  )
}

try {
  const started = performance.now()
  await prisma.$connect()
  console.log(`Prisma conexión inicial: ${(performance.now() - started).toFixed(1)} ms`)

  const reference = await prisma.user.findFirst({
    where: { status: UserStatus.ACTIVE },
    select: { id: true, email: true, passwordHash: true },
  })
  if (!reference) throw new Error('No hay un usuario activo para medir la consulta real')

  await measure('SELECT 1, conexión reutilizada', () => prisma.$queryRaw`SELECT 1`)
  await measure('Usuario existente, identidad mínima', () =>
    prisma.user.findUnique({ where: { email: reference.email }, select: { id: true } }),
  )
  await measure('Usuario existente, login completo', () =>
    prisma.user.findUnique({ where: { email: reference.email }, select: authSelect }),
  )
  const consolidatedSql = Prisma.sql`
    SELECT
      u.id,
      u."companyId",
      u.name,
      u.email,
      u.status,
      u."passwordHash",
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
    FROM "User" u
    WHERE u.email = ${reference.email}
  `
  const consolidatedLookup = () => prisma.$queryRaw(consolidatedSql)
  const existing = await prisma.user.findUnique({
    where: { email: reference.email },
    select: authSelect,
  })
  const consolidated = (await consolidatedLookup())[0]
  const expectedRoles = existing.roles.map((item) => item.role.key).sort()
  const expectedRolePermissions = existing.roles
    .flatMap((item) => item.role.permissions.map((permission) => permission.permission.key))
    .sort()
  const expectedDirectPermissions = existing.permissions.map((item) => item.permission.key).sort()
  if (
    JSON.stringify(expectedRoles) !== JSON.stringify(consolidated.roleKeys) ||
    JSON.stringify(expectedRolePermissions) !== JSON.stringify(consolidated.rolePermissionKeys) ||
    JSON.stringify(expectedDirectPermissions) !== JSON.stringify(consolidated.directPermissionKeys)
  )
    throw new Error('La consulta consolidada no conserva los permisos del usuario')
  await measure('Usuario existente, SQL consolidado', consolidatedLookup)
  const fullPlanRows = await prisma.$queryRaw(
    Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${consolidatedSql}`,
  )
  const fullPlan = fullPlanRows[0]?.['QUERY PLAN']?.[0]
  if (fullPlan) {
    console.log(
      `Plan SQL consolidado: planificación=${Number(fullPlan['Planning Time']).toFixed(2)} ms, ` +
        `ejecución=${Number(fullPlan['Execution Time']).toFixed(2)} ms`,
    )
  }
  await measure('bcrypt.compare, contraseña incorrecta', () =>
    bcrypt.compare('diagnostico-no-es-la-clave', reference.passwordHash),
  )

  const planRows = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT "id" FROM "User" WHERE "email" = ${reference.email}
  `
  const plan = planRows[0]?.['QUERY PLAN']?.[0]
  if (plan) {
    console.log(
      `Plan SQL email: ${plan.Plan?.['Node Type'] ?? 'desconocido'}, ` +
        `planificación=${Number(plan['Planning Time']).toFixed(2)} ms, ` +
        `ejecución=${Number(plan['Execution Time']).toFixed(2)} ms`,
    )
  }

  try {
    const activity = await prisma.$queryRaw`
      SELECT state, count(*)::int AS connections
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `
    console.log(`Conexiones visibles por estado: ${JSON.stringify(activity)}`)
  } catch {
    console.log('pg_stat_activity no está disponible para este usuario')
  }

  try {
    const stats = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN ltrim(query) ILIKE 'INSERT%' THEN 'INSERT'
          WHEN ltrim(query) ILIKE 'UPDATE%' THEN 'UPDATE'
          WHEN ltrim(query) ILIKE 'DELETE%' THEN 'DELETE'
          ELSE 'OTHER'
        END AS operation,
        sum(calls)::float8 AS calls,
        round(sum(total_exec_time)::numeric, 1)::float8 AS total_exec_ms,
        round((sum(total_exec_time) / nullif(sum(calls), 0))::numeric, 2)::float8 AS avg_exec_ms
      FROM pg_stat_statements
      WHERE ltrim(query) ILIKE 'INSERT%'
         OR ltrim(query) ILIKE 'UPDATE%'
         OR ltrim(query) ILIKE 'DELETE%'
      GROUP BY operation
      ORDER BY total_exec_ms DESC
    `
    console.log(`Escrituras históricas agregadas (sin SQL ni datos): ${JSON.stringify(stats)}`)

    const slowWrites = await prisma.$queryRaw`
      SELECT query, calls::float8 AS calls, total_exec_time::float8 AS total_exec_ms
      FROM pg_stat_statements
      WHERE ltrim(query) ILIKE 'UPDATE%' OR ltrim(query) ILIKE 'DELETE%'
      ORDER BY total_exec_time DESC
      LIMIT 100
    `
    const byTable = new Map()
    for (const item of slowWrites) {
      const match = item.query.match(
        /^\s*(UPDATE|DELETE\s+FROM)\s+(?:"?public"?\.)?"?([A-Za-z_][A-Za-z_0-9]*)"?/i,
      )
      if (!match) continue
      const key = `${match[1].toUpperCase().replace(/\s+/, ' ')} ${match[2]}`
      const previous = byTable.get(key) ?? { calls: 0, totalMs: 0 }
      byTable.set(key, {
        calls: previous.calls + item.calls,
        totalMs: previous.totalMs + item.total_exec_ms,
      })
    }
    const tableSummary = [...byTable.entries()]
      .map(([table, value]) => ({
        table,
        calls: value.calls,
        totalMs: Number(value.totalMs.toFixed(1)),
        averageMs: Number((value.totalMs / value.calls).toFixed(1)),
      }))
      .sort((left, right) => right.totalMs - left.totalMs)
      .slice(0, 10)
    console.log(`UPDATE/DELETE por tabla (sin SQL ni datos): ${JSON.stringify(tableSummary)}`)
  } catch {
    console.log('pg_stat_statements no está disponible para este usuario')
  }
} finally {
  await prisma.$disconnect()
}
