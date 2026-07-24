import type { PublicQuizQuestion, QuizAnswers } from './quizTypes'

export function validateQuizAnswer(
  question: PublicQuizQuestion,
  answers: QuizAnswers,
): string | null {
  const answer = answers[question.id]?.trim()

  if (!answer) {
    return '답안을 입력하세요.'
  }

  if (question.kind === 'ESSAY' && answer.length < 10) {
    return '서술형 답안은 10자 이상 입력하세요.'
  }

  return null
}
