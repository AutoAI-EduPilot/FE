import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../features/auth'
import { ToastProvider } from '../shared/ui'
import { AppRoutes } from './AppRoutes'

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
