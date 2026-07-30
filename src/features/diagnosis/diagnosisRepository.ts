import type { SessionsRepository } from '../sessions'
import type { CorrectionMessage, PendingDiagnosis } from './diagnosisTypes'

export interface DiagnosisRepository {
  restore: (
    diagnosisId: string,
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<PendingDiagnosis | null>
  submitAnswer: (
    diagnosis: PendingDiagnosis,
    answer: string,
    signal?: AbortSignal,
  ) => Promise<CorrectionMessage>
}

export function createDiagnosisRepository(
  sessionsRepository: SessionsRepository,
): DiagnosisRepository {
  return {
    async restore(diagnosisId, sessionId, signal) {
      const session = await sessionsRepository.getById(sessionId, signal)
      const pending = session?.pendingDiagnosis

      if (!pending || pending.diagnosisId !== diagnosisId) {
        return null
      }

      return {
        diagnosisId,
        prompt: pending.prompt ?? '오답을 고른 이유와 헷갈린 개념을 적어 보세요.',
        quizScore: pending.quizScore ?? 0,
        sessionId,
        sourceQuestion: pending.sourceQuestion ?? '최근 퀴즈 오답',
      }
    },
    async submitAnswer(diagnosis, answer, signal) {
      const result = await sessionsRepository.submitTurn(
        diagnosis.sessionId,
        {
          eventType: 'DIAGNOSIS_ANSWER_SUBMITTED',
          payload: {
            answer,
            diagnosisId: toApiId(diagnosis.diagnosisId),
          },
          requestId:
            typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `diagnosis-${Date.now()}`,
        },
        signal,
      )
      const summary =
        result.messages.find((message) => message.senderType === 'AI')?.content ??
        '진단 답변을 바탕으로 교정 학습을 완료했습니다.'

      return {
        focusAreas: [],
        nextQuestionPrompt: '학습 세션에서 같은 개념을 다른 예시로 질문해 보세요.',
        summary,
        title: '교정 메시지',
      }
    },
  }
}

function toApiId(value: string): number | string {
  const numericValue = Number(value)
  return Number.isSafeInteger(numericValue) ? numericValue : value
}
