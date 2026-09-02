import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppLoadingSkeleton } from '../../../components/ui/app-loading-skeleton'
import { useAuth } from '../../../features/auth/hooks/use-auth'
import { PATHS } from '../constants/paths'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()
  if (isInitializing) return <AppLoadingSkeleton />
  return isAuthenticated ? <Outlet /> : <Navigate to={PATHS.AUTH.LOGIN} replace state={{ from: location.pathname }} />
}
