import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth, RequireInstructor } from '../features/auth'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { ClassroomsPage } from './pages/ClassroomsPage'
import { ClassroomDetailPage } from './pages/ClassroomDetailPage'
import { DiagnosisPage } from './pages/DiagnosisPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { EntranceRequestsPage } from './pages/EntranceRequestsPage'
import { InstructorCalendarPage } from './pages/instructor/InstructorCalendarPage'
import { InstructorClassroomEditPage } from './pages/instructor/InstructorClassroomEditPage'
import { InstructorLearningStatusPage } from './pages/instructor/InstructorLearningStatusPage'
import { InstructorNoticesPage } from './pages/instructor/InstructorNoticesPage'
import { LoginPage } from './pages/LoginPage'
import { MaterialDetailPage } from './pages/MaterialDetailPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QuizPage } from './pages/QuizPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionsPage } from './pages/SessionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SignupPage } from './pages/SignupPage'
import { routes } from './routes'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={routes.root}
        element={<Navigate to={routes.classrooms} replace />}
      />

      <Route element={<AuthLayout />}>
        <Route path={routes.login} element={<LoginPage />} />
        <Route
          path={routes.forgotPassword}
          element={<ForgotPasswordPage />}
        />
        <Route path={routes.signup} element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={routes.classrooms} element={<ClassroomsPage />} />
          <Route path={routes.materials} element={<MaterialsPage />} />
          <Route path={routes.materialDetail} element={<MaterialDetailPage />} />
          <Route path={routes.sessions} element={<SessionsPage />} />
          <Route path={routes.sessionDetail} element={<SessionDetailPage />} />
          <Route path={routes.quizDetail} element={<QuizPage />} />
          <Route path={routes.diagnosis} element={<DiagnosisPage />} />
          <Route path={routes.settings} element={<SettingsPage />} />
          <Route
            path={routes.classroomDetail}
            element={<ClassroomDetailPage />}
          />
          <Route element={<RequireInstructor />}>
            <Route
              path={routes.classroomEdit}
              element={<InstructorClassroomEditPage />}
            />
            <Route
              path={routes.calendar}
              element={<InstructorCalendarPage />}
            />
            <Route
              path={routes.learningStatus}
              element={<InstructorLearningStatusPage />}
            />
            <Route
              path={routes.announcements}
              element={<InstructorNoticesPage />}
            />
            <Route
              path={routes.entranceRequests}
              element={<EntranceRequestsPage />}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
