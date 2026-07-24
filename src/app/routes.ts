export const routes = {
  root: '/',
  login: '/login',
  signup: '/signup',
  materials: '/materials',
  materialDetail: '/materials/:materialId',
  sessions: '/sessions',
  sessionDetail: '/sessions/:sessionId',
  quizDetail: '/quizzes/:quizId',
  diagnosis: '/sessions/:sessionId/diagnosis/:diagnosisId',
} as const

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
