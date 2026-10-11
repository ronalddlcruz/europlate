export function resolveRuntimeDatabaseUrl(
  rawUrl: string,
  mode: 'session' | 'transaction',
  connectionLimit: number,
): string {
  const url = new URL(rawUrl)
  if (mode === 'session' && url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543') {
    url.port = '5432'
    url.searchParams.delete('pgbouncer')
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', String(connectionLimit))
    }
  }
  return url.toString()
}
