import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../features/auth'
import { ThemeProvider } from '../shared/theme'
import { ToastProvider } from '../shared/ui'
import { AppRoutes } from './AppRoutes'

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
