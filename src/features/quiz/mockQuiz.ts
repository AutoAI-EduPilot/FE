import type { PublicQuizQuestion, PublicQuizResult, QuizKind } from './quizTypes'

export const quizKinds: QuizKind[] = ['MCQ', 'OX', 'SHORT', 'ESSAY']

export const publicQuizQuestions: PublicQuizQuestion[] = [
  {
    choices: [
      { id: 'mcq-a', label: '개념의 정의를 먼저 확인한다.' },
      { id: 'mcq-b', label: '본문 전체를 암기한다.' },
      { id: 'mcq-c', label: '문제 번호만 기록한다.' },
    ],
    id: 'question-mcq',
    kind: 'MCQ',
    prompt: '새 개념을 학습할 때 가장 먼저 확인할 정보는 무엇인가요?',
  },
  {
    choices: [
      { id: 'ox-o', label: 'O' },
      { id: 'ox-x', label: 'X' },
    ],
    id: 'question-ox',
    kind: 'OX',
    prompt: '학습 중 이해가 낮은 부분은 진단 흐름으로 이어질 수 있습니다.',
  },
  {
    id: 'question-short',
    kind: 'SHORT',
    prompt: '현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.',
  },
  {
    id: 'question-essay',
    kind: 'ESSAY',
    prompt: '오늘 학습한 내용을 자신의 말로 설명해 보세요.',
  },
]

export const publicQuizResult: PublicQuizResult = {
  diagnosisEntry: {
    diagnosisId: 'diagnosis-low-score',
    sessionId: 'session-100',
  },
  feedback: [
    {
      message: '핵심 개념을 짧게 정리했습니다.',
      questionId: 'question-short',
    },
  ],
  score: 48,
  submittedAt: '2026-07-24T07:00:00+09:00',
}

export function getQuestionByKind(kind: QuizKind): PublicQuizQuestion {
  return publicQuizQuestions.find((question) => question.kind === kind) ?? publicQuizQuestions[0]
}

export function shouldShowDiagnosisEntry(result: PublicQuizResult): boolean {
  return result.score < 60 && result.diagnosisEntry !== undefined
}
