import { Navigate, Outlet } from 'react-router-dom'
import { AppLoadingSkeleton } from '../../../components/ui/app-loading-skeleton'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { PATHS } from '../constants/paths'

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <AppLoadingSkeleton />
  return isAuthenticated ? <Navigate to={PATHS.APP.DASHBOARD} replace /> : <Outlet />
}
