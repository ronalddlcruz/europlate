import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, clearAccessToken, accessToken, unauthorizedEvent } from '../../../lib/api-client'
import { getSession, login, type Session } from '../services/auth.service'

type AuthContextValue = { session: Session | null; isAuthenticated: boolean; isInitializing: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)
const sessionCacheKey = 'europlate.session'

function readCachedSession(): Session | null {
  if (!accessToken()) return null
  try {
    const cached = JSON.parse(localStorage.getItem(sessionCacheKey) ?? 'null') as Omit<Session, 'accessToken'> | null
    return cached?.user?.id && cached.user.email ? { ...cached, accessToken: '' } : null
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
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => readCachedSession())
  const [isInitializing, setIsInitializing] = useState(() => Boolean(accessToken()) && !readCachedSession())
  const signOut = useCallback(() => { clearAccessToken(); clearCachedSession(); queryClient.clear(); setSession(null); setIsInitializing(false) }, [queryClient])
  const signIn = useCallback(async (email: string, password: string) => { const next = await login(email, password); saveCachedSession(next); setSession(next); queryClient.clear() }, [queryClient])
  useEffect(() => {
    const invalidateSession = () => signOut()
    window.addEventListener(unauthorizedEvent, invalidateSession)
    if (!accessToken()) { setIsInitializing(false); return () => window.removeEventListener(unauthorizedEvent, invalidateSession) }
    // La API puede tardar en despertar en Render. La sesión almacenada permite
    // pintar la aplicación inmediatamente mientras esta validación ocurre detrás.
    void getSession()
      .then(next => { saveCachedSession(next); setSession(next) })
      .catch(error => {
        // Solo se cierra una sesión que el servidor haya rechazado. Un fallo de
        // red o un arranque lento no debe sacar al usuario de la aplicación.
        if (error instanceof ApiError && error.status === 401) signOut()
      })
      .finally(() => setIsInitializing(false))
    return () => window.removeEventListener(unauthorizedEvent, invalidateSession)
  }, [signOut])
  const value = useMemo(() => ({ session, isAuthenticated: Boolean(session), isInitializing, signIn, signOut }), [session, isInitializing, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
