import { createContext } from 'react'

import type {
  ApiRequestOptions,
  ApiSuccess,
  RawApiRequestOptions,
} from '../../shared/api'
import type { LoginFormValues, SignupFormValues } from './authValidation'

export interface AuthUser {
  email: string
  id?: number
  name: string
  role?: string
}

export type LogoutReason = 'idle' | 'manual' | 'session-expired'

export type AuthenticatedRequest = <T>(
  path: string,
  options?: ApiRequestOptions,
) => Promise<ApiSuccess<T>>

export type AuthenticatedRawRequest = (
  path: string,
  options?: RawApiRequestOptions,
) => Promise<Response>

export interface AuthContextValue {
  apiRequest: AuthenticatedRequest
  rawApiRequest: AuthenticatedRawRequest
  checkEmailAvailability: (
    email: string,
    signal?: AbortSignal,
  ) => Promise<boolean>
  isAuthenticated: boolean
  isInitializing: boolean
  login: (values: LoginFormValues) => Promise<void>
  logoutReason: LogoutReason | null
  logout: () => Promise<void>
  signup: (values: SignupFormValues) => Promise<void>
  user: AuthUser | null
  withdraw: (password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
