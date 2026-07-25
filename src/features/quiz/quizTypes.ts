export type QuizKind = 'ESSAY' | 'MCQ' | 'OX' | 'SHORT'

export interface QuizChoice {
  id: string
  label: string
}

export interface PublicQuizQuestion {
  choices?: QuizChoice[]
  id: string
  kind: QuizKind
  prompt: string
}

export type QuizAnswers = Record<string, string>

export interface PublicQuizFeedback {
  message: string
  questionId: string
}

export interface PublicQuizResult {
  diagnosisEntry?: {
    diagnosisId: string
    sessionId: string
  }
  feedback: PublicQuizFeedback[]
  score: number
  submittedAt: string
}
