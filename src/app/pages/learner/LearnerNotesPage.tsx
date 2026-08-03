import { FileText, Pencil, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../../features/auth'
import { createNotesRepository, type Note } from '../../../features/notes'
import {
  createSessionsRepository,
  type LearningSession,
} from '../../../features/sessions'
import { getRequestErrorMessage } from '../../../shared/api'
import { usePageTitle } from '../../../shared/lib/usePageTitle'
import {
  Button,
  ButtonLink,
  EmptyState,
  PageContainer,
  PageHeader,
  useToast,
} from '../../../shared/ui'
import { sessionDetailPath } from '../../routes'

interface LearnerNoteItem {
  note: Note
  session: LearningSession
}

export function LearnerNotesPage() {
  usePageTitle('내 노트')
  const { apiRequest } = useAuth()
  const { show: showToast } = useToast()
  const sessionsRepository = useMemo(
    () => createSessionsRepository(apiRequest),
    [apiRequest],
  )
  const notesRepository = useMemo(
    () => createNotesRepository(apiRequest),
    [apiRequest],
  )
  const [items, setItems] = useState<LearnerNoteItem[]>([])
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const sessions = (await sessionsRepository.list()).filter(
        (session) => session.status !== 'DELETED',
      )
      const notesBySession = await Promise.all(
        sessions.map(async (session) => ({
          notes: await notesRepository.listForSession(session.id).catch(() => []),
          session,
        })),
      )
      setItems(
        notesBySession.flatMap(({ notes, session }) =>
          notes.map((note) => ({ note, session })),
        ),
      )
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    sessionsRepository
      .list()
      .then((sessions) =>
        Promise.all(
          sessions
            .filter((session) => session.status !== 'DELETED')
            .map(async (session) => ({
              notes: await notesRepository.listForSession(session.id).catch(() => []),
              session,
            })),
        ),
      )
      .then((notesBySession) => {
        if (!cancelled) {
          setItems(
            notesBySession.flatMap(({ notes, session }) =>
              notes.map((note) => ({ note, session })),
            ),
          )
        }
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
  }, [notesRepository, sessionsRepository])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR')
    if (!normalized) return items
    return items.filter(
      ({ note, session }) =>
        note.content.toLocaleLowerCase('ko-KR').includes(normalized) ||
        session.materialTitle.toLocaleLowerCase('ko-KR').includes(normalized),
    )
  }, [items, query])

  async function saveNote(noteId: string) {
    if (!editingContent.trim() || isSaving) return
    setIsSaving(true)
    try {
      const updated = await notesRepository.update(noteId, editingContent.trim())
      setItems((current) =>
        current.map((item) =>
          item.note.id === noteId ? { ...item, note: updated } : item,
        ),
      )
      setEditingId(null)
      showToast('노트를 수정했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm('이 노트를 삭제할까요?')) return
    try {
      await notesRepository.delete(noteId)
      setItems((current) => current.filter((item) => item.note.id !== noteId))
      showToast('노트를 삭제했습니다.', 'success')
    } catch (requestError) {
      showToast(getRequestErrorMessage(requestError), 'danger')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        actions={
          <label className="relative w-full min-w-56 sm:w-72">
            <span className="sr-only">노트 검색</span>
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
              size={14}
            />
            <input
              className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-9 type-body outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="노트 검색"
              value={query}
            />
            {query ? (
              <button
                aria-label="검색어 지우기"
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100"
                onClick={() => setQuery('')}
                type="button"
              >
                <X size={13} />
              </button>
            ) : null}
          </label>
        }
        title="내 노트"
        titleAccessory={<p className="type-caption text-stone-400">{items.length}개</p>}
      />

      {isLoading ? (
        <p className="py-16 text-center type-body text-stone-500" role="status">
          노트를 불러오는 중입니다.
        </p>
      ) : null}
      {error ? (
        <EmptyState
          action={<Button onClick={() => void load()}>다시 시도</Button>}
          description={error}
          title="노트를 불러오지 못했습니다"
        />
      ) : null}
      {!isLoading && !error && filteredItems.length === 0 ? (
        <EmptyState
          description={
            query.trim()
              ? '다른 검색어로 다시 찾아보세요.'
              : '학습 중 저장한 AI 답변과 메모가 이곳에 모입니다.'
          }
          title={query.trim() ? '일치하는 노트가 없습니다' : '저장한 노트가 없습니다'}
        />
      ) : null}

      {!error && filteredItems.length > 0 ? (
        <section aria-label="저장한 노트" className="grid gap-3 lg:grid-cols-2">
          {filteredItems.map(({ note, session }) => (
            <article
              className="flex min-h-48 flex-col rounded-lg border border-stone-200 bg-white p-5"
              key={note.id}
            >
              <div className="flex items-center gap-2 type-micro">
                <span className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                  {session.materialTitle}
                </span>
                {note.pageNumber ? (
                  <span className="text-stone-400">{note.pageNumber}쪽</span>
                ) : null}
                <span className="ml-auto rounded-full bg-stone-100 px-2 py-1 font-semibold text-stone-500">
                  {note.sourceMessageId ? 'AI 답변' : '내 메모'}
                </span>
              </div>
              {editingId === note.id ? (
                <textarea
                  aria-label="노트 내용 수정"
                  autoFocus
                  className="mt-4 min-h-24 w-full resize-none rounded-lg border border-stone-300 p-3 type-body leading-6 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => setEditingContent(event.target.value)}
                  value={editingContent}
                />
              ) : (
                <p className="mt-4 line-clamp-4 whitespace-pre-wrap type-body leading-6 text-stone-700">
                  {note.content}
                </p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-4">
                <ButtonLink
                  size="sm"
                  to={sessionDetailPath(session.id)}
                  variant="secondary"
                >
                  <FileText aria-hidden="true" size={13} />
                  자료로 이동
                </ButtonLink>
                <div className="ml-auto flex gap-1">
                  {editingId === note.id ? (
                    <>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="sm"
                        variant="ghost"
                      >
                        취소
                      </Button>
                      <Button
                        disabled={!editingContent.trim() || isSaving}
                        onClick={() => void saveNote(note.id)}
                        size="sm"
                      >
                        저장
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        aria-label="노트 수정"
                        className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                        onClick={() => {
                          setEditingId(note.id)
                          setEditingContent(note.content)
                        }}
                        type="button"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        aria-label="노트 삭제"
                        className="flex size-8 items-center justify-center rounded-md text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => void deleteNote(note.id)}
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </PageContainer>
  )
}
