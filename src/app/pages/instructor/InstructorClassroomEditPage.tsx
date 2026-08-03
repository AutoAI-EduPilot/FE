import {
  Archive,
  GripVertical,
  MoreHorizontal,
  Minus,
  Plus,
  Search,
  Trash2,
  UserRoundX,
} from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
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

type WeekDisplayStatus = 'PUBLISHED' | 'PRIVATE' | 'BREAK'

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
  const [weekTitles, setWeekTitles] = useState<Record<number, string>>({})
  const [learners, setLearners] = useState<JoinRequest[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weekCount, setWeekCount] = useState(1)
  const [weekOrder, setWeekOrder] = useState<number[]>([])
  const [weekStatuses, setWeekStatuses] = useState<Record<number, WeekDisplayStatus>>({})
  const [draggedWeek, setDraggedWeek] = useState<number | null>(null)
  const [openWeekMenu, setOpenWeekMenu] = useState<number | null>(null)
  const [hasLocalOnlyWeekChanges, setHasLocalOnlyWeekChanges] = useState(false)
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
        setWeekTitles(
          Object.fromEntries(
            nextWeeks.map((week) => [week.weekNumber, week.title]),
          ),
        )
        const nextWeekCount = Math.max(nextClassroom.weekCount, nextWeeks.length, 1)
        setWeekOrder(Array.from({ length: nextWeekCount }, (_, index) => index + 1))
        setWeekStatuses(Object.fromEntries(nextWeeks.map((week) => [
          week.weekNumber,
          week.status === 'PUBLISHED' ? 'PUBLISHED' : 'PRIVATE',
        ])))
        setLearners(nextLearners)
        setInviteCode(nextInviteCode)
        setName(nextClassroom.name)
        setDescription(nextClassroom.description ?? '')
        setWeekCount(nextWeekCount)
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

  const weekByNumber = useMemo(
    () => new Map(weeks.map((week) => [week.weekNumber, week])),
    [weeks],
  )
  const lastVisibleWeekNumber = weekOrder.at(-1) ?? weekCount
  const lastVisibleWeek = weekByNumber.get(lastVisibleWeekNumber)
  const canRemoveWeek =
    weekCount > 1 && (!lastVisibleWeek || lastVisibleWeek.materials.length === 0)

  function addWeek() {
    if (weekCount >= 52) return
    const nextWeekNumber = Math.max(0, ...weekOrder) + 1
    setWeekCount((value) => value + 1)
    setWeekOrder((current) => [...current, nextWeekNumber])
    setWeekStatuses((current) => ({ ...current, [nextWeekNumber]: 'PRIVATE' }))
  }

  function removeLastWeek() {
    if (!canRemoveWeek) return
    const removedWeekNumber = weekOrder.at(-1)
    setWeekCount((value) => Math.max(1, value - 1))
    setWeekOrder((current) => current.slice(0, -1))
    if (removedWeekNumber !== undefined) {
      setWeekTitles((current) => omitNumericKey(current, removedWeekNumber))
      setWeekStatuses((current) => omitNumericKey(current, removedWeekNumber))
    }
  }

  function moveWeekTo(sourceWeekNumber: number, targetWeekNumber: number) {
    if (sourceWeekNumber === targetWeekNumber) return
    setWeekOrder((current) => {
      const sourceIndex = current.indexOf(sourceWeekNumber)
      const targetIndex = current.indexOf(targetWeekNumber)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      const [movedWeek] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, movedWeek)
      return next
    })
    setHasLocalOnlyWeekChanges(true)
  }

  function startWeekDrag(event: DragEvent<HTMLButtonElement>, weekNumber: number) {
    setDraggedWeek(weekNumber)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(weekNumber))
  }

  function enterWeekDropTarget(event: DragEvent<HTMLDivElement>, weekNumber: number) {
    if (draggedWeek === null || draggedWeek === weekNumber) return
    event.preventDefault()
    moveWeekTo(draggedWeek, weekNumber)
  }

  async function changeWeekStatus(weekNumber: number, status: WeekDisplayStatus) {
    setOpenWeekMenu(null)
    if (status !== 'PUBLISHED') {
      setWeekStatuses((current) => ({ ...current, [weekNumber]: status }))
      setHasLocalOnlyWeekChanges(true)
      showToast('비공개·휴강 상태 저장은 백엔드 API가 준비되면 반영됩니다.')
      return
    }

    const week = weekByNumber.get(weekNumber)
    if (!week) {
      setWeekStatuses((current) => ({ ...current, [weekNumber]: status }))
      return
    }

    try {
      const updated = await repository.updateWeek(classroomId, weekNumber, {
        releaseAt: new Date().toISOString(),
      })
      setWeeks((current) => current.map((item) => item.weekNumber === weekNumber ? updated : item))
      setWeekStatuses((current) => ({ ...current, [weekNumber]: 'PUBLISHED' }))
      showToast(`${weekNumber}주차를 공개했습니다.`, 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function deleteWeek(weekNumber: number) {
    setOpenWeekMenu(null)
    const week = weekByNumber.get(weekNumber)
    if (week?.materials.length) {
      showToast('자료가 등록된 주차는 삭제할 수 없습니다.', 'danger')
      return
    }
    if (!window.confirm(`${weekNumber}주차를 삭제할까요?`)) return

    if (!week) {
      setWeekOrder((current) => current.filter((item) => item !== weekNumber))
      setWeekCount((value) => Math.max(1, value - 1))
      return
    }

    try {
      await repository.deleteWeek(classroomId, weekNumber)
      const nextWeeks = await repository.listWeeks(classroomId)
      const nextWeekCount = Math.max(nextWeeks.length, 1)
      setWeeks(nextWeeks)
      setWeekCount(nextWeekCount)
      setWeekOrder(Array.from({ length: nextWeekCount }, (_, index) => index + 1))
      setWeekTitles(Object.fromEntries(nextWeeks.map((item) => [item.weekNumber, item.title])))
      setWeekStatuses(Object.fromEntries(nextWeeks.map((item) => [
        item.weekNumber,
        item.status === 'PUBLISHED' ? 'PUBLISHED' : 'PRIVATE',
      ])))
      showToast('주차를 삭제했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      showToast('초대 코드를 복사했습니다.', 'success')
    } catch {
      showToast('초대 코드를 복사하지 못했습니다.', 'danger')
    }
  }

  async function regenerateInviteCode() {
    if (!window.confirm('기존 초대 코드는 더 이상 사용할 수 없습니다. 재발급할까요?')) return
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
      showToast('자료가 등록된 주차는 삭제할 수 없습니다. 자료를 먼저 정리해 주세요.', 'danger')
      return
    }

    setIsSaving(true)
    try {
      for (let weekNumber = 1; weekNumber <= weekCount; weekNumber += 1) {
        const existingWeek = weekByNumber.get(weekNumber)
        const nextTitle = weekTitles[weekNumber]?.trim() || `${weekNumber}주차`
        if (!existingWeek) {
          await repository.createWeek(classroomId, {
            releaseAt: toReleaseAt(classroom.startDate, weekNumber - 1),
            title: nextTitle,
            weekNumber,
          })
        } else if (existingWeek.title !== nextTitle) {
          await repository.updateWeek(classroomId, weekNumber, { title: nextTitle })
        }
      }

      for (const week of [...removedWeeks].sort((a, b) => b.weekNumber - a.weekNumber)) {
        await repository.deleteWeek(classroomId, week.weekNumber)
      }

      await repository.update(classroomId, {
        color: classroom.color,
        description: description.trim(),
        endDate: getEndDate(classroom.startDate, weekCount),
        name: name.trim(),
      })
      showToast(
        hasLocalOnlyWeekChanges
          ? '기본 정보는 저장했습니다. 주차 순서·비공개·휴강은 백엔드 API가 필요합니다.'
          : '강의실 정보를 저장했습니다.',
        hasLocalOnlyWeekChanges ? 'info' : 'success',
      )
      navigate(routes.classrooms)
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  async function completeClassroom() {
    if (!classroom || !window.confirm('강의실 운영을 종료할까요? 종료 후에는 새 자료 업로드와 학습자 추가가 불가능하며, 기존 자료와 학습 기록만 확인할 수 있습니다.')) return
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
        <p className="py-16 text-center type-body text-stone-500" role="status">
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
          action={<Button onClick={() => navigate(routes.classrooms)} variant="secondary">내 강의실로 이동</Button>}
          description={error ?? '강의실 정보를 확인할 수 없습니다.'}
          title="강의실을 불러오지 못했습니다"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="xl:flex xl:h-[calc(100dvh-4.5rem)] xl:min-h-0 xl:flex-col xl:gap-5 xl:overflow-hidden xl:space-y-0">
      <PageHeader
        actions={
          <>
            <Button onClick={() => navigate(routes.classrooms)} variant="secondary">취소</Button>
            <Button disabled={!name.trim() || isSaving} form="classroom-edit-form" type="submit">
              {isSaving ? '저장 중' : '저장'}
            </Button>
          </>
        }
        title="강의실 수정"
      />

      <form
        className="flex flex-col gap-3 xl:min-h-0 xl:flex-1 xl:overflow-hidden"
        id="classroom-edit-form"
        onSubmit={save}
      >
        <div className="grid items-stretch gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(300px,0.95fr)_minmax(280px,0.78fr)_minmax(380px,1.2fr)]">
          <BasicInformationSection
            classroom={classroom}
            description={description}
            inviteCode={inviteCode}
            name={name}
            onCopyInviteCode={() => void copyInviteCode()}
            onDescriptionChange={setDescription}
            onNameChange={setName}
            onRegenerateInviteCode={() => void regenerateInviteCode()}
            weekCount={weekCount}
          />

          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="flex min-h-12 items-center border-b border-stone-200 bg-stone-50 px-4">
            <h2 className="type-body font-bold text-stone-950">주차 구성</h2>
            <div className="ml-auto flex h-8 items-center rounded-lg border border-stone-200 bg-white p-0.5">
              <button
                aria-label="주차 수 줄이기"
                className="flex size-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:text-stone-300"
                disabled={!canRemoveWeek}
                onClick={removeLastWeek}
                title={lastVisibleWeek?.materials.length ? '자료가 있는 마지막 주차는 삭제할 수 없습니다.' : undefined}
                type="button"
              >
                <Minus size={13} />
              </button>
              <output className="min-w-12 text-center type-caption font-bold">{weekCount}주</output>
              <button
                aria-label="주차 수 늘리기"
                className="flex size-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:text-stone-300"
                disabled={weekCount >= 52}
                onClick={addWeek}
                type="button"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <p className="border-b border-stone-100 px-4 py-2.5 type-micro leading-5 text-stone-500">
            6점 핸들을 끌어 순서를 바꿀 수 있습니다. 주차 이름 변경은 저장 시 반영됩니다.
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {weekOrder.map((weekNumber, index) => {
              const displayWeekNumber = index + 1
              const week = weekByNumber.get(weekNumber)
              return (
                <div
                  aria-label={`${displayWeekNumber}주차 항목`}
                  className={`grid min-h-11 grid-cols-[22px_42px_minmax(0,1fr)_auto] items-center gap-1.5 border-b border-stone-100 px-2.5 transition-colors last:border-0 ${draggedWeek === weekNumber ? 'bg-brand-50/70 opacity-60' : 'bg-white'}`}
                  key={weekNumber}
                  onDragEnter={(event) => enterWeekDropTarget(event, weekNumber)}
                  onDragOver={(event) => { if (draggedWeek !== null) event.preventDefault() }}
                >
                  <div>
                    <button
                      aria-label={`${displayWeekNumber}주차 순서 이동`}
                      className="flex size-6 cursor-grab items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
                      draggable
                      onDragEnd={() => setDraggedWeek(null)}
                      onDragStart={(event) => startWeekDrag(event, weekNumber)}
                      title="잡아서 원하는 주차 위치로 이동"
                      type="button"
                    >
                      <GripVertical aria-hidden="true" size={14} />
                    </button>
                  </div>
                  <span className="type-caption text-stone-500">{displayWeekNumber}주차</span>
                  <input
                    aria-label={`${displayWeekNumber}주차 이름`}
                    className="h-8 min-w-0 rounded-md border border-transparent px-2 type-caption font-semibold text-stone-800 hover:border-stone-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    onChange={(event) => setWeekTitles((current) => ({
                      ...current,
                      [weekNumber]: event.target.value,
                    }))}
                    placeholder="주차 이름 (선택)"
                    value={weekTitles[weekNumber] ?? week?.title ?? ''}
                  />
                  <WeekStatusMenu
                    displayWeekNumber={displayWeekNumber}
                    isOpen={openWeekMenu === weekNumber}
                    onDelete={() => void deleteWeek(weekNumber)}
                    onOpenChange={() => setOpenWeekMenu((current) => current === weekNumber ? null : weekNumber)}
                    onStatusChange={(status) => void changeWeekStatus(weekNumber, status)}
                    status={weekStatuses[weekNumber] ?? getWeekDisplayStatus(week)}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex min-h-10 items-center justify-center gap-2 border-t border-stone-100 bg-stone-50 type-micro text-stone-500">
            <span>전체 {weekCount}주</span>
            <button
              className="font-semibold text-brand-700 disabled:text-stone-300"
              disabled={weekCount >= 52}
              onClick={addWeek}
              type="button"
            >
              + 주차 추가
            </button>
          </div>
          </section>

          <LearnerSection
            classroom={classroom}
            learners={learners}
            onQueryChange={setLearnerQuery}
            query={learnerQuery}
            visibleLearners={filteredLearners}
          />
        </div>

        <section className="mt-auto flex min-h-14 flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50/30 px-4 py-2.5 xl:shrink-0">
          <h2 className="type-caption font-bold text-rose-700">위험 구역</h2>
          <p className="min-w-0 flex-1 type-micro leading-5 text-stone-500">
            운영을 종료하면 자료 업로드와 학습자 추가가 중단되며 기존 자료와 학습 기록만 확인할 수 있습니다. 영구 삭제는 백엔드 API 제공 전까지 사용할 수 없습니다.
          </p>
          <Button onClick={() => void completeClassroom()} size="sm" variant="secondary">
            <Archive aria-hidden="true" size={13} />강의실 종료
          </Button>
          <Button className="border-rose-700 bg-rose-700 text-white hover:bg-rose-800" disabled size="sm" variant="secondary">
            <Trash2 aria-hidden="true" size={13} />강의실 삭제
          </Button>
        </section>
      </form>
    </PageContainer>
  )
}

function BasicInformationSection({
  classroom,
  description,
  inviteCode,
  name,
  onCopyInviteCode,
  onDescriptionChange,
  onNameChange,
  onRegenerateInviteCode,
  weekCount,
}: {
  classroom: Classroom
  description: string
  inviteCode: string
  name: string
  onCopyInviteCode: () => void
  onDescriptionChange: (value: string) => void
  onNameChange: (value: string) => void
  onRegenerateInviteCode: () => void
  weekCount: number
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white xl:h-full xl:min-h-0">
      <div className="flex min-h-12 items-center border-b border-stone-200 bg-stone-50 px-4">
        <h2 className="type-body font-bold text-stone-950">기본 정보</h2>
      </div>
      <div className="space-y-4 p-4">
        <label className="block type-caption font-semibold text-stone-700">
          강의실 이름
          <input
            className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 type-body focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onChange={(event) => onNameChange(event.target.value)}
            value={name}
          />
        </label>
        <label className="block type-caption font-semibold text-stone-700">
          설명
          <textarea
            className="mt-1 min-h-28 w-full resize-none rounded-lg border border-stone-300 p-3 type-caption font-normal leading-5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="학습자에게 보이는 강의실 소개"
            value={description}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="type-caption font-semibold text-stone-700">
            수업 시작일
            <input
              className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-stone-100 px-2 type-caption text-stone-500"
              disabled
              title="현재 API에서는 시작일을 변경할 수 없습니다."
              type="date"
              value={classroom.startDate}
            />
          </label>
          <div className="type-caption font-semibold text-stone-700">
            수업 종료일
            <output className="mt-1 flex h-10 items-center rounded-lg border border-stone-200 bg-stone-100 px-2 type-caption font-normal text-stone-500">
              {getEndDate(classroom.startDate, weekCount)}
            </output>
          </div>
        </div>
        <p className="type-micro leading-5 text-stone-400">시작일은 개설 후 변경할 수 없으며 종료일은 주차 수에 따라 계산됩니다.</p>
        <div>
          <p className="type-caption font-semibold text-stone-700">강의실 코드</p>
          <div className="mt-1 flex min-h-11 items-center gap-2 rounded-lg bg-stone-50 px-3">
            <strong className="min-w-0 flex-1 truncate font-mono type-body tracking-wider text-stone-900">{inviteCode}</strong>
            <button className="h-8 rounded-md border border-stone-200 bg-white px-2.5 type-micro font-semibold text-brand-700" onClick={onCopyInviteCode} type="button">복사</button>
            <button className="h-8 rounded-md border border-stone-200 bg-white px-2.5 type-micro font-semibold text-stone-600" onClick={onRegenerateInviteCode} type="button">재발급</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function WeekStatusMenu({
  displayWeekNumber,
  isOpen,
  onDelete,
  onOpenChange,
  onStatusChange,
  status,
}: {
  displayWeekNumber: number
  isOpen: boolean
  onDelete: () => void
  onOpenChange: () => void
  onStatusChange: (status: WeekDisplayStatus) => void
  status: WeekDisplayStatus
}) {
  const statusLabel = status === 'PUBLISHED' ? '공개 중' : status === 'BREAK' ? '휴강' : '비공개'
  const statusClassName = status === 'PUBLISHED'
    ? 'bg-brand-50 text-brand-700'
    : status === 'BREAK'
      ? 'bg-rose-50 text-rose-700'
      : 'bg-stone-100 text-stone-500'

  return (
    <div className="relative flex items-center gap-1">
      <span className={`rounded-full px-2 py-1 type-micro font-semibold ${statusClassName}`}>{statusLabel}</span>
      <button
        aria-expanded={isOpen}
        aria-label={`${displayWeekNumber}주차 상태 메뉴`}
        className="flex size-7 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        onClick={onOpenChange}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={15} />
      </button>
      {isOpen ? (
        <div className="absolute top-8 right-0 z-20 w-36 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
          <button className="block h-8 w-full rounded px-2 text-left type-caption text-stone-700 hover:bg-stone-50" onClick={() => onStatusChange('PUBLISHED')} type="button">공개</button>
          <button className="block h-8 w-full rounded px-2 text-left type-caption text-stone-700 hover:bg-stone-50" onClick={() => onStatusChange('PRIVATE')} type="button">비공개</button>
          <button className="block h-8 w-full rounded px-2 text-left type-caption text-stone-700 hover:bg-stone-50" onClick={() => onStatusChange('BREAK')} type="button">휴강</button>
          <div className="my-1 border-t border-stone-100" />
          <button className="block h-8 w-full rounded px-2 text-left type-caption font-semibold text-rose-700 hover:bg-rose-50" onClick={onDelete} type="button">삭제</button>
        </div>
      ) : null}
    </div>
  )
}

function LearnerSection({
  classroom,
  learners,
  onQueryChange,
  query,
  visibleLearners,
}: {
  classroom: Classroom
  learners: JoinRequest[]
  onQueryChange: (value: string) => void
  query: string
  visibleLearners: JoinRequest[]
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white xl:h-full xl:min-h-0">
      <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-stone-200 bg-stone-50 px-4">
        <h2 className="type-body font-bold text-stone-950">학습자 <span className="ml-1 font-normal text-stone-400">{classroom.learnerCount}명</span></h2>
        <label className="relative ml-auto min-w-48 flex-1 sm:max-w-64">
          <span className="sr-only">학습자 검색</span>
          <Search aria-hidden="true" className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" size={13} />
          <input
            className="h-8 w-full rounded-lg border border-stone-200 pl-8 pr-3 type-micro focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="이름, 이메일, 소속 검색"
            value={query}
          />
        </label>
      </div>
      <div className="hidden grid-cols-[1fr_1.25fr_1fr_1fr_54px] border-b border-stone-100 bg-stone-50 px-4 py-2.5 type-micro font-semibold text-stone-400 lg:grid">
        <span>이름</span><span>이메일</span><span>소속</span><span>입장 시각</span><span className="text-right">관리</span>
      </div>
      <div className="overflow-y-auto xl:min-h-0 xl:flex-1">
        {visibleLearners.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <UserRoundX aria-hidden="true" className="text-stone-300" size={22} />
            <h3 className="mt-4 type-body font-bold text-stone-900">{query.trim() ? '일치하는 학습자가 없습니다' : '승인된 학습자가 없습니다'}</h3>
          </div>
        ) : visibleLearners.map((request) => (
          <div className="grid gap-2 border-b border-stone-100 px-4 py-2.5 type-caption last:border-0 lg:grid-cols-[1fr_1.25fr_1fr_1fr_54px] lg:items-center" key={request.requestId}>
            <div className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 type-micro font-bold text-stone-600">{getInitial(request.learner?.name)}</span>
              <strong className="truncate text-stone-900">{request.learner?.name ?? '-'}</strong>
            </div>
            <span className="truncate text-stone-500">{request.learner?.email ?? '-'}</span>
            <span className="truncate text-stone-500">{request.learner?.affiliation ?? '-'}</span>
            <span className="type-micro text-stone-400">{formatEntryTime(request.processedAt ?? request.requestedAt)}</span>
            <button className="justify-self-end type-micro font-semibold text-stone-300" disabled title="백엔드 수강생 제외 API가 필요합니다." type="button">제외</button>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 px-4 py-3 text-center type-micro text-stone-400">승인 이력을 기준으로 {learners.length}명을 표시합니다.</div>
    </section>
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

function getWeekDisplayStatus(week?: ClassroomWeek): WeekDisplayStatus {
  return week?.status === 'PUBLISHED' ? 'PUBLISHED' : 'PRIVATE'
}

function getInitial(name?: string): string {
  return name?.trim().slice(0, 1) || '?'
}

function formatEntryTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function omitNumericKey<T>(record: Record<number, T>, key: number): Record<number, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([entryKey]) => Number(entryKey) !== key),
  )
}
