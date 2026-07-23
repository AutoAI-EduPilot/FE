import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'

import { AuthContext, type AuthContextValue, type AuthUser } from './authContext'
import type { LoginFormValues, SignupFormValues } from './authValidation'

interface AuthProviderProps {
  initialUser?: AuthUser | null
}

export function AuthProvider({
  children,
  initialUser = null,
}: PropsWithChildren<AuthProviderProps>) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)

  const login = useCallback(async (values: LoginFormValues) => {
    await waitForMockAuth()
    setUser({
      email: values.email.trim().toLowerCase(),
      name: getNameFromEmail(values.email),
    })
  }, [])

  const signup = useCallback(async (values: SignupFormValues) => {
    await waitForMockAuth()
    setUser({
      email: values.email.trim().toLowerCase(),
      name: values.name.trim(),
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      login,
      logout,
      signup,
      user,
    }),
    [login, logout, signup, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function getNameFromEmail(email: string): string {
  return email.trim().split('@')[0] || 'EduPilot 사용자'
}

function waitForMockAuth(): Promise<void> {
  return Promise.resolve()
}
