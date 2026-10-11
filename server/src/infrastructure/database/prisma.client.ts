import { PrismaClient } from '@prisma/client'
import { env } from '../../config/env.js'
import { resolveRuntimeDatabaseUrl } from './connection-url.js'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveRuntimeDatabaseUrl(
        env.SUPABASE_DATABASE_URL,
        env.EXPRESS_DATABASE_POOL_MODE,
        env.EXPRESS_DATABASE_CONNECTION_LIMIT,
      ),
    },
  },
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})
