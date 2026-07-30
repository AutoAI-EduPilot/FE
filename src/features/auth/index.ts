export { AUTH_IDLE_TIMEOUT_MS, AuthProvider } from './AuthProvider'
export { RequireAuth } from './RequireAuth'
export { useAuth } from './useAuth'
export { getRoleLabel, isInstructorRole } from './authRoles'
export type { AuthContextValue, AuthUser } from './authContext'
export type {
  AuthenticatedRawRequest,
  AuthenticatedRequest,
  LogoutReason,
} from './authContext'
export {
  AuthValidationError,
  mapAuthErrorToFormErrors,
} from './authErrors'
export {
  hasFormErrors,
  validateLoginForm,
  validateSignupForm,
  type LoginFormErrors,
  type LoginFormValues,
  type SignupFormErrors,
  type SignupFormValues,
} from './authValidation'
