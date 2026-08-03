import { Archive, ChevronDown, ChevronUp, Copy, Megaphone, Send, Settings, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { isInstructorRole, useAuth } from '../../features/auth'
import { createClassroomsRepository, type Classroom, type ClassroomNotice, type ClassroomWeek } from '../../features/classrooms'
import { createMaterialsRepository, validateMaterialUpload } from '../../features/materials'
import { getRequestErrorMessage } from '../../shared/api'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { Button, ButtonLink, EmptyState, PageContainer, PageHeader, useToast } from '../../shared/ui'
import { classroomEditPath, materialDetailPath } from '../routes'

export function ClassroomDetailPage() {
  usePageTitle('강의실 자료 관리')
  const { classroomId = '' } = useParams()
  const { apiRequest, rawApiRequest, user } = useAuth()
  const { show: showToast } = useToast()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [weeks, setWeeks] = useState<ClassroomWeek[]>([])
  const [notices, setNotices] = useState<ClassroomNotice[]>([])
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggingWeek, setDraggingWeek] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadWeek, setUploadWeek] = useState<number | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const replacementTarget = useRef<{ materialId: string; weekNumber: number } | null>(null)
  const replacementInput = useRef<HTMLInputElement>(null)
  const classroomsRepository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const materialsRepository = useMemo(() => createMaterialsRepository(apiRequest, rawApiRequest), [apiRequest, rawApiRequest])
  const isInstructor = isInstructorRole(user?.role)
  const isReadOnly = classroom?.status === 'COMPLETED'
  const canManageMaterials = isInstructor && !isReadOnly

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [nextClassroom, nextWeeks, nextNotices] = await Promise.all([
        classroomsRepository.get(classroomId),
        classroomsRepository.listWeeks(classroomId),
        classroomsRepository.listNotices(classroomId),
      ])
      setClassroom(nextClassroom)
      setWeeks(nextWeeks)
      setNotices(nextNotices)
      setExpandedWeek((current) => current ?? getInitialExpandedWeek(nextWeeks))
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
      classroomsRepository.listNotices(classroomId),
    ]).then(([nextClassroom, nextWeeks, nextNotices]) => { if (!cancelled) { setClassroom(nextClassroom); setWeeks(nextWeeks); setNotices(nextNotices); setExpandedWeek(getInitialExpandedWeek(nextWeeks)) } })
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

  async function publishWeekNow(week: ClassroomWeek) {
    if (!canManageMaterials) return
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
      await load()
      return material.status !== 'FAILED'
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
      return false
    } finally {
      setIsUploading(false)
      setUploadWeek(null)
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

  return (
    <PageContainer>
      <PageHeader
        actions={isInstructor && classroom ? <>
          <Button disabled={isReadOnly} onClick={() => void copyInviteCode()} title={isReadOnly ? '종료된 강의실의 초대 코드는 사용할 수 없습니다.' : '초대 코드 복사'} variant="secondary">{classroom.inviteCode ?? '초대 코드'}<Copy aria-hidden="true" size={14} /></Button>
          <ButtonLink to={classroomEditPath(classroom.id)} variant="secondary"><Settings aria-hidden="true" size={14} />설정</ButtonLink>
          {!isReadOnly ? <Button disabled={weeks.length === 0 || isUploading} onClick={() => setIsUploadDialogOpen(true)}><Upload aria-hidden="true" size={14} />자료 업로드</Button> : null}
        </> : undefined}
        title={classroom?.name ?? '강의실'}
        titleAccessory={!isInstructor && classroom ? <span className="type-caption text-stone-400">전체 진도 {classroom.progressRate}% · 자료 {weeks.reduce((sum, week) => sum + week.materials.length, 0)}개</span> : undefined}
      />

      {isInstructor && isReadOnly ? <p className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 type-caption leading-5 text-stone-600" role="status"><Archive aria-hidden="true" className="shrink-0 text-stone-500" size={15} />종료된 강의실입니다. 기존 자료는 확인할 수 있지만 새 자료 업로드, 삭제, 공개 상태 변경은 할 수 없습니다.</p> : null}

      {!isInstructor && notices.length > 0 ? <section className="flex items-start gap-3 rounded-lg bg-stone-100 px-4 py-3 type-body"><Megaphone aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700" size={15} /><div className="min-w-0"><strong className="text-stone-900">강의자 공지</strong><p className="mt-1 line-clamp-2 type-caption leading-5 text-stone-600">{notices[0].title} · {notices[0].content}</p></div><time className="ml-auto shrink-0 type-micro text-stone-400">{new Date(notices[0].publishedAt).toLocaleDateString('ko-KR')}</time></section> : null}

      {isLoading ? <p className="py-16 text-center type-body text-stone-500" role="status">강의실 정보를 불러오는 중입니다.</p> : null}
      {error ? <EmptyState action={<Button onClick={() => void load()} variant="secondary">다시 시도</Button>} description={error} title="강의실 정보를 불러오지 못했습니다" /> : null}
      {!isLoading && !error && weeks.length === 0 ? <EmptyState description={isInstructor ? '수업 기간에 따라 생성된 주차가 이곳에 표시됩니다.' : '강의자가 자료를 공개하면 이곳에 표시됩니다.'} title="등록된 주차와 자료가 없습니다" /> : null}

      {weeks.length > 0 ? <section className="space-y-3" aria-label="주차별 자료">
        {weeks.map((week) => <article
          className={`overflow-hidden rounded-lg border bg-white transition-colors ${draggingWeek === week.weekNumber ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-100' : 'border-stone-200'} ${!isInstructor && week.status !== 'PUBLISHED' ? 'opacity-60' : ''}`}
          key={week.weekNumber}
          onDragEnter={canManageMaterials ? (event) => handleDragEnter(event, week.weekNumber) : undefined}
          onDragLeave={canManageMaterials ? handleDragLeave : undefined}
          onDragOver={canManageMaterials ? (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' } : undefined}
          onDrop={canManageMaterials ? (event) => handleDrop(event, week.weekNumber) : undefined}
        >
          <div className="flex min-h-14 flex-wrap items-center gap-3 bg-stone-50 px-4 py-3">
            <h2 className="font-bold text-stone-900">{week.weekNumber}주차 - {week.title}</h2>
            <span className="rounded-full bg-brand-50 px-2 py-1 type-micro font-semibold text-brand-700">{week.status === 'PUBLISHED' ? '공개' : '공개 예정'}</span>
            {week.releaseAt ? <span className="type-caption text-stone-400">{new Date(week.releaseAt).toLocaleString('ko-KR')}</span> : null}
            {isInstructor ? <div className="ml-auto flex items-center gap-3"><span className="type-micro text-stone-400">자료 {week.materials.length} · 평균 진도 {classroom?.progressRate ?? 0}%</span>{canManageMaterials && week.status !== 'PUBLISHED' ? <Button onClick={() => void publishWeekNow(week)} size="sm" variant="secondary"><Send aria-hidden="true" size={13} />지금 공개</Button> : null}</div> : <button aria-expanded={expandedWeek === week.weekNumber} aria-label={`${week.weekNumber}주차 ${expandedWeek === week.weekNumber ? '접기' : '펼치기'}`} className="ml-auto flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-white" disabled={week.status !== 'PUBLISHED'} onClick={() => setExpandedWeek((current) => current === week.weekNumber ? null : week.weekNumber)} type="button">{expandedWeek === week.weekNumber ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>}
          </div>
          {(isInstructor || expandedWeek === week.weekNumber) ? <>
            {week.materials.length > 0 ? <div className="divide-y divide-stone-100">{week.materials.map((material) => <div className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]" key={material.id}><span className="rounded bg-rose-50 px-2 py-1 type-micro font-bold text-rose-600">PDF</span><div className="min-w-0">{material.status === 'READY' ? <Link className="block truncate type-body font-semibold text-stone-800 hover:text-brand-700" to={materialDetailPath(material.id)}>{material.title}</Link> : <span className="block truncate type-body font-semibold text-stone-800">{material.title}</span>}<p className="mt-0.5 type-micro text-stone-400">{material.pageCount ? `${material.pageCount}쪽` : material.status === 'PROCESSING' ? '처리 중' : material.status === 'FAILED' ? 'PDF 처리 실패' : '준비됨'} · {formatUploadDate(material.uploadedAt)} 업로드</p></div><div className="col-span-2 flex min-w-44 items-center justify-end gap-2 sm:col-span-1"><span className="type-micro text-stone-500">열람 {material.viewerCount ?? '-'}/{classroom?.learnerCount ?? 0}명</span><span className="h-1 w-20 overflow-hidden rounded-full bg-stone-200" title={material.viewRate === undefined ? '자료별 열람률 API가 필요합니다.' : `열람률 ${material.viewRate}%`}><span className="block h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.max(0, material.viewRate ?? 0))}%` }} /></span></div>{canManageMaterials ? <div className="col-span-2 flex justify-end gap-3 sm:col-span-1"><button className="type-caption text-stone-600 hover:text-brand-700" onClick={() => selectReplacement(material.id, week.weekNumber)} type="button">교체</button><button className="type-caption text-rose-600 hover:text-rose-700" onClick={() => void detachMaterial(week.weekNumber, material.id, material.title)} type="button">삭제</button></div> : null}</div>)}</div> : null}
            {canManageMaterials ? <div
              aria-label={`${week.weekNumber}주차 PDF 드롭 영역`}
              className={`m-3 flex min-h-14 items-center justify-center rounded-lg border border-dashed px-4 type-caption font-medium transition-colors ${draggingWeek === week.weekNumber ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-300 bg-stone-50 text-stone-400'}`}
            >
              {isUploading && uploadWeek === week.weekNumber ? 'PDF 업로드 중' : 'PDF를 놓아 이 주차에 추가'}
            </div> : week.materials.length === 0 ? <p className="px-4 py-5 text-center type-body text-stone-400">등록된 자료가 없습니다.</p> : null}
          </> : null}
        </article>)}
      </section> : null}
      <input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void replaceMaterial(file); event.target.value = '' }} ref={replacementInput} tabIndex={-1} type="file" />
      {isUploadDialogOpen ? <UploadMaterialDialog isUploading={isUploading} onClose={() => setIsUploadDialogOpen(false)} onUpload={uploadMaterial} weeks={weeks} /> : null}
    </PageContainer>
  )
}

function UploadMaterialDialog({ isUploading, onClose, onUpload, weeks }: { isUploading: boolean; onClose: () => void; onUpload: (file: File, weekNumber: number) => Promise<boolean>; weeks: ClassroomWeek[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [weekNumber, setWeekNumber] = useState(weeks[0]?.weekNumber ?? 1)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    if (await onUpload(file, weekNumber)) onClose()
  }

  return <div aria-label="자료 업로드" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4" role="dialog"><form className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="type-dialog-title font-bold text-stone-950">자료 업로드</h2><button aria-label="자료 업로드 닫기" className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100" onClick={onClose} type="button"><X aria-hidden="true" size={17} /></button></div><label className="mt-5 block type-control font-semibold text-stone-700">주차 선택<select className="mt-1 h-10 w-full rounded-lg border border-stone-300 bg-white px-3 type-body" onChange={(event) => setWeekNumber(Number(event.target.value))} value={weekNumber}>{weeks.map((week) => <option key={week.weekNumber} value={week.weekNumber}>{week.weekNumber}주차 - {week.title}</option>)}</select></label><label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 text-center hover:border-brand-400 hover:bg-brand-50/30"><Upload aria-hidden="true" className="text-stone-400" size={20} /><span className="mt-2 type-body font-semibold text-stone-700">{file?.name ?? 'PDF 파일 선택'}</span><span className="mt-1 type-caption text-stone-400">PDF · 최대 45MB</span><input accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /></label><div className="mt-5 flex justify-end gap-2"><Button onClick={onClose} variant="secondary">취소</Button><Button disabled={!file || isUploading} type="submit">{isUploading ? '업로드 중' : '업로드'}</Button></div></form></div>
}

function formatUploadDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '날짜 미상'
  return date.toLocaleDateString('ko-KR')
}

function getInitialExpandedWeek(weeks: ClassroomWeek[]): number | null {
  return [...weeks]
    .filter((week) => week.status === 'PUBLISHED')
    .sort((left, right) => right.weekNumber - left.weekNumber)[0]?.weekNumber ?? null
}
