import { createContext } from 'react'

import type { LoginFormValues, SignupFormValues } from './authValidation'

export interface AuthUser {
  email: string
  name: string
}

export interface AuthContextValue {
  isAuthenticated: boolean
  login: (values: LoginFormValues) => Promise<void>
  logout: () => Promise<void>
  signup: (values: SignupFormValues) => Promise<void>
  user: AuthUser | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
