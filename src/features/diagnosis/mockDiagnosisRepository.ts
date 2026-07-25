import type { CorrectionMessage, PendingDiagnosis } from './diagnosisTypes'
import { correctionMessage, restorePendingDiagnosis } from './mockDiagnosis'

export interface MockDiagnosisRepository {
  restorePending: (
    diagnosisId: string | undefined,
    sessionId: string | undefined,
  ) => PendingDiagnosis
  submitAnswer: (diagnosis: PendingDiagnosis, answer: string) => Promise<CorrectionMessage>
}

export const mockDiagnosisRepository: MockDiagnosisRepository = {
  restorePending(diagnosisId, sessionId) {
    return restorePendingDiagnosis(diagnosisId, sessionId)
  },

  async submitAnswer() {
    return correctionMessage
  },
}
