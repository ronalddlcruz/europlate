import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearAccessToken, accessToken, unauthorizedEvent } from '../../../lib/api-client'
import { getSession, login, type Session } from '../services/auth.service'

type AuthContextValue = { session: Session | null; isAuthenticated: boolean; isInitializing: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => void }
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const signOut = useCallback(() => { clearAccessToken(); queryClient.clear(); setSession(null); setIsInitializing(false) }, [queryClient])
  const signIn = useCallback(async (email: string, password: string) => { const next = await login(email, password); setSession(next); queryClient.clear() }, [queryClient])
  useEffect(() => {
    const invalidateSession = () => signOut()
    window.addEventListener(unauthorizedEvent, invalidateSession)
    if (!accessToken()) { setIsInitializing(false); return () => window.removeEventListener(unauthorizedEvent, invalidateSession) }
    void getSession().then(next => setSession(next)).catch(signOut).finally(() => setIsInitializing(false))
    return () => window.removeEventListener(unauthorizedEvent, invalidateSession)
  }, [signOut])
  const value = useMemo(() => ({ session, isAuthenticated: Boolean(session), isInitializing, signIn, signOut }), [session, isInitializing, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
