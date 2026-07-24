import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'

import { AuthContext, type AuthContextValue, type AuthUser } from './authContext'
import { mockAuthRepository } from './mockAuthRepository'
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
    const nextUser = await mockAuthRepository.login(values)
    setUser(nextUser)
  }, [])

  const signup = useCallback(async (values: SignupFormValues) => {
    const nextUser = await mockAuthRepository.signup(values)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    await mockAuthRepository.logout()
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
