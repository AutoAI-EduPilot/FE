import { ApiClientError } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'
import type {
  PublicQuiz,
  PublicQuizQuestion,
  PublicQuizResult,
  QuizAnswers,
  QuizChoice,
  QuizKind,
} from './quizTypes'

interface QuizChoiceDto {
  id?: number | string
  label?: string
  text?: string
}

interface QuizQuestionDto {
  choices?: QuizChoiceDto[]
  id?: number | string
  kind?: QuizKind
  prompt: string
  questionId?: number | string
  questionType?: QuizKind
}

interface PublicQuizDto {
  coverageEndPage?: number
  coverageStartPage?: number
  page?: number
  questions: QuizQuestionDto[]
  quizId: number | string
  quizType: QuizKind
  sessionId: number | string
  submitted: boolean
  title: string
}

interface QuizSubmitDto {
  gradingResult?: {
    items?: Array<{
      feedback?: string
      questionId: number | string
    }>
  }
  maxScore?: number
  passed?: boolean
  quizId: number | string
  score: number
  submissionId: number | string
  uiActions?: Array<{
    diagnosisId?: number | string
    type: string
  }>
}

export interface QuizRepository {
  getById: (
    quizId: string,
    signal?: AbortSignal,
  ) => Promise<PublicQuiz | null>
  submit: (
    quiz: PublicQuiz,
    answers: QuizAnswers,
    signal?: AbortSignal,
  ) => Promise<PublicQuizResult>
}

export function createQuizRepository(
  request: AuthenticatedRequest,
): QuizRepository {
  return {
    async getById(quizId, signal) {
      try {
        const { data } = await request<PublicQuizDto>(
          `/api/quizzes/${encodeURIComponent(quizId)}`,
          { signal },
        )
        return mapQuiz(data)
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) return null
        throw error
      }
    },
    async submit(quiz, answers, signal) {
      const { data } = await request<QuizSubmitDto>(
        `/api/quizzes/${encodeURIComponent(quiz.id)}/submit`,
        {
          body: {
            answers: quiz.questions.map((question) => ({
              answer: answers[question.id] ?? '',
              questionId: question.id,
            })),
            requestId:
              typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `quiz-${Date.now()}`,
          },
          method: 'POST',
          signal,
        },
      )
      const diagnosisAction = data.uiActions?.find(
        (action) =>
          action.type === 'DIAGNOSIS_QUESTION' &&
          action.diagnosisId !== undefined,
      )

      return {
        diagnosisEntry:
          diagnosisAction?.diagnosisId === undefined
            ? undefined
            : {
                diagnosisId: String(diagnosisAction.diagnosisId),
                sessionId: quiz.sessionId,
              },
        feedback: (data.gradingResult?.items ?? []).map((item) => ({
          message: item.feedback ?? '채점이 완료되었습니다.',
          questionId: String(item.questionId),
        })),
        maxScore: data.maxScore,
        passed: data.passed,
        score: data.score,
        submittedAt: new Date().toISOString(),
      }
    },
  }
}

function mapQuiz(quiz: PublicQuizDto): PublicQuiz {
  return {
    coverageEndPage: quiz.coverageEndPage,
    coverageStartPage: quiz.coverageStartPage,
    id: String(quiz.quizId),
    kind: quiz.quizType,
    page: quiz.page,
    questions: quiz.questions.map(mapQuestion),
    sessionId: String(quiz.sessionId),
    submitted: quiz.submitted,
    title: quiz.title,
  }
}

function mapQuestion(question: QuizQuestionDto): PublicQuizQuestion {
  return {
    choices: question.choices?.map(mapChoice),
    id: String(question.id ?? question.questionId),
    kind: question.kind ?? question.questionType ?? 'SHORT',
    prompt: question.prompt,
  }
}

function mapChoice(choice: QuizChoiceDto): QuizChoice {
  return {
    id: String(choice.id),
    label: choice.label ?? choice.text ?? '',
  }
}
