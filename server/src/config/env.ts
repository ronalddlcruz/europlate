import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()
dotenv.config({ path: 'prisma/.env', override: false })

const schema = z.object({ SUPABASE_DATABASE_URL: z.string().url(), SUPABASE_DIRECT_URL: z.string().url(), SUPABASE_URL: z.string().url(), SUPABASE_PUBLISHABLE_KEY: z.string().min(1), SUPABASE_SECRET_KEY: z.string().min(1), SUPABASE_PURCHASES_BUCKET: z.string().min(1).default('purchase-documents'), JWT_SECRET: z.string().min(32), WEB_ORIGIN: z.string().url().optional(), PORT: z.coerce.number().default(3001), NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), EXPRESS_DATABASE_POOL_MODE: z.enum(['session', 'transaction']).default('session'), EXPRESS_DATABASE_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(20).default(5), API_SLOW_REQUEST_MS: z.coerce.number().int().min(1).optional(), API_DOCS_ENABLED: z.enum(['true', 'false']).optional() })
export const env = schema.parse(process.env)
