import {
  Archive,
  Copy,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundX,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../../features/auth'
import {
  createClassroomsRepository,
  type Classroom,
  type ClassroomWeek,
  type JoinRequest,
} from '../../../features/classrooms'
import { getRequestErrorMessage } from '../../../shared/api'
import { usePageTitle } from '../../../shared/lib/usePageTitle'
import {
  Button,
  EmptyState,
  PageContainer,
  PageHeader,
  useToast,
} from '../../../shared/ui'
import { routes } from '../../routes'

export function InstructorClassroomEditPage() {
  usePageTitle('강의실 수정')
  const { classroomId = '' } = useParams()
  const { apiRequest } = useAuth()
  const { show: showToast } = useToast()
  const navigate = useNavigate()
  const repository = useMemo(
    () => createClassroomsRepository(apiRequest),
    [apiRequest],
  )
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [weeks, setWeeks] = useState<ClassroomWeek[]>([])
  const [learners, setLearners] = useState<JoinRequest[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weekCount, setWeekCount] = useState(1)
  const [learnerQuery, setLearnerQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      repository.get(classroomId),
      repository.listWeeks(classroomId),
      repository.listJoinRequests(classroomId, 'APPROVED'),
      repository.getInviteCode(classroomId),
    ])
      .then(([nextClassroom, nextWeeks, nextLearners, nextInviteCode]) => {
        if (cancelled) return
        setClassroom(nextClassroom)
        setWeeks(nextWeeks)
        setLearners(nextLearners)
        setInviteCode(nextInviteCode)
        setName(nextClassroom.name)
        setDescription(nextClassroom.description ?? '')
        setWeekCount(Math.max(nextClassroom.weekCount, nextWeeks.length, 1))
      })
      .catch((requestError) => {
        if (!cancelled) setError(getRequestErrorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [classroomId, repository])

  const filteredLearners = useMemo(() => {
    const query = learnerQuery.trim().toLocaleLowerCase('ko-KR')
    if (!query) return learners
    return learners.filter((request) => {
      const learner = request.learner
      return [learner?.name, learner?.email, learner?.affiliation]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('ko-KR').includes(query))
    })
  }, [learnerQuery, learners])

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했습니다.', 'success')
    } catch {
      showToast('초대 코드를 복사하지 못했습니다.', 'danger')
    }
  }

  async function regenerateInviteCode() {
    if (
      !window.confirm(
        '기존 초대 코드는 더 이상 사용할 수 없습니다. 재발급할까요?',
      )
    ) {
      return
    }
    try {
      const nextInviteCode = await repository.regenerateInviteCode(classroomId)
      setInviteCode(nextInviteCode)
      showToast('새 초대 코드를 발급했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classroom || !name.trim() || isSaving) return

    const removedWeeks = weeks.filter((week) => week.weekNumber > weekCount)
    if (removedWeeks.some((week) => week.materials.length > 0)) {
      showToast(
        '자료가 등록된 주차는 삭제할 수 없습니다. 자료를 먼저 정리해 주세요.',
        'danger',
      )
      return
    }

    setIsSaving(true)
    try {
      if (weekCount > weeks.length) {
        for (let index = weeks.length; index < weekCount; index += 1) {
          await repository.createWeek(classroomId, {
            releaseAt: toReleaseAt(classroom.startDate, index),
            title: `${index + 1}주차`,
            weekNumber: index + 1,
          })
        }
      } else if (weekCount < weeks.length) {
        for (const week of [...removedWeeks].sort(
          (a, b) => b.weekNumber - a.weekNumber,
        )) {
          await repository.deleteWeek(classroomId, week.weekNumber)
        }
      }

      await repository.update(classroomId, {
        color: classroom.color,
        description: description.trim(),
        endDate: getEndDate(classroom.startDate, weekCount),
        name: name.trim(),
      })
      showToast('강의실 정보를 저장했습니다.', 'success')
      navigate(routes.classrooms)
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  async function completeClassroom() {
    if (
      !classroom ||
      !window.confirm(
        '강의실 운영을 종료할까요? 학습자는 더 이상 새 학습을 시작할 수 없습니다.',
      )
    ) {
      return
    }
    try {
      await repository.complete(classroom.id)
      showToast('강의실 운영을 종료했습니다.', 'success')
      navigate(routes.classrooms)
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="강의실 수정" />
        <p className="py-16 text-center text-sm text-stone-500" role="status">
          강의실 정보를 불러오는 중입니다.
        </p>
      </PageContainer>
    )
  }

  if (error || !classroom) {
    return (
      <PageContainer>
        <PageHeader title="강의실 수정" />
        <EmptyState
          action={
            <Button onClick={() => navigate(routes.classrooms)} variant="secondary">
              내 강의실로 이동
            </Button>
          }
          description={error ?? '강의실 정보를 확인할 수 없습니다.'}
          title="강의실을 불러오지 못했습니다"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        actions={
          <>
            <Button onClick={() => navigate(routes.classrooms)} variant="ghost">
              취소
            </Button>
            <Button disabled={!name.trim() || isSaving} form="classroom-edit-form" type="submit">
              {isSaving ? '저장 중' : '저장'}
            </Button>
          </>
        }
        title="강의실 수정"
      />

      <form
        className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        id="classroom-edit-form"
        onSubmit={save}
      >
        <div className="space-y-5">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-bold text-stone-950">기본 정보</h2>
            <label className="mt-5 block text-sm font-semibold text-stone-700">
              강의실 이름
              <input
                className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>
            <label className="mt-4 flex min-h-44 flex-col text-sm font-semibold text-stone-700">
              설명 <span className="sr-only">선택 입력</span>
              <textarea
                className="mt-1 min-h-36 flex-1 resize-none rounded-lg border border-stone-300 p-3.5 text-sm font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="학습자에게 보이는 강의실 소개"
                value={description}
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="text-sm font-semibold text-stone-700">
                수업 시작일
                <input
                  className="mt-1 h-11 w-full rounded-lg border border-stone-200 bg-stone-100 px-3 text-sm text-stone-500"
                  disabled
                  title="현재 API에서는 시작일을 변경할 수 없습니다."
                  type="date"
                  value={classroom.startDate}
                />
              </label>
              <div>
                <span className="text-sm font-semibold text-stone-700">주차 수</span>
                <div className="mt-1 flex h-11 items-center rounded-lg border border-stone-300 bg-white p-1">
                  <button
                    aria-label="주차 수 줄이기"
                    className="flex size-8 items-center justify-center rounded-md text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
                    disabled={weekCount <= 1}
                    onClick={() => setWeekCount((value) => Math.max(1, value - 1))}
                    type="button"
                  >
                    <Minus size={14} />
                  </button>
                  <output className="min-w-12 text-center text-sm font-bold">{weekCount}주</output>
                  <button
                    aria-label="주차 수 늘리기"
                    className="flex size-8 items-center justify-center rounded-md text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
                    disabled={weekCount >= 52}
                    onClick={() => setWeekCount((value) => Math.min(52, value + 1))}
                    type="button"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              시작일은 개설 후 변경할 수 없습니다. 종료일은 {getEndDate(classroom.startDate, weekCount)}로 계산됩니다.
            </p>
            <div className="mt-5 border-t border-stone-100 pt-5">
              <p className="text-sm font-semibold text-stone-700">강의실 코드</p>
              <div className="mt-1 flex min-h-11 items-center gap-3 rounded-lg bg-stone-50 px-3.5">
                <strong className="min-w-0 flex-1 truncate font-mono text-sm tracking-wider text-stone-900">
                  {inviteCode}
                </strong>
                <button
                  aria-label="초대 코드 복사"
                  className="flex size-8 items-center justify-center rounded-md text-brand-700 hover:bg-white"
                  onClick={() => void copyInviteCode()}
                  title="초대 코드 복사"
                  type="button"
                >
                  <Copy size={14} />
                </button>
                <button
                  aria-label="초대 코드 재발급"
                  className="flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-white"
                  onClick={() => void regenerateInviteCode()}
                  title="초대 코드 재발급"
                  type="button"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-rose-200 bg-white">
            <div className="border-b border-rose-100 px-5 py-4">
              <h2 className="text-sm font-bold text-rose-700">위험 영역</h2>
            </div>
            <DangerRow
              actionLabel="운영 종료"
              description="자료와 학습 기록은 보존되지만 새 학습은 중단됩니다."
              icon={Archive}
              onClick={() => void completeClassroom()}
              title="강의실 운영 종료"
            />
            <DangerRow
              actionLabel="삭제"
              description="영구 삭제 API가 제공되기 전에는 실행할 수 없습니다."
              disabled
              icon={Trash2}
              title="강의실 영구 삭제"
            />
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 px-5 py-4">
            <h2 className="text-sm font-bold text-stone-950">
              학습자 {classroom.learnerCount}명
            </h2>
            <label className="relative ml-auto min-w-52 flex-1 sm:max-w-72">
              <span className="sr-only">학습자 검색</span>
              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
                size={14}
              />
              <input
                className="h-9 w-full rounded-lg border border-stone-200 pl-9 pr-3 text-xs focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                onChange={(event) => setLearnerQuery(event.target.value)}
                placeholder="이름, 이메일, 소속 검색"
                value={learnerQuery}
              />
            </label>
          </div>
          <div className="hidden grid-cols-[0.8fr_1.3fr_1fr_1fr_68px] border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold text-stone-400 lg:grid">
            <span>이름</span>
            <span>이메일</span>
            <span>소속</span>
            <span>요청 시각</span>
            <span className="text-right">관리</span>
          </div>
          {filteredLearners.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <UserRoundX aria-hidden="true" className="text-stone-300" size={22} />
              <h3 className="mt-4 text-sm font-bold text-stone-900">
                {learnerQuery.trim()
                  ? '일치하는 학습자가 없습니다'
                  : '승인된 학습자가 없습니다'}
              </h3>
            </div>
          ) : (
            filteredLearners.map((request) => (
              <div
                className="grid gap-2 border-b border-stone-100 px-4 py-3 text-sm last:border-0 lg:grid-cols-[0.8fr_1.3fr_1fr_1fr_68px] lg:items-center"
                key={request.requestId}
              >
                <strong className="truncate text-stone-900">{request.learner?.name ?? '-'}</strong>
                <span className="truncate text-stone-500">{request.learner?.email ?? '-'}</span>
                <span className="truncate text-stone-500">{request.learner?.affiliation ?? '-'}</span>
                <span className="text-xs text-stone-400">
                  {new Date(request.requestedAt).toLocaleString('ko-KR')}
                </span>
                <button
                  className="justify-self-end text-xs font-semibold text-stone-300"
                  disabled
                  title="백엔드 수강생 제외 API가 필요합니다."
                  type="button"
                >
                  제외
                </button>
              </div>
            ))
          )}
          <div className="border-t border-stone-100 px-5 py-3 text-right text-xs text-stone-400">
            승인 이력을 기준으로 {learners.length}명을 표시합니다.
          </div>
        </section>
      </form>
    </PageContainer>
  )
}

function DangerRow({
  actionLabel,
  description,
  disabled = false,
  icon: Icon,
  onClick,
  title,
}: {
  actionLabel: string
  description: string
  disabled?: boolean
  icon: typeof Archive
  onClick?: () => void
  title: string
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 border-b border-rose-100 px-5 py-3 last:border-0">
      <Icon aria-hidden="true" className="shrink-0 text-rose-500" size={16} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        <p className="mt-0.5 text-xs text-stone-400">{description}</p>
      </div>
      <button
        className="h-8 shrink-0 rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {actionLabel}
      </button>
    </div>
  )
}

function getEndDate(startDate: string, weekCount: number): string {
  const date = new Date(`${startDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + weekCount * 7 - 1)
  return date.toISOString().slice(0, 10)
}

function toReleaseAt(startDate: string, weekIndex: number): string {
  const date = new Date(`${startDate}T00:00:00`)
  date.setDate(date.getDate() + weekIndex * 7)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}
