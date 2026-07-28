import { RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Markdown from 'react-markdown'

import { Button, Textarea } from '../../shared/ui'
import type { ChatMessage } from './chatTypes'
import { getChatErrorMessage, type SessionChat } from './useSessionChat'

interface ChatPanelProps {
  chat: SessionChat
  sessionId: string
}

export function ChatPanel({ chat, sessionId }: ChatPanelProps) {
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages.length, chat.isTurnPending])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      setError('질문을 입력하세요.')
      return
    }

    if (chat.isTurnPending) return

    const requestId =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `question-${Date.now()}`
    const userMessage: ChatMessage = {
      content: trimmedQuestion,
      id: `user-${requestId}`,
      role: 'user',
      status: 'sent',
    }

    chat.appendLocalMessage(userMessage)
    setQuestion('')
    setError(null)

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

  return (
    <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-stone-950">AI 채팅</h2>
          <p className="mt-1 truncate text-xs text-stone-500">세션 {sessionId}</p>
        </div>
      </div>

      <div
        aria-live="polite"
        className="grid min-h-0 flex-1 content-start gap-3.5 overflow-y-auto px-4 py-4"
        role="log"
      >
        {chat.isLoadingHistory ? (
          <p className="text-sm font-medium text-stone-500" role="status">
            이전 메시지를 불러오는 중입니다.
          </p>
        ) : null}
        {!chat.isLoadingHistory &&
        chat.historyError &&
        chat.messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-rose-700" role="alert">
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
        {!chat.isLoadingHistory &&
        !chat.historyError &&
        chat.messages.length === 0 ? (
          <p className="justify-self-center text-xs text-stone-400">
            아직 대화 기록이 없습니다. 현재 페이지에 대해 질문해 보세요.
          </p>
        ) : null}
        {chat.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {chat.isTurnPending ? (
          <div
            className="mr-auto max-w-[90%] animate-pulse rounded-xl rounded-bl-[4px] bg-stone-100 px-3.5 py-2.5"
            role="status"
          >
            <p className="text-sm leading-6 text-stone-500">
              답변을 작성하는 중입니다…
            </p>
          </div>
        ) : null}
        <div ref={logEndRef} />
      </div>

      <form className="border-t border-stone-200 bg-white p-3" onSubmit={handleSubmit}>
        <Textarea
          disabled={chat.isTurnPending}
          id="chat-question"
          label="질문"
          labelHidden
          onChange={(event) => {
            setQuestion(event.target.value)
            setError(null)
          }}
          placeholder="궁금한 내용을 입력하세요."
          value={question}
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {error ? (
              <p className="text-xs font-medium text-rose-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <Button
            aria-label={chat.isTurnPending ? '응답 대기 중' : '질문 보내기'}
            disabled={chat.isTurnPending}
            size="sm"
            type="submit"
          >
            <Send aria-hidden="true" size={14} />
            {chat.isTurnPending ? '응답 대기 중' : '보내기'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <article className="ml-auto max-w-[85%] rounded-xl rounded-br-[4px] bg-brand-600 px-3.5 py-2.5 text-white">
        <span className="sr-only">내 질문</span>
        <p className="break-words text-sm leading-6">{message.content}</p>
      </article>
    )
  }

  return (
    <article className="mr-auto max-w-[90%] rounded-xl rounded-bl-[4px] bg-stone-100 px-3.5 py-2.5 text-stone-900">
      <span className="sr-only">AI 답변</span>
      <div className="break-words text-sm leading-6 [&_a]:text-brand-600 [&_a]:underline [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-white [&_pre]:p-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5">
        <Markdown>{message.content}</Markdown>
      </div>
    </article>
  )
}
