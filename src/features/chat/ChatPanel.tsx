import { useState, type FormEvent } from 'react'

import { Button } from '../../shared/ui'
import type { ChatMessage } from './chatTypes'
import {
  cancelStreamingReply,
  createRequestId,
  createStreamingReply,
  createUserMessage,
  initialChatMessages,
  retryStreamingReply,
} from './mockStreaming'

interface ChatPanelProps {
  sessionId: string
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      setError('질문을 입력하세요.')
      return
    }

    const requestId = createRequestId()
    setMessages((current) => [
      ...current,
      createUserMessage(trimmedQuestion),
      createStreamingReply(requestId),
    ])
    setQuestion('')
    setError(null)
  }

  function cancelStream(messageId: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? cancelStreamingReply(message) : message,
      ),
    )
  }

  function retryStream(messageId: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? retryStreamingReply(message, createRequestId())
          : message,
      ),
    )
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <div>
          <h2 className="text-lg font-bold text-zinc-950">학습 채팅</h2>
          <p className="mt-1 text-sm text-zinc-600">세션 {sessionId} 질문 타임라인</p>
        </div>
      </div>

      <div className="mt-5 grid max-h-[460px] gap-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCancel={() => cancelStream(message.id)}
            onRetry={() => retryStream(message.id)}
          />
        ))}
      </div>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-zinc-800" htmlFor="chat-question">
          질문
        </label>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
          id="chat-question"
          onChange={(event) => {
            setQuestion(event.target.value)
            setError(null)
          }}
          placeholder="궁금한 내용을 입력하세요."
          value={question}
        />
        {error ? (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit">질문 보내기</Button>
      </form>
    </section>
  )
}

function MessageBubble({
  message,
  onCancel,
  onRetry,
}: {
  message: ChatMessage
  onCancel: () => void
  onRetry: () => void
}) {
  const isUser = message.role === 'user'

  return (
    <article
      className={[
        'rounded-lg border p-3',
        isUser
          ? 'ml-auto max-w-[85%] border-teal-200 bg-teal-50 text-teal-950'
          : 'mr-auto max-w-[85%] border-zinc-200 bg-zinc-50 text-zinc-900',
      ].join(' ')}
    >
      <p className="text-xs font-semibold uppercase text-zinc-500">{message.role}</p>
      <p className="mt-1 text-sm leading-6">{message.content}</p>
      {message.requestId ? (
        <p className="mt-2 text-xs font-medium text-zinc-500">requestId {message.requestId}</p>
      ) : null}
      {message.status === 'streaming' ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${message.progress ?? 0}%` }}
            />
          </div>
          <Button className="mt-3" onClick={onCancel} size="sm" type="button" variant="secondary">
            응답 취소
          </Button>
        </div>
      ) : null}
      {message.status === 'cancelled' ? (
        <Button className="mt-3" onClick={onRetry} size="sm" type="button">
          다시 시도
        </Button>
      ) : null}
    </article>
  )
}
