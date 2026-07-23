export interface PendingDiagnosis {
  diagnosisId: string
  prompt: string
  quizScore: number
  sessionId: string
  sourceQuestion: string
}

export interface CorrectionMessage {
  summary: string
  title: string
}
