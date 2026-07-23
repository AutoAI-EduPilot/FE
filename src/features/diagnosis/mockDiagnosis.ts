import type { CorrectionMessage, PendingDiagnosis } from './diagnosisTypes'

export const pendingDiagnosis: PendingDiagnosis = {
  diagnosisId: 'diagnosis-low-score',
  prompt: '오답을 고른 이유와 헷갈린 개념을 적어 보세요.',
  quizScore: 48,
  sessionId: 'session-100',
  sourceQuestion: '현재 페이지의 핵심 개념을 설명하는 문제',
}

export const correctionMessage: CorrectionMessage = {
  summary:
    '개념 정의와 적용 사례를 분리해서 다시 정리하면 같은 유형의 문제를 더 안정적으로 풀 수 있습니다.',
  title: '교정 메시지',
}

export function restorePendingDiagnosis(
  diagnosisId: string | undefined,
  sessionId: string | undefined,
): PendingDiagnosis {
  return {
    ...pendingDiagnosis,
    diagnosisId: diagnosisId ?? pendingDiagnosis.diagnosisId,
    sessionId: sessionId ?? pendingDiagnosis.sessionId,
  }
}
