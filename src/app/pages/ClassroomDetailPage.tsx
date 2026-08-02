import { Copy, FileText, FileUp, Pencil, Plus, Send, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { isInstructorRole, useAuth } from '../../features/auth'
import { createClassroomsRepository, type Classroom, type ClassroomWeek } from '../../features/classrooms'
import { createMaterialsRepository, validateMaterialUpload } from '../../features/materials'
import { getRequestErrorMessage } from '../../shared/api'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { Button, EmptyState, PageContainer, PageHeader, useToast } from '../../shared/ui'

export function ClassroomDetailPage() {
  usePageTitle('강의실 자료 관리')
  const { classroomId = '' } = useParams()
  const { apiRequest, rawApiRequest, user } = useAuth()
  const { show: showToast } = useToast()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [weeks, setWeeks] = useState<ClassroomWeek[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWeekDialogOpen, setIsWeekDialogOpen] = useState(false)
  const [editingWeek, setEditingWeek] = useState<ClassroomWeek | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadWeek, setUploadWeek] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const classroomsRepository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const materialsRepository = useMemo(() => createMaterialsRepository(apiRequest, rawApiRequest), [apiRequest, rawApiRequest])
  const isInstructor = isInstructorRole(user?.role)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [nextClassroom, nextWeeks] = await Promise.all([
        classroomsRepository.get(classroomId),
        classroomsRepository.listWeeks(classroomId),
      ])
      setClassroom(nextClassroom)
      setWeeks(nextWeeks)
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      classroomsRepository.get(classroomId),
      classroomsRepository.listWeeks(classroomId),
    ]).then(([nextClassroom, nextWeeks]) => { if (!cancelled) { setClassroom(nextClassroom); setWeeks(nextWeeks) } })
      .catch((requestError) => { if (!cancelled) setError(getRequestErrorMessage(requestError)) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [classroomId, classroomsRepository])

  async function copyInviteCode() {
    if (!classroom) return
    try {
      const inviteCode = classroom.inviteCode || await classroomsRepository.getInviteCode(classroom.id)
      await navigator.clipboard.writeText(inviteCode)
      setClassroom((current) => current ? { ...current, inviteCode } : current)
      showToast('초대 코드를 복사했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function detachMaterial(weekNumber: number, materialId: string, title: string) {
    if (!window.confirm(`'${title}'을(를) ${weekNumber}주차에서 제거할까요? 자료 자체는 자료 목록에 남습니다.`)) return
    try {
      await classroomsRepository.detachMaterial(classroomId, weekNumber, materialId)
      showToast('주차에서 자료를 제거했습니다.', 'success')
      await load()
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function publishWeekNow(week: ClassroomWeek) {
    if (!window.confirm(`${week.weekNumber}주차를 지금 공개할까요?`)) return
    try {
      await classroomsRepository.updateWeek(classroomId, week.weekNumber, {
        releaseAt: new Date().toISOString(),
      })
      showToast('주차를 공개했습니다.', 'success')
      await load()
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function uploadMaterial(file: File) {
    if (!uploadWeek) return
    const validationError = validateMaterialUpload(file)
    if (validationError) {
      showToast(validationError, 'danger')
      setUploadWeek(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setIsUploading(true)
    try {
      const material = await materialsRepository.upload(file, { classroomId, weekNumber: uploadWeek })
      showToast(
        material.status === 'FAILED'
          ? '파일은 전송됐지만 PDF 처리에 실패했습니다.'
          : 'PDF 업로드를 시작했습니다. 처리 상태는 목록에서 확인할 수 있습니다.',
        material.status === 'FAILED' ? 'danger' : 'success',
      )
      await load()
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    } finally {
      setIsUploading(false)
      setUploadWeek(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <PageContainer>
      <PageHeader
        actions={isInstructor && classroom ? <>
          <Button onClick={() => void copyInviteCode()} variant="secondary">{classroom.inviteCode ?? '초대 코드'}<Copy aria-hidden="true" size={14} /></Button>
          <Button onClick={() => setIsWeekDialogOpen(true)} variant="secondary"><Plus aria-hidden="true" size={14} />주차 추가</Button>
        </> : undefined}
        title={classroom ? `자료 관리 · ${classroom.name}` : '자료 관리'}
      />

      {isLoading ? <p className="py-16 text-center text-sm text-stone-500" role="status">강의실 정보를 불러오는 중입니다.</p> : null}
      {error ? <EmptyState action={<Button onClick={() => void load()} variant="secondary">다시 시도</Button>} description={error} title="강의실 정보를 불러오지 못했습니다" /> : null}
      {!isLoading && !error && weeks.length === 0 ? <EmptyState description={isInstructor ? '주차를 추가한 뒤 PDF 자료를 등록하세요.' : '강의자가 자료를 공개하면 이곳에 표시됩니다.'} title="등록된 주차와 자료가 없습니다" /> : null}

      {weeks.length > 0 ? <section className="space-y-3" aria-label="주차별 자료">
        {weeks.map((week) => <article className="overflow-hidden rounded-lg border border-stone-200 bg-white" key={week.weekNumber}>
          <div className="flex min-h-14 flex-wrap items-center gap-3 bg-stone-50 px-4 py-3">
            <h2 className="font-bold text-stone-900">{week.weekNumber}주차 - {week.title}</h2>
            <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">{week.status === 'PUBLISHED' ? '공개' : '공개 예정'}</span>
            {week.releaseAt ? <span className="text-xs text-stone-400">{new Date(week.releaseAt).toLocaleString('ko-KR')}</span> : null}
            {isInstructor ? <div className="ml-auto flex gap-2">{week.status !== 'PUBLISHED' ? <Button onClick={() => void publishWeekNow(week)} size="sm" variant="secondary"><Send aria-hidden="true" size={13} />지금 공개</Button> : null}<Button onClick={() => setEditingWeek(week)} size="sm" variant="secondary"><Pencil aria-hidden="true" size={13} />수정</Button><Button disabled={isUploading} onClick={() => { setUploadWeek(week.weekNumber); fileInputRef.current?.click() }} size="sm"><FileUp aria-hidden="true" size={14} />{isUploading && uploadWeek === week.weekNumber ? '업로드 중' : 'PDF 업로드'}</Button></div> : null}
          </div>
          {week.materials.length > 0 ? <div className="divide-y divide-stone-100">{week.materials.map((material) => <div className="flex min-h-12 items-center gap-3 px-4 py-2" key={material.id}><FileText aria-hidden="true" className="text-rose-500" size={15} /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">{material.title}</span><span className={material.status === 'FAILED' ? 'text-xs font-semibold text-rose-600' : 'text-xs text-stone-400'}>{material.pageCount ? `${material.pageCount}쪽` : material.status === 'PROCESSING' ? '처리 중' : material.status === 'FAILED' ? 'PDF 처리 실패' : '준비됨'}</span>{isInstructor ? <Button aria-label={`${material.title} 주차에서 제거`} onClick={() => void detachMaterial(week.weekNumber, material.id, material.title)} size="sm" variant="ghost"><Trash2 aria-hidden="true" size={13} />삭제</Button> : null}</div>)}</div> : <p className="px-4 py-5 text-center text-sm text-stone-400">등록된 자료가 없습니다.</p>}
        </article>)}
      </section> : null}

      <input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMaterial(file) }} ref={fileInputRef} type="file" />
      {isWeekDialogOpen ? <WeekDialog nextWeek={weeks.length + 1} onClose={() => setIsWeekDialogOpen(false)} onSubmit={async (input) => { try { await classroomsRepository.createWeek(classroomId, input); setIsWeekDialogOpen(false); showToast('주차를 추가했습니다.', 'success'); await load() } catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') } }} /> : null}
      {editingWeek ? <WeekDialog initialWeek={editingWeek} nextWeek={editingWeek.weekNumber} onClose={() => setEditingWeek(null)} onSubmit={async (input) => { try { await classroomsRepository.updateWeek(classroomId, editingWeek.weekNumber, { releaseAt: input.releaseAt, title: input.title }); setEditingWeek(null); showToast('주차 정보를 수정했습니다.', 'success'); await load() } catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') } }} /> : null}
    </PageContainer>
  )
}

function WeekDialog({ initialWeek, nextWeek, onClose, onSubmit }: { initialWeek?: ClassroomWeek; nextWeek: number; onClose: () => void; onSubmit: (input: { releaseAt?: string; title: string; weekNumber?: number }) => Promise<void> }) {
  const [title, setTitle] = useState(initialWeek?.title ?? '')
  const [releaseAt, setReleaseAt] = useState(() => initialWeek?.releaseAt ? toDateTimeLocal(initialWeek.releaseAt) : '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!title.trim() || isSubmitting) return; setIsSubmitting(true); await onSubmit({ releaseAt: releaseAt ? new Date(releaseAt).toISOString() : undefined, title: title.trim(), weekNumber: nextWeek }).finally(() => setIsSubmitting(false)) }
  return <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4" role="dialog"><form className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{initialWeek ? `${nextWeek}주차 수정` : '주차 추가'}</h2><button aria-label="닫기" className="p-2 text-stone-400" onClick={onClose} type="button"><X size={16} /></button></div><label className="mt-5 block text-sm font-semibold">주차 제목<input autoFocus className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3" onChange={(event) => setTitle(event.target.value)} placeholder={`${nextWeek}주차 학습`} value={title} /></label><label className="mt-4 block text-sm font-semibold">공개 시각 <span className="font-normal text-stone-400">(선택)</span><input className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3" onChange={(event) => setReleaseAt(event.target.value)} type="datetime-local" value={releaseAt} /></label><div className="mt-5 flex justify-end gap-2"><Button onClick={onClose} variant="ghost">취소</Button><Button disabled={!title.trim() || isSubmitting} type="submit">{isSubmitting ? '저장 중' : initialWeek ? '저장' : '추가'}</Button></div></form></div>
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
