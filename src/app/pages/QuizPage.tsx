import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import {
  publicQuizQuestions,
  publicQuizResult,
  quizKinds,
  shouldShowDiagnosisEntry,
  validateQuizAnswer,
  type PublicQuizQuestion,
  type QuizAnswers,
  type QuizKind,
} from '../../features/quiz'
import { Badge, Button, ButtonLink, PageHeader } from '../../shared/ui'
import { diagnosisPath, routes } from '../routes'

export function QuizPage() {
  const { quizId } = useParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const question = publicQuizQuestions[currentQuestionIndex] ?? publicQuizQuestions[0]
  const answeredCount = publicQuizQuestions.filter((item) => answers[item.id]?.trim()).length
  const diagnosisEntry = publicQuizResult.diagnosisEntry

  function handleKindChange(kind: QuizKind) {
    if (isSubmitted) {
      return
    }

    setCurrentQuestionIndex(
      publicQuizQuestions.findIndex((candidate) => candidate.kind === kind),
    )
    setError(null)
  }

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const firstInvalidQuestion = publicQuizQuestions.find(
      (candidate) => validateQuizAnswer(candidate, answers) !== null,
    )
    const validationError = firstInvalidQuestion
      ? validateQuizAnswer(firstInvalidQuestion, answers)
      : null
    setError(validationError)

    if (validationError && firstInvalidQuestion) {
      setCurrentQuestionIndex(publicQuizQuestions.indexOf(firstInvalidQuestion))
      return
    }

    setIsSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quiz"
        title="퀴즈"
        description={`퀴즈 ${quizId ?? '-'} 풀이와 feedback을 확인합니다.`}
        actions={<Badge tone="warning">BE#33 연동 예정</Badge>}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist">
          {quizKinds.map((kind) => (
            <button
              aria-selected={kind === question.kind}
              className={[
                'rounded-lg border px-3 py-2 text-sm font-semibold',
                kind === question.kind
                  ? 'border-teal-600 bg-teal-50 text-teal-800'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
              ].join(' ')}
              disabled={isSubmitted}
              key={kind}
              onClick={() => handleKindChange(kind)}
              role="tab"
              type="button"
            >
              {kind}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-600">
          문항 {currentQuestionIndex + 1} / {publicQuizQuestions.length} · 답변 {answeredCount} /{' '}
          {publicQuizQuestions.length}
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <QuestionInput
            disabled={isSubmitted}
            onChange={(value) => updateAnswer(question.id, value)}
            question={question}
            value={answers[question.id] ?? ''}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isSubmitted || currentQuestionIndex <= 0}
              onClick={() => {
                setCurrentQuestionIndex((index) => Math.max(index - 1, 0))
                setError(null)
              }}
              type="button"
              variant="secondary"
            >
              이전 문항
            </Button>
            <Button
              disabled={isSubmitted || currentQuestionIndex >= publicQuizQuestions.length - 1}
              onClick={() => {
                setCurrentQuestionIndex((index) =>
                  Math.min(index + 1, publicQuizQuestions.length - 1),
                )
                setError(null)
              }}
              type="button"
              variant="secondary"
            >
              다음 문항
            </Button>
          </div>

          {error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button disabled={isSubmitted} type="submit">
            {isSubmitted ? '제출 완료' : '제출'}
          </Button>
        </form>
      </section>

      {isSubmitted ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">결과</h2>
              <p className="mt-1 text-sm">점수 {publicQuizResult.score}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {shouldShowDiagnosisEntry(publicQuizResult) && diagnosisEntry ? (
                <ButtonLink
                  to={diagnosisPath(diagnosisEntry.sessionId, diagnosisEntry.diagnosisId)}
                  variant="secondary"
                >
                  진단으로 이어가기
                </ButtonLink>
              ) : null}
              <ButtonLink to={routes.sessions} variant="secondary">
                세션으로 돌아가기
              </ButtonLink>
            </div>
          </div>

          <ul className="mt-4 grid gap-2">
            {publicQuizResult.feedback.map((feedback) => (
              <li
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                key={feedback.questionId}
              >
                {feedback.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
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
      <fieldset className="space-y-3">
        <legend className="text-lg font-bold text-zinc-950">{question.prompt}</legend>
        <div className="grid gap-2">
          {question.choices?.map((choice) => (
            <label
              className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800"
              key={choice.id}
            >
              <input
                checked={value === choice.id}
                disabled={disabled}
                name={question.id}
                onChange={() => onChange(choice.id)}
                type="radio"
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
        <span className="text-lg font-bold text-zinc-950">{question.prompt}</span>
        <input
          className="mt-3 min-h-10 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          value={value}
        />
      </label>
    )
  }

  return (
    <label className="block">
      <span className="text-lg font-bold text-zinc-950">{question.prompt}</span>
      <textarea
        className="mt-3 min-h-32 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}
