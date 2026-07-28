import type { PropsWithChildren } from 'react'

import { AuthProvider, type AuthUser } from '../features/auth'
import { ToastProvider } from '../shared/ui'

const testUser: AuthUser = {
  email: 'learner@example.com',
  id: 1,
  name: 'learner',
  role: 'USER',
}

export function TestAuthProvider({ children }: PropsWithChildren) {
  return (
    <AuthProvider initialUser={testUser}>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
