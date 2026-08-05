import { CheckCircle2, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import { getRequestErrorMessage } from '../../shared/api'
import {
  createQuizRepository,
  shouldShowDiagnosisEntry,
  validateQuizAnswer,
  type PublicQuiz,
  type PublicQuizQuestion,
  type PublicQuizResult,
  type QuizAnswers,
  type QuizKind,
} from '../../features/quiz'
import {
  Button,
  ButtonLink,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from '../../shared/ui'
import { diagnosisPath, routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const quizKindLabels: Record<QuizKind, string> = {
  ESSAY: '서술형',
  MCQ: '객관식',
  OX: 'OX',
  SHORT: '단답형',
}

export function QuizPage() {
  return <QuizWorkspace />
}

interface QuizWorkspaceProps {
  embedded?: boolean
  onBackToPdf?: () => void
  quizId?: string
}

export function QuizWorkspace({
  embedded = false,
  onBackToPdf,
  quizId: quizIdProp,
}: QuizWorkspaceProps) {
  usePageTitle(embedded ? '학습 공간' : '퀴즈')
  const { quizId: routeQuizId } = useParams()
  const quizId = quizIdProp ?? routeQuizId
  const navigate = useNavigate()
  const { apiRequest } = useAuth()
  const repository = useMemo(
    () => createQuizRepository(apiRequest),
    [apiRequest],
  )
  const [quiz, setQuiz] = useState<PublicQuiz | null | undefined>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<PublicQuizResult | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const questions = quiz?.questions ?? []
  const question = questions[currentQuestionIndex] ?? questions[0]
  const answeredCount = questions.filter((item) => answers[item.id]?.trim()).length
  const availableKinds = Array.from(
    new Set(questions.map((item) => item.kind)),
  )
  const diagnosisEntry = result?.diagnosisEntry

  useEffect(() => {
    if (!quizId) return
    const controller = new AbortController()
    repository
      .getById(quizId, controller.signal)
      .then((nextQuiz) => {
        setQuiz(nextQuiz)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setQuiz(null)
          setError(getRequestErrorMessage(requestError))
        }
      })

    return () => controller.abort()
  }, [quizId, reloadKey, repository])

  function handleKindChange(kind: QuizKind) {
    if (isSubmitted) return
    setCurrentQuestionIndex(
      questions.findIndex((candidate) => candidate.kind === kind),
    )
    setError(null)
  }

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quiz || isSubmitting) return
    const firstInvalidQuestion = questions.find(
      (candidate) => validateQuizAnswer(candidate, answers) !== null,
    )
    const validationError = firstInvalidQuestion
      ? validateQuizAnswer(firstInvalidQuestion, answers)
      : null
    setError(validationError)

    if (validationError && firstInvalidQuestion) {
      setCurrentQuestionIndex(questions.indexOf(firstInvalidQuestion))
      return
    }

    setIsSubmitting(true)
    try {
      setResult(await repository.submit(quiz, answers))
      setIsSubmitted(true)
      setError(null)
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!quizId) {
    return (
      <QuizFrame embedded={embedded} onBackToPdf={onBackToPdf}>
        <ErrorState
          title="퀴즈를 찾을 수 없습니다."
          description="퀴즈 식별자가 없습니다."
          action={getBackAction(embedded, onBackToPdf)}
        />
      </QuizFrame>
    )
  }

  if (quiz === undefined) {
    return (
      <QuizFrame embedded={embedded} onBackToPdf={onBackToPdf}>
        <LoadingState message="퀴즈 문항을 불러오는 중입니다." />
      </QuizFrame>
    )
  }

  if (!quiz) {
    return (
      <QuizFrame embedded={embedded} onBackToPdf={onBackToPdf}>
        <ErrorState
          title="퀴즈를 찾을 수 없습니다."
          description={error ?? '세션에서 퀴즈를 다시 선택하세요.'}
          action={
            error ? (
              <Button
                onClick={() => {
                  setError(null)
                  setQuiz(undefined)
                  setReloadKey((key) => key + 1)
                }}
                type="button"
              >
                다시 시도
              </Button>
            ) : getBackAction(embedded, onBackToPdf)
          }
        />
      </QuizFrame>
    )
  }

  if (!question) {
    return (
      <QuizFrame embedded={embedded} onBackToPdf={onBackToPdf}>
        <ErrorState
          title="공개된 퀴즈 문항이 없습니다."
          description="퀴즈 생성 상태를 확인한 뒤 다시 시도하세요."
          action={getBackAction(embedded, onBackToPdf)}
        />
      </QuizFrame>
    )
  }

  return (
    <QuizFrame embedded={embedded} onBackToPdf={onBackToPdf}>
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {availableKinds.map((kind) => (
              <button
                aria-selected={kind === question.kind}
                className={[
                  'min-h-9 rounded-lg border px-3 py-1.5 type-caption font-bold',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  kind === question.kind
                    ? 'border-brand-700 bg-brand-50 text-brand-800'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50',
                ].join(' ')}
                disabled={isSubmitted}
                key={kind}
                onClick={() => handleKindChange(kind)}
                role="tab"
                type="button"
              >
                {quizKindLabels[kind]}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-caption font-semibold text-stone-600">
              문항 {currentQuestionIndex + 1} / {questions.length} · 답변{' '}
              {answeredCount} / {questions.length}
            </p>
            <div
              aria-label={`퀴즈 답변 진행률 ${answeredCount} / ${questions.length}`}
              className="h-1 w-full overflow-hidden rounded-full bg-stone-200 sm:w-48"
              role="progressbar"
            >
              <div
                className="h-full bg-brand-700"
                style={{
                  width: `${(answeredCount / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <form className="p-4 sm:p-6" onSubmit={handleSubmit}>
          <QuestionInput
            disabled={isSubmitted}
            onChange={(value) => updateAnswer(question.id, value)}
            question={question}
            value={answers[question.id] ?? ''}
          />

          {error ? (
            <p className="mt-4 type-body font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                disabled={isSubmitted || currentQuestionIndex <= 0}
                onClick={() => {
                  setCurrentQuestionIndex((index) => Math.max(index - 1, 0))
                  setError(null)
                }}
                type="button"
                variant="secondary"
              >
                <ChevronLeft aria-hidden="true" size={15} />
                이전 문항
              </Button>
              <Button
                disabled={
                  isSubmitted ||
                  currentQuestionIndex >= questions.length - 1
                }
                onClick={() => {
                  setCurrentQuestionIndex((index) =>
                    Math.min(index + 1, questions.length - 1),
                  )
                  setError(null)
                }}
                type="button"
                variant="secondary"
              >
                다음 문항
                <ChevronRight aria-hidden="true" size={15} />
              </Button>
            </div>
            <Button disabled={isSubmitted || isSubmitting} type="submit">
              <Send aria-hidden="true" size={15} />
              {isSubmitting ? '제출 중' : isSubmitted ? '제출 완료' : '제출'}
            </Button>
          </div>
        </form>
      </section>

      {isSubmitted && result ? (
        <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 aria-hidden="true" className="text-emerald-700" size={20} />
              <div>
                <h2 className="type-section-title font-bold text-emerald-950">결과</h2>
                <p className="mt-1 type-body text-emerald-900">
                  점수 {result.score}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {shouldShowDiagnosisEntry(result) && diagnosisEntry ? (
                embedded ? (
                  <Button
                    onClick={() => navigate(diagnosisPath(
                      diagnosisEntry.sessionId,
                      diagnosisEntry.diagnosisId,
                    ))}
                    type="button"
                    variant="secondary"
                  >
                    진단으로 이어가기
                  </Button>
                ) : (
                  <ButtonLink
                    to={diagnosisPath(
                      diagnosisEntry.sessionId,
                      diagnosisEntry.diagnosisId,
                    )}
                    variant="secondary"
                  >
                    진단으로 이어가기
                  </ButtonLink>
                )
              ) : null}
              {embedded && onBackToPdf ? (
                <Button onClick={onBackToPdf} type="button" variant="secondary">
                  PDF로 돌아가기
                </Button>
              ) : (
                <ButtonLink to={routes.sessions} variant="secondary">
                  세션으로 돌아가기
                </ButtonLink>
              )}
            </div>
          </div>

          <ul className="divide-y divide-stone-200">
            {result.feedback.map((feedback) => (
              <li className="px-4 py-3 type-body text-stone-700 sm:px-5" key={feedback.questionId}>
                {feedback.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </QuizFrame>
  )
}

function QuizFrame({
  children,
  embedded,
  onBackToPdf,
}: {
  children: ReactNode
  embedded: boolean
  onBackToPdf?: () => void
}) {
  if (!embedded) {
    return (
      <PageContainer>
        <PageHeader title="퀴즈" />
        {children}
      </PageContainer>
    )
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-stone-200 px-4">
        <Button
          onClick={onBackToPdf}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ChevronLeft aria-hidden="true" size={15} />
          PDF로 돌아가기
        </Button>
        <h2 className="type-body font-semibold text-stone-950">퀴즈</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {children}
      </div>
    </section>
  )
}

function getBackAction(embedded: boolean, onBackToPdf?: () => void) {
  return embedded && onBackToPdf ? (
    <Button onClick={onBackToPdf} type="button" variant="secondary">
      PDF로 돌아가기
    </Button>
  ) : (
    <ButtonLink to={routes.sessions}>세션 목록으로</ButtonLink>
  )
}

function QuestionInput({
  disabled,
  onChange,
  question,
  value,
}: {
  disabled: boolean
  onChange: (value: string) => void
  question: PublicQuizQuestion
  value: string
}) {
  if (question.kind === 'MCQ' || question.kind === 'OX') {
    return (
      <fieldset className="space-y-4">
        <legend className="type-dialog-title font-bold text-stone-950">{question.prompt}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {question.choices?.map((choice) => (
            <label
              className={[
                'flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 type-body font-medium',
                value === choice.id
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50',
              ].join(' ')}
              key={choice.id}
            >
              <input
                aria-label={choice.label}
                checked={value === choice.id}
                disabled={disabled}
                name={question.id}
                onChange={() => onChange(choice.id)}
                type="radio"
                value={choice.id}
              />
              {choice.label}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (question.kind === 'SHORT') {
    return (
      <label className="block">
        <span className="type-dialog-title font-bold text-stone-950">{question.prompt}</span>
        <input
          className="mt-4 min-h-10 w-full rounded-lg border border-stone-300 px-3 py-2 type-body focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          value={value}
        />
      </label>
    )
  }

  return (
    <label className="block">
      <span className="type-dialog-title font-bold text-stone-950">{question.prompt}</span>
      <textarea
        className="mt-4 min-h-36 w-full rounded-lg border border-stone-300 px-3 py-2 type-body focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}
