import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import {
  mockDiagnosisRepository,
  validateDiagnosisAnswer,
  type CorrectionMessage,
} from '../../features/diagnosis'
import { Badge, Button, ButtonLink, PageHeader } from '../../shared/ui'
import { sessionDetailPath } from '../routes'

export function DiagnosisPage() {
  const { diagnosisId, sessionId } = useParams()
  const pendingDiagnosis = mockDiagnosisRepository.restorePending(diagnosisId, sessionId)
  const [answer, setAnswer] = useState('')
  const [correction, setCorrection] = useState<CorrectionMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateDiagnosisAnswer(answer)
    setError(validationError)

    if (validationError) {
      return
    }

    const nextCorrection = await mockDiagnosisRepository.submitAnswer(pendingDiagnosis, answer)
    setCorrection(nextCorrection)
    setIsSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnosis"
        title="진단·교정"
        description={`진단 ${pendingDiagnosis.diagnosisId} 답변을 작성합니다.`}
        actions={<Badge tone="warning">BE#40 연동 예정</Badge>}
      />

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">진단 복원</h2>
            <p className="mt-2 text-sm leading-6">
              저득점 결과 {pendingDiagnosis.quizScore}점에서 이어진 진단입니다.
            </p>
            <p className="mt-2 text-sm font-semibold">{pendingDiagnosis.sourceQuestion}</p>
          </div>
          <Badge tone="warning">복원됨</Badge>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-lg font-bold text-zinc-950">{pendingDiagnosis.prompt}</span>
            <textarea
              className="mt-3 min-h-36 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
              disabled={isSubmitted}
              onChange={(event) => {
                setAnswer(event.target.value)
                setError(null)
              }}
              value={answer}
            />
          </label>

          {error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button disabled={isSubmitted} type="submit">
            {isSubmitted ? '제출 완료' : '진단 제출'}
          </Button>
        </form>
      </section>

      {isSubmitted && correction ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <h2 className="text-lg font-bold">{correction.title}</h2>
          <p className="mt-2 text-sm leading-6">{correction.summary}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {correction.focusAreas.map((focusArea) => (
              <li
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold"
                key={focusArea}
              >
                {focusArea}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
            {correction.nextQuestionPrompt}
          </p>
          <ButtonLink
            className="mt-4"
            to={sessionDetailPath(pendingDiagnosis.sessionId)}
            variant="secondary"
          >
            일반 질문으로 이어가기
          </ButtonLink>
        </section>
      ) : null}
    </div>
  )
}
