import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { PATHS } from '../constants/paths'

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  // Nunca se bloquea el login por una validación de sesión lenta. Si la sesión
  // sigue vigente, se redirige automáticamente cuando el servidor responda.
  if (isInitializing) return <Outlet />
  return isAuthenticated ? <Navigate to={PATHS.APP.DASHBOARD} replace /> : <Outlet />
}
