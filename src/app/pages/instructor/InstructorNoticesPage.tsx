import { BellRing, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../../features/auth'
import { createClassroomsRepository, rememberClassroomId, type Classroom, type ClassroomNotice } from '../../../features/classrooms'
import { getRequestErrorMessage } from '../../../shared/api'
import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { Button, EmptyState, PageContainer, PageHeader, useToast } from '../../../shared/ui'
import { classroomAnnouncementsPath } from '../../routes'

export function InstructorNoticesPage() {
  usePageTitle('공지 관리')
  const { apiRequest } = useAuth()
  const { classroomId: routeClassroomId = '' } = useParams()
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const repository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [classroomId, setClassroomId] = useState(routeClassroomId)
  const [notices, setNotices] = useState<ClassroomNotice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<ClassroomNotice | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function removeNotice(notice: ClassroomNotice) {
    if (removingId) return
    if (!window.confirm(`'${notice.title}' 공지를 내릴까요? 학습자 화면에서 사라집니다.`)) return
    setRemovingId(notice.id)
    try {
      await repository.deleteNotice(classroomId, notice.id)
      setNotices((items) => items.filter((item) => item.id !== notice.id))
      showToast('공지를 내렸습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    } finally {
      setRemovingId(null)
    }
  }

  useEffect(() => { repository.list().then((items) => { setClassrooms(items); setClassroomId(items.some((item) => item.id === routeClassroomId) ? routeClassroomId : items[0]?.id ?? ''); if (items.length === 0) setIsLoading(false) }).catch((requestError) => { setError(getRequestErrorMessage(requestError)); setIsLoading(false) }) }, [repository, routeClassroomId])
  useEffect(() => { if (!classroomId) return; repository.listNotices(classroomId).then(setNotices).catch((requestError) => setError(getRequestErrorMessage(requestError))).finally(() => setIsLoading(false)) }, [classroomId, repository])
  useEffect(() => { if (classroomId) rememberClassroomId(classroomId) }, [classroomId])

  return <PageContainer>
    <PageHeader title="공지 관리" titleAccessory={<label><span className="sr-only">강의실 선택</span><select className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 type-caption font-semibold text-stone-600" onChange={(event) => navigate(classroomAnnouncementsPath(event.target.value), { replace: true })} value={classroomId}>{classrooms.length === 0 ? <option value="">강의실 없음</option> : classrooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>} actions={<Button disabled={!classroomId} onClick={() => setIsComposerOpen(true)}><Plus aria-hidden="true" size={15} />새 공지</Button>} />
    {isLoading ? <p className="py-16 text-center type-body text-stone-500" role="status">공지를 불러오는 중입니다.</p> : null}
    {error ? <EmptyState description={error} title="공지를 불러오지 못했습니다" /> : null}
    {!isLoading && !error && notices.length === 0 ? <EmptyState description="새 공지를 등록하면 학습자에게 바로 전달됩니다." title="등록된 공지가 없습니다" /> : null}
    {notices.length > 0 ? <section className="overflow-hidden rounded-lg border border-stone-200 bg-white" aria-label="공지 목록">{notices.map((notice) => <article className="border-b border-stone-100 px-5 py-4 last:border-0" key={notice.id}><div className="flex items-center gap-3"><BellRing className="text-brand-600" size={15} /><h2 className="font-bold text-stone-900">{notice.title}</h2><time className="ml-auto type-caption text-stone-400">{new Date(notice.publishedAt).toLocaleDateString('ko-KR')}</time><Button aria-label={`${notice.title} 수정`} onClick={() => setEditingNotice(notice)} size="sm" variant="secondary"><Pencil aria-hidden="true" size={13} />수정</Button><Button aria-label={`${notice.title} 내리기`} disabled={removingId === notice.id} onClick={() => void removeNotice(notice)} size="sm" variant="ghost"><Trash2 aria-hidden="true" size={13} />내리기</Button></div><p className="mt-2 whitespace-pre-wrap type-body leading-6 text-stone-600">{notice.content}</p></article>)}</section> : null}
    {editingNotice ? <NoticeComposer initialContent={editingNotice.content} initialTitle={editingNotice.title} onClose={() => setEditingNotice(null)} onSubmit={async (input) => { try { const updated = await repository.updateNotice(classroomId, editingNotice.id, input); setNotices((items) => items.map((item) => item.id === updated.id ? updated : item)); setEditingNotice(null); showToast('공지를 수정했습니다.', 'success') } catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') } }} /> : null}
    {isComposerOpen ? <NoticeComposer onClose={() => setIsComposerOpen(false)} onSubmit={async (input) => { try { const created = await repository.createNotice(classroomId, input); setNotices((items) => [created, ...items]); setIsComposerOpen(false); showToast('공지를 등록했습니다.', 'success') } catch (requestError) { showToast(getRequestErrorMessage(requestError), 'danger') } }} /> : null}
  </PageContainer>
}

function NoticeComposer({ initialContent = '', initialTitle = '', onClose, onSubmit }: { initialContent?: string; initialTitle?: string; onClose: () => void; onSubmit: (input: { content: string; title: string }) => Promise<void> }) {
  const isEditing = Boolean(initialTitle)
  const [title, setTitle] = useState(initialTitle); const [content, setContent] = useState(initialContent); const [isSubmitting, setIsSubmitting] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!title.trim() || !content.trim() || isSubmitting) return; setIsSubmitting(true); await onSubmit({ content: content.trim(), title: title.trim() }).finally(() => setIsSubmitting(false)) }
  return <div aria-labelledby="notice-composer-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4" role="dialog"><form className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-2xl" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="type-dialog-title font-bold" id="notice-composer-title">{isEditing ? '공지 수정' : '새 공지'}</h2><button aria-label="공지 작성 닫기" className="p-2 text-stone-400" onClick={onClose} type="button"><X size={16} /></button></div><label className="mt-5 block type-body font-semibold">제목<input autoFocus className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3.5" onChange={(event) => setTitle(event.target.value)} value={title} /></label><label className="mt-4 block type-body font-semibold">내용<textarea className="mt-1 min-h-36 w-full resize-none rounded-lg border border-stone-300 px-3.5 py-3" onChange={(event) => setContent(event.target.value)} value={content} /></label><div className="mt-5 flex justify-end gap-2"><Button onClick={onClose} variant="ghost">취소</Button><Button disabled={!title.trim() || !content.trim() || isSubmitting} type="submit">{isSubmitting ? (isEditing ? '저장 중' : '등록 중') : isEditing ? '저장' : '등록'}</Button></div></form></div>
}
