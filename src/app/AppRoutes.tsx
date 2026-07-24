import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '../features/auth'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { DiagnosisPage } from './pages/DiagnosisPage'
import { LoginPage } from './pages/LoginPage'
import { MaterialDetailPage } from './pages/MaterialDetailPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QuizPage } from './pages/QuizPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionsPage } from './pages/SessionsPage'
import { SignupPage } from './pages/SignupPage'
import { routes } from './routes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.root} element={<Navigate to={routes.materials} replace />} />

      <Route element={<AuthLayout />}>
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.signup} element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={routes.materials} element={<MaterialsPage />} />
          <Route path={routes.materialDetail} element={<MaterialDetailPage />} />
          <Route path={routes.sessions} element={<SessionsPage />} />
          <Route path={routes.sessionDetail} element={<SessionDetailPage />} />
          <Route path={routes.quizDetail} element={<QuizPage />} />
          <Route path={routes.diagnosis} element={<DiagnosisPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
