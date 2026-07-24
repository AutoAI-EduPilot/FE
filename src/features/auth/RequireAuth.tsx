import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { routes } from '../../app/routes'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
