export const routes = {
  root: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  signup: '/signup',
  classrooms: '/classrooms',
  classroomDetail: '/classrooms/:classroomId',
  classroomEdit: '/classrooms/:classroomId/edit',
  calendar: '/calendar',
  learningStatus: '/learning-status',
  announcements: '/announcements',
  entranceRequests: '/entrance-requests',
  materials: '/materials',
  materialDetail: '/materials/:materialId',
  sessions: '/sessions',
  sessionDetail: '/sessions/:sessionId',
  settings: '/settings',
  quizDetail: '/quizzes/:quizId',
  diagnosis: '/sessions/:sessionId/diagnosis/:diagnosisId',
} as const

export function classroomDetailPath(classroomId: string | number): string {
  return `/classrooms/${classroomId}`
}

export function classroomEditPath(classroomId: string | number): string {
  return `/classrooms/${classroomId}/edit`
}

export function materialDetailPath(materialId: string | number): string {
  return `/materials/${materialId}`
}

export function sessionDetailPath(sessionId: string | number): string {
  return `/sessions/${sessionId}`
}

export function quizDetailPath(quizId: string | number): string {
  return `/quizzes/${quizId}`
}

export function diagnosisPath(
  sessionId: string | number,
  diagnosisId: string | number,
): string {
  return `/sessions/${sessionId}/diagnosis/${diagnosisId}`
}
