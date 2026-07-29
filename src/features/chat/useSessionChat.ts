import { useCallback, useEffect, useState } from 'react'

import { ApiClientError } from '../../shared/api'
import type {
  SessionMessage,
  SessionsRepository,
  SessionTurnRequest,
  SessionTurnResult,
} from '../sessions'
import type { ChatMessage } from './chatTypes'

export interface SessionChat {
  appendLocalMessage: (message: ChatMessage) => void
  appendMessages: (messages: SessionMessage[]) => void
  historyError: string | null
  isLoadingHistory: boolean
  isTurnPending: boolean
  messages: ChatMessage[]
  reloadHistory: () => void
  submitTurn: (turn: SessionTurnRequest) => Promise<SessionTurnResult>
}

export function useSessionChat(
  repository: SessionsRepository,
  sessionId: string,
): SessionChat {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isTurnPending, setIsTurnPending] = useState(false)
  const [historyReloadKey, setHistoryReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    repository
      .listMessages(sessionId, controller.signal)
      .then((history) => {
        setMessages(history.map(mapSessionMessage))
        setHistoryError(null)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setHistoryError(getChatErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingHistory(false)
      })

    return () => controller.abort()
  }, [historyReloadKey, repository, sessionId])

  // 향후 SSE 스트리밍(BE#26, GET /api/sessions/{id}/stream)은 이 함수로 메시지를 흘려보낸다.
  const appendMessages = useCallback((incoming: SessionMessage[]) => {
    if (incoming.length === 0) return
    setMessages((current) => [...current, ...incoming.map(mapSessionMessage)])
  }, [])

  const appendLocalMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => [...current, message])
  }, [])

  const reloadHistory = useCallback(() => {
    setHistoryError(null)
    setIsLoadingHistory(true)
    setHistoryReloadKey((key) => key + 1)
  }, [])

  const submitTurn = useCallback(
    async (turn: SessionTurnRequest) => {
      setIsTurnPending(true)
      try {
        const result = await repository.submitTurn(sessionId, turn)
        appendMessages(result.messages)
        return result
      } catch (error) {
        // 스펙 §6: 같은 requestId 재전송은 409 — 메시지 재조회로 최신 상태 복원
        if (
          error instanceof ApiClientError &&
          error.code === 'TURN_ALREADY_PROCESSED'
        ) {
          reloadHistory()
        }
        throw error
      } finally {
        setIsTurnPending(false)
      }
    },
    [appendMessages, reloadHistory, repository, sessionId],
  )

  return {
    appendLocalMessage,
    appendMessages,
    historyError,
    isLoadingHistory,
    isTurnPending,
    messages,
    reloadHistory,
    submitTurn,
  }
}

function mapSessionMessage(message: SessionMessage): ChatMessage {
  return {
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    messageType: message.messageType,
    pageNumber: message.pageNumber,
    role: message.senderType === 'USER' ? 'user' : 'assistant',
    status: 'sent',
  }
}

export function getChatErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '채팅 요청을 처리하지 못했습니다.'
}
