import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, clearAccessToken, accessToken, unauthorizedEvent } from '@/lib/api-client'
import { clearQueryCache, refreshCoreDataInBackground, restoreQueryCache } from '@/lib/query-client'
import { sessionResponseSchema } from '@/features/auth/schemas/auth.schema'
import { getSession, login, type Session } from '@/features/auth/services/auth.service'

type AuthContextValue = {
  session: Session | null
  isAuthenticated: boolean
  isInitializing: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}
export const AuthContext = createContext<AuthContextValue | null>(null)
const sessionCacheKey = 'europlate.session'

function readCachedSession(): Session | null {
  if (!accessToken()) return null
  try {
    const cached = sessionResponseSchema.safeParse(
      JSON.parse(localStorage.getItem(sessionCacheKey) ?? 'null'),
    )
    return cached.success ? { ...cached.data, accessToken: '' } : null
  } catch {
    return null
  }
}

function saveCachedSession(session: Session) {
  localStorage.setItem(sessionCacheKey, JSON.stringify({ user: session.user }))
}

function clearCachedSession() {
  localStorage.removeItem(sessionCacheKey)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const cached = readCachedSession()
    if (cached) restoreQueryCache(cached.user.id)
    return cached
  })
  const [isInitializing, setIsInitializing] = useState(
    () => Boolean(accessToken()) && !readCachedSession(),
  )
  const signOut = useCallback(() => {
    clearAccessToken()
    clearCachedSession()
    clearQueryCache(session?.user.id)
    setSession(null)
    setIsInitializing(false)
  }, [session?.user.id])
  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await login(email, password)
      if (session?.user.id !== next.user.id) clearQueryCache()
      restoreQueryCache(next.user.id)
      saveCachedSession(next)
      setSession(next)
    },
    [session?.user.id],
  )
  useEffect(() => {
    const invalidateSession = () => signOut()
    window.addEventListener(unauthorizedEvent, invalidateSession)
    if (!accessToken()) {
      setIsInitializing(false)
      return () => window.removeEventListener(unauthorizedEvent, invalidateSession)
    }
    // La API puede tardar en despertar en Render. La sesión almacenada permite
    // pintar la aplicación inmediatamente mientras esta validación ocurre detrás.
    void getSession()
      .then((next) => {
        restoreQueryCache(next.user.id)
        saveCachedSession(next)
        setSession(next)
      })
      .catch((error) => {
        // Solo se cierra una sesión que el servidor haya rechazado. Un fallo de
        // red o un arranque lento no debe sacar al usuario de la aplicación.
        if (error instanceof ApiError && error.status === 401) signOut()
      })
      .finally(() => setIsInitializing(false))
    return () => window.removeEventListener(unauthorizedEvent, invalidateSession)
  }, [signOut])
  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(refreshCoreDataInBackground, 0)
    return () => window.clearTimeout(timer)
    // La carga se repite solo al cambiar de usuario, no al refrescar su sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])
  const value = useMemo(
    () => ({ session, isAuthenticated: Boolean(session), isInitializing, signIn, signOut }),
    [session, isInitializing, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
