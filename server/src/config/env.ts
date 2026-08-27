import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()
dotenv.config({ path: 'prisma/.env', override: false })

const schema = z.object({ SUPABASE_DATABASE_URL: z.string().url(), SUPABASE_DIRECT_URL: z.string().url(), JWT_SECRET: z.string().min(32), WEB_ORIGIN: z.string().url().optional(), PORT: z.coerce.number().default(3001), NODE_ENV: z.enum(['development', 'test', 'production']).default('development') })
export const env = schema.parse(process.env)
