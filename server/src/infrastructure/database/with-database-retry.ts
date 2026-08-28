/** Reintenta únicamente lecturas cuando el pooler de Supabase cierra una conexión.
 * No se usa para escrituras para evitar repetir operaciones no idempotentes. */
export async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : ''
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      const transient = ['P1001', 'P1002', 'P1017', 'P2024'].includes(code) || message.includes('econnrefused') || message.includes('server has closed') || message.includes('connection')
      if (!transient || attempt === attempts - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt))
    }
  }
  throw lastError
}
