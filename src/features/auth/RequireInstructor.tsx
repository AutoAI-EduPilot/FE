import { Navigate, Outlet } from 'react-router-dom'

import { routes } from '../../app/routes'
import { isInstructorRole } from './authRoles'
import { useAuth } from './useAuth'

export function RequireInstructor() {
  const { user } = useAuth()

  if (!isInstructorRole(user?.role)) {
    return <Navigate to={routes.classrooms} replace />
  }

  return <Outlet />
}
