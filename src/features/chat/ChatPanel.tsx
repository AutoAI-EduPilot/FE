import {
  ArrowUp,
  FileText,
  NotebookPen,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import Markdown from 'react-markdown'

import { cx } from '../../shared/lib/cx'
import { getRequestErrorMessage } from '../../shared/api'
import { formatTime } from '../../shared/lib/format'
import { Button } from '../../shared/ui'
import type { AuthenticatedRequest } from '../auth'
import { createNotesRepository, type Note } from '../notes'
import type { ChatMessage } from './chatTypes'
import { getChatErrorMessage, type SessionChat } from './useSessionChat'

interface ChatPanelProps {
  chat: SessionChat
  className?: string
  currentPage?: number
  /** 서버 위젯·퀴즈 유형 선택 등 대화 흐름에 붙는 액션 (입력창 바로 위) */
  footer?: ReactNode
  /** 시안 빠른 칩의 "퀴즈 내줘" — 세션 화면의 유형 선택(W4)을 연다. */
  onRequestQuiz?: () => void
  request?: AuthenticatedRequest
  sessionId: string
}

/** 시안 4d의 빠른 액션 칩 */
const QUICK_ACTIONS = [
  { kind: 'note', label: '노트에 저장' },
  { kind: 'quiz', label: '퀴즈 내줘' },
  { kind: 'prompt', label: '쉽게 설명해줘' },
] as const

function createRequestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `question-${Date.now()}`
}

export function ChatPanel({
  chat,
  className,
  currentPage,
  footer,
  onRequestQuiz,
  request,
  sessionId,
}: ChatPanelProps) {
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'chat' | 'notes'>('chat')
  const [notes, setNotes] = useState<Note[]>([])
  const [notesError, setNotesError] = useState<string | null>(null)
  const [hiddenMessageCount, setHiddenMessageCount] = useState(0)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isPageAttached, setIsPageAttached] = useState(true)
  const logEndRef = useRef<HTMLDivElement | null>(null)
  const notesRepository = useMemo(
    () => request ? createNotesRepository(request) : null,
    [request],
  )

  useEffect(() => {
    if (!notesRepository) return
    let cancelled = false
    notesRepository.listForSession(sessionId).then((items) => { if (!cancelled) setNotes(items) }).catch((requestError) => {
      if (!cancelled) setNotesError(getRequestErrorMessage(requestError))
    })
    return () => { cancelled = true }
  }, [notesRepository, sessionId])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages.length, chat.isTurnPending])

  async function sendQuestion(text: string) {
    const trimmedQuestion = text.trim()
    if (!trimmedQuestion) {
      setError('질문을 입력하세요.')
      return
    }

    if (chat.isTurnPending) return

    const requestId = createRequestId()

    chat.appendLocalMessage({
      content: trimmedQuestion,
      id: `user-${requestId}`,
      role: 'user',
      status: 'sent',
    })
    setQuestion('')
    setError(null)
    setIsPageAttached(true)

    try {
      await chat.submitTurn({
        eventType: 'USER_QUESTION',
        payload: { message: trimmedQuestion },
        requestId,
      })
    } catch (requestError) {
      setError(getChatErrorMessage(requestError))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendQuestion(question)
  }

  function handleQuickAction(kind: (typeof QUICK_ACTIONS)[number]['kind']) {
    if (kind === 'quiz') {
      onRequestQuiz?.()
      return
    }
    if (kind === 'prompt') {
      void sendQuestion('쉽게 설명해줘')
      return
    }

    const lastAnswer = [...visibleMessages]
      .reverse()
      .find((message) => message.role === 'assistant')
    if (!lastAnswer) return
    void saveNote(lastAnswer.content, lastAnswer.pageNumber)
  }

  async function saveNote(content: string, pageNumber?: number) {
    if (!notesRepository) {
      setNotes((current) => [...current, { content, id: `local-${Date.now()}`, pageNumber }])
      setTab('notes')
      return
    }
    try {
      const note = await notesRepository.createForSession(sessionId, { content, pageNumber })
      setNotes((current) => [...current, note])
      setNotesError(null)
      setTab('notes')
    } catch (requestError) { setNotesError(getRequestErrorMessage(requestError)); setTab('notes') }
  }

  async function startNewConversation() {
    if (isStartingConversation || chat.isTurnPending) return
    setIsStartingConversation(true)
    try {
      await chat.startNewConversation()
      setHiddenMessageCount(0)
      setError(null)
    } catch (requestError) {
      setError(getChatErrorMessage(requestError))
    } finally {
      setIsStartingConversation(false)
    }
  }

  async function removeNote(id: string) {
    if (!notesRepository) { setNotes((current) => current.filter((note) => note.id !== id)); return }
    try { await notesRepository.delete(id); setNotes((current) => current.filter((note) => note.id !== id)); setNotesError(null) }
    catch (requestError) { setNotesError(getRequestErrorMessage(requestError)) }
  }

  const visibleMessages = chat.messages.slice(hiddenMessageCount)
  const hasAssistantReply = visibleMessages.some(
    (message) => message.role === 'assistant',
  )

  return (
    <section
      className={cx(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white',
        className,
      )}
    >
      <div className="flex h-13 shrink-0 items-center gap-1 border-b border-stone-200 px-3">
        <PanelTab
          isActive={tab === 'chat'}
          label="AI 채팅"
          onSelect={() => setTab('chat')}
        />
        <PanelTab
          count={notes.length}
          isActive={tab === 'notes'}
          label="내 노트"
          onSelect={() => setTab('notes')}
        />
        <span className="sr-only">세션 {sessionId}</span>
        <button
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 type-caption text-stone-400 hover:bg-stone-50 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          disabled={isStartingConversation || chat.isTurnPending}
          onClick={() => void startNewConversation()}
          title="새 대화를 시작합니다. 이전 대화는 서버에 보관됩니다."
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />
          {isStartingConversation ? '시작 중' : '대화 새로 시작'}
        </button>
      </div>

      {tab === 'notes' ? (
        <NotesPanel
          notes={notes}
          error={notesError}
          onRemove={(id) => void removeNote(id)}
        />
      ) : (
        <>
      <div
        aria-live="polite"
        className="grid min-h-0 flex-1 content-start gap-3.5 overflow-y-auto px-4 py-4"
        role="log"
      >
        <p className="justify-self-center text-center type-caption text-stone-400">
          보고 있는 페이지를 함께 읽고 답변해요
        </p>

        {chat.isLoadingHistory ? (
          <p className="type-body font-medium text-stone-500" role="status">
            이전 메시지를 불러오는 중입니다.
          </p>
        ) : null}

        {!chat.isLoadingHistory &&
        chat.historyError &&
        chat.messages.length === 0 ? (
          <div className="space-y-2">
            <p className="type-body font-medium text-rose-700" role="alert">
              {chat.historyError}
            </p>
            <Button
              onClick={chat.reloadHistory}
              size="sm"
              type="button"
              variant="secondary"
            >
              <RotateCcw aria-hidden="true" size={13} />
              다시 시도
            </Button>
          </div>
        ) : null}

        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSaveNote={
              message.role === 'assistant'
                ? () =>
                    void saveNote(message.content, message.pageNumber)
                : undefined
            }
          />
        ))}

        {chat.isTurnPending ? (
          <div
            className="mr-auto max-w-[90%] animate-pulse rounded-xl rounded-bl-[4px] bg-stone-100 px-3.5 py-2.5"
            role="status"
          >
            <p className="type-body leading-6 text-stone-500">
              {chat.streamNotice ?? '답변을 작성하는 중입니다…'}
            </p>
          </div>
        ) : null}

        <div ref={logEndRef} />
      </div>

      {hasAssistantReply && !chat.isTurnPending ? (
        <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              className="flex h-7.5 items-center rounded-full border border-stone-200 px-3 type-caption font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              key={action.kind}
              onClick={() => handleQuickAction(action.kind)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {footer ? <div className="shrink-0 px-4 pb-1">{footer}</div> : null}

      <form className="shrink-0 p-3" onSubmit={handleSubmit}>
        {currentPage && isPageAttached ? (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 type-caption text-stone-500">
            <FileText aria-hidden="true" size={12} />
            현재 페이지 첨부됨 · {currentPage}쪽
            <button
              aria-label="현재 페이지 첨부 해제"
              className="rounded text-stone-400 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onClick={() => setIsPageAttached(false)}
              type="button"
            >
              <X aria-hidden="true" size={11} />
            </button>
          </p>
        ) : null}

        <div
          className={cx(
            'flex items-end gap-2 rounded-xl border bg-stone-50 p-2',
            'focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100',
            error ? 'border-rose-400' : 'border-stone-200',
          )}
        >
          <label className="sr-only" htmlFor="chat-question">
            질문
          </label>
          <textarea
            aria-invalid={error ? true : undefined}
            className="min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1.5 type-body text-stone-950 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed"
            disabled={chat.isTurnPending}
            id="chat-question"
            onChange={(event) => {
              setQuestion(event.target.value)
              setError(null)
            }}
            placeholder="현재 페이지에 대해 질문…"
            rows={1}
            value={question}
          />
          <button
            aria-label={chat.isTurnPending ? '응답 대기 중' : '질문 보내기'}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={chat.isTurnPending}
            type="submit"
          >
            <ArrowUp aria-hidden="true" size={16} />
          </button>
        </div>

        {error ? (
          <p className="mt-1.5 type-caption font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
      </form>
        </>
      )}
    </section>
  )
}

function PanelTab({
  count,
  isActive,
  label,
  onSelect,
}: {
  count?: number
  isActive: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      aria-selected={isActive}
      className={cx(
        'flex h-8 items-center gap-1.5 rounded-lg px-2.5 type-control',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        isActive
          ? 'bg-brand-50 font-semibold text-brand-700'
          : 'font-medium text-stone-400 hover:text-stone-600',
      )}
      onClick={onSelect}
      role="tab"
      type="button"
    >
      {label}
      {count ? (
        <span className="rounded-full bg-stone-100 px-1.5 type-micro font-semibold text-stone-500">
          {count}
        </span>
      ) : null}
    </button>
  )
}

function NotesPanel({
  notes,
  error,
  onRemove,
}: {
  notes: Note[]
  error: string | null
  onRemove: (id: string) => void
}) {
  if (notes.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <NotebookPen aria-hidden="true" className="text-stone-300" size={26} />
        {error ? <p className="type-caption font-medium text-rose-700" role="alert">{error}</p> : null}
        <p className="type-body font-semibold text-stone-500">
          저장한 노트가 없습니다.
        </p>
        <p className="type-caption text-stone-400">
          AI 답변의 &lsquo;노트에 저장&rsquo;을 눌러 정리해 보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto px-4 py-4">
      {error ? <p className="type-caption font-medium text-rose-700" role="alert">{error}</p> : null}
      {notes.map((note) => (
        <article
          className="rounded-xl border border-stone-200 px-3.5 py-2.5"
          key={note.id}
        >
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words type-body leading-6 text-stone-800">
              {note.content}
            </p>
            <button
              aria-label="노트 삭제"
              className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onClick={() => onRemove(note.id)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
            </button>
          </div>
          {note.pageNumber ? (
            <p className="mt-1.5 type-caption font-semibold text-brand-700">
              {note.pageNumber}쪽
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function MessageBubble({
  message,
  onSaveNote,
}: {
  message: ChatMessage
  onSaveNote?: () => void
}) {
  const time = message.createdAt ? formatTime(message.createdAt) : ''

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        <article className="max-w-[85%] rounded-xl rounded-br-[4px] bg-brand-600 px-3.5 py-2.5 text-white">
          <span className="sr-only">내 질문</span>
          <p className="break-words type-body leading-6">{message.content}</p>
        </article>
        {time ? <span className="type-micro text-stone-400">{time}</span> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <article className="max-w-[90%] rounded-xl rounded-bl-[4px] bg-stone-100 px-3.5 py-2.5 text-stone-900">
        <span className="sr-only">AI 답변</span>
        <div className="break-words type-body leading-6 [&_a]:text-brand-600 [&_a]:underline [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:py-0.5 [&_code]:type-control [&_h1]:mt-2 [&_h1]:type-section-title [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:type-body [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-white [&_pre]:p-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5">
          <Markdown>{message.content}</Markdown>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {message.pageNumber ? (
            <p className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 type-caption font-semibold text-brand-700">
              <FileText aria-hidden="true" size={12} />
              {message.pageNumber}쪽 참조
            </p>
          ) : null}
          {onSaveNote ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 type-caption font-semibold text-stone-500 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onClick={onSaveNote}
              type="button"
            >
              <NotebookPen aria-hidden="true" size={12} />
              노트에 저장
            </button>
          ) : null}
        </div>
      </article>
      {time ? <span className="type-micro text-stone-400">{time}</span> : null}
    </div>
  )
}
