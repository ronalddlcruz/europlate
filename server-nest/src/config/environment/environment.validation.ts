import { plainToInstance } from 'class-transformer'
import { IsOptional, IsString, IsUrl, MinLength, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsString()
  SUPABASE_DATABASE_URL!: string

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string

  @IsOptional()
  @IsUrl({ require_tld: false })
  WEB_ORIGIN?: string
}

export function validateEnvironment(input: Record<string, unknown>): Record<string, unknown> {
  const environment = plainToInstance(EnvironmentVariables, input)
  const errors = validateSync(environment, { whitelist: true, forbidNonWhitelisted: false })
  if (errors.length) {
    const fields = errors.map((error) => error.property).join(', ')
    throw new Error(`Configuración de Nest incompleta o inválida: ${fields}`)
  }
  try {
    const database = new URL(environment.SUPABASE_DATABASE_URL)
    if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.hostname)
      throw new Error()
  } catch {
    throw new Error('SUPABASE_DATABASE_URL debe ser una URL de PostgreSQL válida')
  }
  const port = Number(input.NEST_PORT ?? 3002)
  if (!Number.isInteger(port) || port < 1 || port > 65535 || port === Number(input.PORT ?? 3001)) {
    throw new Error('NEST_PORT debe ser un puerto válido y distinto al de Express')
  }
  if (
    input.NEST_DATABASE_POOL_MODE !== undefined &&
    !['session', 'transaction'].includes(String(input.NEST_DATABASE_POOL_MODE))
  ) {
    throw new Error('NEST_DATABASE_POOL_MODE debe ser session o transaction')
  }
  const connectionLimit = Number(input.NEST_DATABASE_CONNECTION_LIMIT ?? 5)
  if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 20) {
    throw new Error('NEST_DATABASE_CONNECTION_LIMIT debe estar entre 1 y 20')
  }
  return { ...input, NEST_PORT: port, NEST_DATABASE_CONNECTION_LIMIT: connectionLimit }
}
