export type DatabasePoolMode = 'session' | 'transaction'

export function resolveDatabaseUrl(
  rawUrl: string,
  mode: DatabasePoolMode = 'session',
  connectionLimit = 5,
): string {
  const url = new URL(rawUrl)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('SUPABASE_DATABASE_URL debe apuntar a PostgreSQL')
  }
  if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 20) {
    throw new Error('NEST_DATABASE_CONNECTION_LIMIT debe estar entre 1 y 20')
  }

  // En procesos persistentes, el pooler de sesión evita el coste del modo transacción.
  if (mode === 'session' && url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543') {
    url.port = '5432'
    url.searchParams.delete('pgbouncer')
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', String(connectionLimit))
    }
  }
  return url.toString()
}
