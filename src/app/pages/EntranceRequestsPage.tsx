import { Copy, Inbox, Info, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import {
  createClassroomsRepository,
  JOIN_REQUESTS_CHANGED_EVENT,
  rememberClassroomId,
  type Classroom,
  type ClassroomStudent,
  type JoinRequest,
} from '../../features/classrooms'
import { getRequestErrorMessage } from '../../shared/api'
import { cx } from '../../shared/lib/cx'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { Button, EmptyState, PageContainer, PageHeader, useToast } from '../../shared/ui'
import { classroomEntranceRequestsPath } from '../routes'

type RequestTab = 'pending' | 'processed' | 'students'

export function EntranceRequestsPage() {
  usePageTitle('입장 요청')
  const { apiRequest } = useAuth()
  const { classroomId: routeClassroomId = '' } = useParams()
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const repository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState<RequestTab>(requestedTab === 'students' ? 'students' : 'pending')
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [classroomId, setClassroomId] = useState(routeClassroomId || searchParams.get('classroomId') || '')
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [students, setStudents] = useState<ClassroomStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    repository.list().then((items) => {
      setClassrooms(items)
      setClassroomId(items.some((item) => item.id === routeClassroomId) ? routeClassroomId : items[0]?.id ?? '')
    }).catch((requestError) => setError(getRequestErrorMessage(requestError)))
  }, [repository, routeClassroomId])

  useEffect(() => { if (classroomId) rememberClassroomId(classroomId) }, [classroomId])

  async function loadRequests(id: string, selectedTab: RequestTab) {
    if (!id) { setRequests([]); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      if (selectedTab === 'pending') setRequests(await repository.listJoinRequests(id, 'PENDING'))
      else if (selectedTab === 'students') {
        setStudents(await repository.listStudents(id))
        setRequests([])
      }
      else {
        const [approved, rejected] = await Promise.all([
          repository.listJoinRequests(id, 'APPROVED'),
          repository.listJoinRequests(id, 'REJECTED'),
        ])
        setRequests([...approved, ...rejected].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)))
      }
    } catch (requestError) { setError(getRequestErrorMessage(requestError)) }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    if (!classroomId) return
    const pending = tab === 'students'
      ? repository.listStudents(classroomId).then((items) => ({ requests: [] as JoinRequest[], students: items }))
      : tab === 'pending'
        ? repository.listJoinRequests(classroomId, 'PENDING').then((items) => ({ requests: items, students: [] as ClassroomStudent[] }))
        : Promise.all([
            repository.listJoinRequests(classroomId, 'APPROVED'),
            repository.listJoinRequests(classroomId, 'REJECTED'),
          ]).then(([approved, rejected]) => ({
            requests: [...approved, ...rejected].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
            students: [] as ClassroomStudent[],
          }))
    void pending
      .then((items) => {
        setError(null)
        setRequests(items.requests)
        setStudents(items.students)
      })
      .catch((requestError) => setError(getRequestErrorMessage(requestError)))
      .finally(() => setIsLoading(false))
  }, [classroomId, repository, tab])

  function selectTab(nextTab: RequestTab) {
    setTab(nextTab)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('tab', nextTab)
      if (classroomId) next.set('classroomId', classroomId)
      return next
    }, { replace: true })
  }

  async function process(request: JoinRequest, decision: 'approve' | 'reject') {
    if (decision === 'approve' && selectedClassroom?.status === 'COMPLETED') {
      showToast('종료된 강의실에는 학습자를 추가할 수 없습니다.', 'danger')
      return
    }
    try {
      await repository.processJoinRequest(classroomId, request.requestId, decision)
      window.dispatchEvent(new Event(JOIN_REQUESTS_CHANGED_EVENT))
      showToast(decision === 'approve' ? '입장 요청을 승인했습니다.' : '입장 요청을 거절했습니다.', 'success')
      await loadRequests(classroomId, tab)
    } catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') }
  }

  async function copyInviteCode() {
    if (!classroomId || selectedClassroom?.status === 'COMPLETED') return
    try { await navigator.clipboard.writeText(await repository.getInviteCode(classroomId)); showToast('초대 코드를 복사했습니다.', 'success') }
    catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') }
  }

  async function removeStudent(student: ClassroomStudent) {
    if (!window.confirm(`${student.name} 학습자를 강의실에서 제외할까요?`)) return
    try {
      await repository.removeStudent(classroomId, student.id)
      setStudents((current) => current.filter((item) => item.id !== student.id))
      showToast('학습자를 강의실에서 제외했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  const emptyTitle = tab === 'pending' ? '대기 중인 입장 요청이 없습니다' : tab === 'students' ? '승인된 학습자가 없습니다' : '처리한 입장 요청이 없습니다'
  const selectedClassroom = classrooms.find((item) => item.id === classroomId)
  const isClassroomCompleted = selectedClassroom?.status === 'COMPLETED'
  const itemCount = tab === 'students' ? students.length : requests.length

  return <PageContainer>
    <PageHeader title="입장 요청" titleAccessory={<label><span className="sr-only">강의실 선택</span><select className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 type-caption font-semibold text-stone-600" onChange={(event) => navigate(`${classroomEntranceRequestsPath(event.target.value)}?tab=${tab}`, { replace: true })} value={classroomId}>{classrooms.length === 0 ? <option value="">강의실 없음</option> : classrooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>} actions={<Button disabled={!classroomId || isClassroomCompleted} onClick={() => void copyInviteCode()} variant="secondary">초대 코드<Copy aria-hidden="true" size={14} /></Button>} />
    {isClassroomCompleted ? <p className="flex w-fit items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 type-caption leading-5 text-stone-600" role="status"><Info className="mt-0.5 shrink-0" size={14} />종료된 강의실에는 새 학습자를 추가하거나 입장 요청을 승인할 수 없습니다.</p> : null}
    <div aria-label="입장 요청 상태" className="inline-flex w-fit rounded-lg border border-stone-200 bg-white p-1" role="tablist"><TabButton active={tab === 'pending'} label={`대기 중${tab === 'pending' ? ` ${requests.length}` : ''}`} onClick={() => selectTab('pending')} /><TabButton active={tab === 'students'} label="수강생 관리" onClick={() => selectTab('students')} /><TabButton active={tab === 'processed'} label="처리 내역" onClick={() => selectTab('processed')} /></div>
    {isLoading ? <p className="py-16 text-center type-body text-stone-500" role="status">입장 정보를 불러오는 중입니다.</p> : null}
    {error ? <EmptyState action={<Button onClick={() => void loadRequests(classroomId, tab)} variant="secondary">다시 시도</Button>} description={error} title="입장 정보를 불러오지 못했습니다" /> : null}
    {!isLoading && !error ? <section className="overflow-hidden rounded-lg border border-stone-200 bg-white"><div className="hidden grid-cols-[1fr_1.4fr_1fr_1fr_150px] border-b border-stone-200 bg-stone-50 px-4 py-3 type-micro font-semibold text-stone-400 lg:grid"><span>학생</span><span>이메일</span><span>학교·소속</span><span>{tab === 'students' ? '입장 시각' : '요청 시각'}</span><span className="text-right">상태</span></div>{itemCount === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">{tab === 'students' ? <Users className="text-stone-300" size={20} /> : <Inbox className="text-stone-300" size={20} />}<h2 className="mt-4 font-bold">{emptyTitle}</h2></div> : tab === 'students' ? students.map((student) => <div className="grid gap-2 border-b border-stone-100 px-4 py-3 type-body last:border-0 lg:grid-cols-[1fr_1.4fr_1fr_1fr_150px] lg:items-center" key={student.id}><strong>{student.name}</strong><span className="text-stone-500">{student.email}</span><span className="text-stone-500">{student.affiliation ?? '-'}</span><span className="type-caption text-stone-400">{new Date(student.joinedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span><div className="flex justify-end"><Button onClick={() => void removeStudent(student)} size="sm" variant="ghost">제외</Button></div></div>) : requests.map((request) => <div className="grid gap-2 border-b border-stone-100 px-4 py-3 type-body last:border-0 lg:grid-cols-[1fr_1.4fr_1fr_1fr_150px] lg:items-center" key={request.requestId}><strong>{request.learner?.name ?? '-'}</strong><span className="text-stone-500">{request.learner?.email ?? '-'}</span><span className="text-stone-500">{request.learner?.affiliation ?? '-'}</span><span className="type-caption text-stone-400">{new Date(request.requestedAt).toLocaleString('ko-KR')}</span><div className="flex justify-end gap-2">{request.status === 'PENDING' ? <><Button onClick={() => void process(request, 'reject')} size="sm" variant="ghost">거절</Button><Button disabled={isClassroomCompleted} onClick={() => void process(request, 'approve')} size="sm" title={isClassroomCompleted ? '종료된 강의실에는 학습자를 추가할 수 없습니다.' : undefined}>승인</Button></> : <span className="type-caption font-semibold text-stone-500">{request.status === 'APPROVED' ? '승인됨' : '거절됨'}</span>}</div></div>)}</section> : null}
    <p className="flex w-fit items-start gap-2 rounded-lg bg-stone-50 px-3.5 py-2.5 type-caption leading-5 text-stone-500"><Info className="mt-0.5 shrink-0" size={14} />{tab === 'students' ? '현재 강의실에 참여 중인 학습자를 조회하고 제외할 수 있습니다.' : '초대 코드로 참여를 요청한 학습자는 강의자 승인 후 강의실에 입장합니다.'}</p>
  </PageContainer>
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button aria-selected={active} className={cx('h-8 rounded-md px-3 type-caption font-semibold', active ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100')} onClick={onClick} role="tab" type="button">{label}</button> }
