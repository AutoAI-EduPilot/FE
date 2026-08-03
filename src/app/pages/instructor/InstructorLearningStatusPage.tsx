import { BarChart3, FileQuestion, FileSearch, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../../features/auth'
import { createClassroomsRepository, rememberClassroomId, type Classroom } from '../../../features/classrooms'
import { getRequestErrorMessage } from '../../../shared/api'
import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { ButtonLink, PageContainer, PageHeader } from '../../../shared/ui'
import { classroomAnalyticsPath, classroomReportsPath } from '../../routes'

export function InstructorLearningStatusPage() {
  usePageTitle('학습 현황')
  const { apiRequest } = useAuth()
  const { classroomId = '' } = useParams()
  const navigate = useNavigate()
  const repository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const selectedClassroom = classrooms.find((item) => item.id === classroomId) ?? classrooms[0]
  const summaryItems = [
    { label: '학습자', suffix: '명', value: selectedClassroom?.learnerCount ?? 0 },
    { label: '평균 진도', suffix: '%', value: selectedClassroom?.progressRate ?? 0 },
    { label: 'AI 질문 수 (7일)', suffix: '건', value: 0 },
    { label: '7일 이상 미접속', suffix: '명', value: 0 },
  ]

  useEffect(() => {
    const controller = new AbortController()
    void repository.list('', controller.signal)
      .then(setClassrooms)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getRequestErrorMessage(requestError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [repository])

  useEffect(() => {
    if (selectedClassroom) rememberClassroomId(selectedClassroom.id)
  }, [selectedClassroom])

  return (
    <PageContainer>
      <PageHeader
        actions={<><p className="type-caption font-medium text-stone-400">마지막 갱신 정보 없음</p>{selectedClassroom ? <ButtonLink to={classroomReportsPath(selectedClassroom.id)} variant="secondary"><FileSearch size={14} />학생 리포트</ButtonLink> : null}</>}
        title="학습 현황"
        titleAccessory={
          <label>
            <span className="sr-only">강의실 선택</span>
            <select
              className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 type-caption font-semibold text-stone-500"
              disabled={classrooms.length === 0}
              onChange={(event) => navigate(classroomAnalyticsPath(event.target.value), { replace: true })}
              value={selectedClassroom?.id ?? ''}
            >
              {classrooms.length === 0 ? (
                <option value="">{isLoading ? '불러오는 중' : '강의실 없음'}</option>
              ) : classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
              ))}
            </select>
          </label>
        }
      />

      {error ? <p className="type-body text-rose-700" role="alert">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <article
            className="min-h-28 rounded-lg border border-stone-200 bg-white px-5 py-4"
            key={item.label}
          >
            <p className="type-caption font-medium text-stone-400">{item.label}</p>
            <p className="mt-2 type-display font-bold text-stone-950">
              {item.value}
              <span className="ml-0.5 type-section-title">{item.suffix}</span>
            </p>
          </article>
        ))}
      </section>

      <section className="grid min-h-[520px] gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <EmptyAnalyticsPanel
          description={selectedClassroom ? `${selectedClassroom.name}의 자료별 열람 인원이 표시됩니다.` : '강의실을 선택하면 자료별 열람 인원이 표시됩니다.'}
          icon={BarChart3}
          title="자료별 열람 현황"
        />
        <EmptyAnalyticsPanel
          description="학습자가 질문한 횟수를 관련 자료 페이지별로 집계해 표시합니다."
          icon={FileQuestion}
          title="페이지별 AI 질문 수"
        />
      </section>
    </PageContainer>
  )
}

function EmptyAnalyticsPanel({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: typeof Users
  title: string
}) {
  return (
    <article className="flex min-h-72 flex-col rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="type-body font-bold text-stone-900">{title}</h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
          <Icon aria-hidden="true" size={19} />
        </span>
        <p className="mt-3 type-body font-semibold text-stone-800">
          표시할 학습 데이터가 없습니다
        </p>
        <p className="mt-1 type-caption leading-5 text-stone-400">{description}</p>
      </div>
    </article>
  )
}
