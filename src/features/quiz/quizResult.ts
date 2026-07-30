import type { PublicQuizResult } from './quizTypes'

export function shouldShowDiagnosisEntry(result: PublicQuizResult): boolean {
  return result.score < 60 && result.diagnosisEntry !== undefined
}
