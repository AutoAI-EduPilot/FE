import { Archive, Copy, FileText, KeyRound, MoreHorizontal, Plus, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { isInstructorRole, useAuth } from '../../features/auth'
import { createClassroomsRepository, rememberClassroomId, type Classroom, type ClassroomWeek } from '../../features/classrooms'
import { createMaterialsRepository, validateMaterialUpload } from '../../features/materials'
import { createSessionsRepository } from '../../features/sessions'
import { getRequestErrorMessage } from '../../shared/api'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { usePolling } from '../../shared/state'
import { Button, EmptyState, useToast } from '../../shared/ui'
import { sessionDetailPath } from '../routes'
import { ClassroomWorkspaceContainer } from './classroom/ClassroomWorkspaceContainer'
import { ClassroomWorkspaceHeader } from './classroom/ClassroomWorkspaceHeader'

export function ClassroomDetailPage() {
  usePageTitle('강의실 자료 관리')
  const { classroomId = '' } = useParams()
  const navigate = useNavigate()
  const { apiRequest, rawApiRequest, user } = useAuth()
  const { show: showToast } = useToast()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [weeks, setWeeks] = useState<ClassroomWeek[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggingWeek, setDraggingWeek] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadWeek, setUploadWeek] = useState<number | null>(null)
  const [isWeekDialogOpen, setIsWeekDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadTargetWeek, setUploadTargetWeek] = useState<number | null>(null)
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null)
  const [isMaterialPollingStopped, setIsMaterialPollingStopped] = useState(false)
  const [openingMaterialId, setOpeningMaterialId] = useState<string | null>(null)
  const materialRefreshAttempts = useRef(0)
  const replacementTarget = useRef<{ materialId: string; weekNumber: number } | null>(null)
  const replacementInput = useRef<HTMLInputElement>(null)
  const classroomsRepository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const materialsRepository = useMemo(() => createMaterialsRepository(apiRequest, rawApiRequest), [apiRequest, rawApiRequest])
  const sessionsRepository = useMemo(() => createSessionsRepository(apiRequest), [apiRequest])
  const isInstructor = isInstructorRole(user?.role)
  const isReadOnly = classroom?.status === 'COMPLETED'
  const canManageMaterials = isInstructor && !isReadOnly

  useEffect(() => {
    if (classroomId) rememberClassroomId(classroomId)
  }, [classroomId])

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [nextClassroom, nextWeeks] = await Promise.all([
        classroomsRepository.get(classroomId),
        classroomsRepository.listWeeks(classroomId),
      ])
      const sortedWeeks = sortWeeksByNumber(nextWeeks)
      setClassroom(nextClassroom)
      setWeeks(sortedWeeks)
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
    ]).then(([nextClassroom, nextWeeks]) => {
      if (!cancelled) {
        const sortedWeeks = sortWeeksByNumber(nextWeeks)
        materialRefreshAttempts.current = 0
        setIsMaterialPollingStopped(false)
        setClassroom(nextClassroom)
        setWeeks(sortedWeeks)
      }
    })
      .catch((requestError) => { if (!cancelled) setError(getRequestErrorMessage(requestError)) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [classroomId, classroomsRepository])

  const refreshWeekMaterials = useCallback(async (expectedMaterialId?: string) => {
    const materialId = expectedMaterialId ?? pendingMaterialId
    if (materialId && materialRefreshAttempts.current >= 20) {
      setPendingMaterialId(null)
      setIsMaterialPollingStopped(true)
      return
    }
    if (materialId) materialRefreshAttempts.current += 1
    try {
      const nextWeeks = sortWeeksByNumber(await classroomsRepository.listWeeks(classroomId))
      setWeeks(nextWeeks)
      if (materialId && nextWeeks.some((week) => week.materials.some((material) => material.id === materialId))) {
        materialRefreshAttempts.current = 0
        setPendingMaterialId(null)
      }
    } catch {
      // Background refresh failures remain silent; manual retry still exposes errors.
    }
  }, [classroomId, classroomsRepository, pendingMaterialId])

  usePolling(
    !isMaterialPollingStopped && (Boolean(pendingMaterialId) || weeks.some((week) => week.materials.some((material) => material.status === 'PROCESSING'))),
    () => void refreshWeekMaterials(),
    3000,
  )

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
    if (!canManageMaterials) return
    if (!window.confirm(`'${title}'을(를) ${weekNumber}주차에서 제거할까요? 자료 자체는 자료 목록에 남습니다.`)) return
    try {
      await classroomsRepository.detachMaterial(classroomId, weekNumber, materialId)
      showToast('주차에서 자료를 제거했습니다.', 'success')
      await load()
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function createWeek(input: { releaseAt?: string; title: string; weekNumber: number }) {
    try {
      await classroomsRepository.createWeek(classroomId, input)
      setIsWeekDialogOpen(false)
      showToast(`${input.weekNumber}주차를 추가했습니다.`, 'success')
      await load()
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  async function uploadMaterial(file: File, weekNumber: number): Promise<boolean> {
    if (!canManageMaterials) return false
    const validationError = validateMaterialUpload(file)
    if (validationError) {
      showToast(validationError, 'danger')
      return false
    }
    setIsUploading(true)
    setUploadWeek(weekNumber)
    try {
      const material = await materialsRepository.upload(file, { classroomId, weekNumber })
      showToast(
        material.status === 'FAILED'
          ? '파일은 전송됐지만 PDF 처리에 실패했습니다.'
          : 'PDF 업로드를 시작했습니다. 처리 상태는 목록에서 확인할 수 있습니다.',
        material.status === 'FAILED' ? 'danger' : 'success',
      )
      materialRefreshAttempts.current = 0
      setIsMaterialPollingStopped(false)
      if (material.status !== 'FAILED') setPendingMaterialId(material.id)
      await refreshWeekMaterials(material.id)
      return material.status !== 'FAILED'
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
      return false
    } finally {
      setIsUploading(false)
      setUploadWeek(null)
    }
  }

  async function openMaterial(materialId: string) {
    if (openingMaterialId) return
    setOpeningMaterialId(materialId)
    try {
      const session = await sessionsRepository.create(materialId)
      navigate(sessionDetailPath(session.id))
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
      setOpeningMaterialId(null)
    }
  }

  function selectReplacement(materialId: string, weekNumber: number) {
    if (!canManageMaterials) return
    replacementTarget.current = { materialId, weekNumber }
    replacementInput.current?.click()
  }

  async function replaceMaterial(file: File) {
    const target = replacementTarget.current
    if (!target) return
    const uploaded = await uploadMaterial(file, target.weekNumber)
    if (!uploaded) return
    try {
      await classroomsRepository.detachMaterial(classroomId, target.weekNumber, target.materialId)
      showToast('주차 자료를 교체했습니다.', 'success')
      await load()
    } catch (requestError) {
      showToast(`새 자료는 업로드했지만 기존 자료를 분리하지 못했습니다. ${getRequestErrorMessage(requestError)}`, 'danger')
    }
  }

  function handleDragEnter(event: DragEvent<HTMLElement>, weekNumber: number) {
    event.preventDefault()
    if (!isUploading) setDraggingWeek(weekNumber)
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
    setDraggingWeek(null)
  }

  function handleDrop(event: DragEvent<HTMLElement>, weekNumber: number) {
    event.preventDefault()
    setDraggingWeek(null)
    if (isUploading) return
    const file = event.dataTransfer.files[0]
    if (file) void uploadMaterial(file, weekNumber)
  }

  const materialCount = weeks.reduce((sum, week) => sum + week.materials.length, 0)
  const missingWeekNumbers = classroom
    ? Array.from({ length: classroom.weekCount }, (_, index) => index + 1)
      .filter((weekNumber) => !weeks.some((week) => week.weekNumber === weekNumber))
    : []

  return (
    <ClassroomWorkspaceContainer>
      {classroom ? <ClassroomWorkspaceHeader
        actions={isInstructor ? <><Button disabled={isReadOnly} onClick={() => void copyInviteCode()} title={isReadOnly ? '종료된 강의실의 초대 코드는 사용할 수 없습니다.' : '초대 코드 복사'} variant="secondary"><KeyRound aria-hidden="true" size={14} /><span className="font-bold">{classroom.inviteCode ?? '초대 코드'}</span><Copy aria-hidden="true" size={13} /></Button><Button disabled={isReadOnly || missingWeekNumbers.length === 0} onClick={() => setIsWeekDialogOpen(true)} title={missingWeekNumbers.length === 0 ? '수업 기간의 모든 주차가 생성되어 있습니다.' : '주차 추가'} variant="secondary"><Plus aria-hidden="true" size={14} />주차 추가</Button><Button disabled={isReadOnly || isUploading || weeks.length === 0} onClick={() => { setUploadTargetWeek(null); setIsUploadDialogOpen(true) }}><Upload aria-hidden="true" size={14} />자료 업로드</Button></> : undefined}
        activeTab="materials"
        classroom={classroom}
        materialCount={materialCount}
      /> : null}

      {isInstructor && isReadOnly ? <p className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 type-caption leading-5 text-stone-600" role="status"><Archive aria-hidden="true" className="shrink-0 text-stone-500" size={15} />종료된 강의실입니다. 기존 자료는 확인할 수 있지만 새 자료 업로드, 교체, 삭제는 할 수 없습니다.</p> : null}

      {isLoading ? <p className="py-16 text-center type-body text-stone-500" role="status">강의실 정보를 불러오는 중입니다.</p> : null}
      {error ? <EmptyState action={<Button onClick={() => void load()} variant="secondary">다시 시도</Button>} description={error} title="강의실 정보를 불러오지 못했습니다" /> : null}
      {!isLoading && !error && weeks.length === 0 ? <EmptyState description={isInstructor ? '수업 기간에 따라 생성된 주차가 이곳에 표시됩니다.' : '강의자가 자료를 공개하면 이곳에 표시됩니다.'} title="등록된 주차와 자료가 없습니다" /> : null}

      {weeks.length > 0 ? <section aria-label="주차별 자료" className="overflow-visible rounded-lg border border-stone-200 bg-white">
        <div className="overflow-x-auto rounded-lg">
          <div className="min-w-[820px]">
            <div className="grid min-h-9 grid-cols-[88px_minmax(330px,1fr)_130px_220px_56px] items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 type-caption font-semibold text-stone-500" role="row">
              <span>주차</span><span>자료</span><span>공개일</span><span>열람률</span><span className="text-center">작업</span>
            </div>
            {weeks.map((week) => {
              const viewRate = getWeekViewRate(week)
              const viewerCount = getWeekViewerCount(week)
              const rowTone = week.status === 'SCHEDULED' ? 'bg-amber-50/70' : draggingWeek === week.weekNumber ? 'bg-brand-50/70' : 'bg-white'
              return <article
                className={`grid min-h-16 grid-cols-[88px_minmax(330px,1fr)_130px_220px_56px] items-center gap-2 border-b border-stone-100 px-4 last:border-b-0 ${rowTone}`}
                key={week.id}
                onDragEnter={canManageMaterials ? (event) => handleDragEnter(event, week.weekNumber) : undefined}
                onDragLeave={canManageMaterials ? handleDragLeave : undefined}
                onDragOver={canManageMaterials ? (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' } : undefined}
                onDrop={canManageMaterials ? (event) => handleDrop(event, week.weekNumber) : undefined}
              >
                <span className={`w-fit rounded-lg px-3 py-2 type-control font-bold ${week.status === 'PUBLISHED' ? 'bg-brand-600 text-white' : week.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>{week.weekNumber}주차</span>
                <div className="min-w-0 py-2">
                  {week.materials.length > 0 ? <div className="space-y-2">{week.materials.map((material) => <div className="min-w-0" key={material.id}>
                    {material.status === 'READY' ? <button className="block max-w-full truncate type-body font-extrabold text-stone-950 hover:text-brand-700 disabled:text-stone-400" disabled={openingMaterialId !== null} onClick={() => void openMaterial(material.id)} title={material.title} type="button">{openingMaterialId === material.id ? 'PDF 여는 중' : getMaterialDisplayTitle(material.title)}</button> : <strong className="block truncate type-body font-extrabold text-stone-950">{getMaterialDisplayTitle(material.title)}</strong>}
                  </div>)}</div> : canManageMaterials ? <button aria-label={`${week.weekNumber}주차 PDF 드롭 영역`} className={`flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed px-4 text-left type-caption ${draggingWeek === week.weekNumber ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-300 text-stone-400 hover:border-brand-400 hover:bg-brand-50/30'}`} onClick={() => { setUploadTargetWeek(week.weekNumber); setIsUploadDialogOpen(true) }} type="button"><FileText aria-hidden="true" size={14} />{isUploading && uploadWeek === week.weekNumber ? 'PDF 업로드 중' : '자료를 끌어다 놓거나 클릭해 업로드'}</button> : <span className="type-caption text-stone-400">등록된 자료가 없습니다.</span>}
                </div>
                <time className={`type-control ${week.status === 'SCHEDULED' ? 'font-semibold text-amber-700' : 'text-stone-600'}`}>{week.releaseAt ? formatReleaseDate(week.releaseAt, week.status === 'SCHEDULED') : '-'}</time>
                <div>{viewRate === null ? <span className="type-caption text-stone-400">열람 정보 없음</span> : <div className="flex items-center gap-3"><span className="block h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-stone-100"><span className={`block h-full rounded-full ${viewRate >= 80 ? 'bg-emerald-600' : 'bg-brand-600'}`} style={{ width: `${viewRate}%` }} /></span><span className={`shrink-0 type-caption font-semibold ${viewRate >= 80 ? 'text-emerald-700' : 'text-brand-700'}`}>조회 {viewerCount ?? 0}명 · {viewRate}%</span></div>}</div>
                <div className="relative flex justify-center">{canManageMaterials && week.materials.length > 0 ? <details><summary aria-label={`${week.weekNumber}주차 작업 메뉴`} className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"><MoreHorizontal aria-hidden="true" size={17} /></summary><div className="absolute top-9 right-0 z-20 w-52 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">{week.materials.map((material) => <div className="border-b border-stone-100 py-1 last:border-0" key={material.id}><p className="truncate px-2 py-1 type-micro font-semibold text-stone-500">{getMaterialDisplayTitle(material.title)}</p><button className="w-full rounded px-2 py-1.5 text-left type-caption text-stone-700 hover:bg-stone-50" onClick={() => selectReplacement(material.id, week.weekNumber)} type="button">교체</button><button className="w-full rounded px-2 py-1.5 text-left type-caption text-rose-700 hover:bg-rose-50" onClick={() => void detachMaterial(week.weekNumber, material.id, material.title)} type="button">삭제</button></div>)}</div></details> : <MoreHorizontal aria-hidden="true" className="text-stone-300" size={17} />}</div>
              </article>
            })}
          </div>
        </div>
      </section> : null}
      <input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceMaterial(file); event.target.value = '' }} ref={replacementInput} tabIndex={-1} type="file" />
      {isWeekDialogOpen && classroom ? <CreateWeekDialog availableWeekNumbers={missingWeekNumbers} onClose={() => setIsWeekDialogOpen(false)} onCreate={createWeek} startDate={classroom.startDate} /> : null}
      {isUploadDialogOpen ? <UploadMaterialDialog initialWeekNumber={uploadTargetWeek ?? undefined} isUploading={isUploading} onClose={() => setIsUploadDialogOpen(false)} onUpload={uploadMaterial} weeks={weeks} /> : null}
    </ClassroomWorkspaceContainer>
  )
}

function CreateWeekDialog({ availableWeekNumbers, onClose, onCreate, startDate }: { availableWeekNumbers: number[]; onClose: () => void; onCreate: (input: { releaseAt?: string; title: string; weekNumber: number }) => Promise<void>; startDate: string }) {
  const initialWeekNumber = availableWeekNumbers[0] ?? 1
  const [weekNumber, setWeekNumber] = useState(initialWeekNumber)
  const [title, setTitle] = useState(`${initialWeekNumber}주차`)
  const [releaseAt, setReleaseAt] = useState(() => getDefaultWeekReleaseAt(startDate, initialWeekNumber))
  const [isSubmitting, setIsSubmitting] = useState(false)

  function changeWeek(nextWeekNumber: number) {
    setWeekNumber(nextWeekNumber)
    setTitle(`${nextWeekNumber}주차`)
    setReleaseAt(getDefaultWeekReleaseAt(startDate, nextWeekNumber))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCreate({
        releaseAt: releaseAt ? new Date(releaseAt).toISOString() : undefined,
        title: title.trim(),
        weekNumber,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div aria-labelledby="create-week-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog"><form className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="type-dialog-title font-bold text-stone-950" id="create-week-title">주차 추가</h2><button aria-label="주차 추가 닫기" className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100" onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><label className="mt-5 block type-control font-semibold text-stone-700">주차<select className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 type-body" onChange={(event) => changeWeek(Number(event.target.value))} value={weekNumber}>{availableWeekNumbers.map((value) => <option key={value} value={value}>{value}주차</option>)}</select></label><label className="mt-4 block type-control font-semibold text-stone-700">주차 이름<input className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 type-body" maxLength={100} onChange={(event) => setTitle(event.target.value)} value={title} /></label><label className="mt-4 block type-control font-semibold text-stone-700">공개 예정일 <span className="font-normal text-stone-400">(선택)</span><input className="mt-1 h-10 w-full rounded-lg border border-stone-300 px-3 type-body" onChange={(event) => setReleaseAt(event.target.value)} type="datetime-local" value={releaseAt} /></label><div className="mt-5 flex justify-end gap-2"><Button onClick={onClose} variant="secondary">취소</Button><Button disabled={!title.trim() || isSubmitting} type="submit">{isSubmitting ? '추가 중' : '추가'}</Button></div></form></div>
}

function UploadMaterialDialog({ initialWeekNumber, isUploading, onClose, onUpload, weeks }: { initialWeekNumber?: number; isUploading: boolean; onClose: () => void; onUpload: (file: File, weekNumber: number) => Promise<boolean>; weeks: ClassroomWeek[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [weekNumber, setWeekNumber] = useState(initialWeekNumber ?? weeks[0]?.weekNumber ?? 1)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    if (await onUpload(file, weekNumber)) onClose()
  }

  return <div aria-label="강의자료 업로드" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog"><form className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="type-dialog-title font-bold text-stone-950">강의자료 업로드</h2><button aria-label="강의자료 업로드 닫기" className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100" onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><label className="mt-5 block type-control font-semibold text-stone-700">주차 선택<select className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 type-body" onChange={(event) => setWeekNumber(Number(event.target.value))} value={weekNumber}>{weeks.map((week) => <option key={week.weekNumber} value={week.weekNumber}>{week.weekNumber}주차 - {week.title}</option>)}</select></label><label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 text-center hover:border-brand-400 hover:bg-brand-50/30"><Upload aria-hidden="true" className="text-stone-400" size={20} /><span className="mt-2 type-body font-semibold text-stone-700">{file?.name ?? 'PDF 파일 선택'}</span><span className="mt-1 type-caption text-stone-400">PDF · 최대 45MB</span><input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /></label><div className="mt-5 flex justify-end gap-2"><Button onClick={onClose} variant="secondary">취소</Button><Button disabled={!file || isUploading} type="submit">{isUploading ? '업로드 중' : '업로드'}</Button></div></form></div>
}

function getMaterialDisplayTitle(title: string): string {
  return title.replace(/\.pdf$/i, '')
}

function sortWeeksByNumber(weeks: ClassroomWeek[]): ClassroomWeek[] {
  return [...weeks].sort((left, right) => left.weekNumber - right.weekNumber)
}

function formatReleaseDate(value: string, includeTime: boolean): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', includeTime
    ? { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'long' }
    : { day: 'numeric', month: 'long' }).format(date)
}

function getWeekViewRate(week: ClassroomWeek): number | null {
  const rates = week.materials.map((material) => material.viewRate).filter((value): value is number => value !== undefined)
  if (rates.length === 0) return null
  return Math.round(Math.max(0, Math.min(100, rates.reduce((sum, value) => sum + value, 0) / rates.length)))
}

function getWeekViewerCount(week: ClassroomWeek): number | null {
  const counts = week.materials.map((material) => material.viewerCount).filter((value): value is number => value !== undefined)
  return counts.length > 0 ? Math.max(...counts) : null
}

function getDefaultWeekReleaseAt(startDate: string, weekNumber: number): string {
  const [year, month, day] = startDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(year, month - 1, day + ((weekNumber - 1) * 7), 12)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
