export interface PendingDiagnosis {
  diagnosisId: string
  prompt: string
  quizScore: number
  sessionId: string
  sourceQuestion: string
}

export interface CorrectionMessage {
  focusAreas: string[]
  nextQuestionPrompt: string
  summary: string
  title: string
}
