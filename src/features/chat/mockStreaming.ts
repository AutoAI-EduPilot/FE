import type { ChatMessage } from './chatTypes'

let requestSequence = 0
const streamControllers = new Map<string, AbortController>()

export function createRequestId(now = Date.now()): string {
  requestSequence += 1
  return `req-${now}-${requestSequence}`
}

export function createUserMessage(content: string): ChatMessage {
  return {
    content,
    id: `user-${Date.now()}-${content.length}`,
    role: 'user',
    status: 'sent',
  }
}

export function createStreamingReply(requestId: string): ChatMessage {
  streamControllers.set(requestId, new AbortController())

  return {
    content: '답변을 생성하는 중입니다.',
    id: `assistant-${requestId}`,
    progress: 35,
    requestId,
    role: 'assistant',
    status: 'streaming',
  }
}

export function cancelStreamingReply(message: ChatMessage): ChatMessage {
  if (message.requestId) {
    streamControllers.get(message.requestId)?.abort()
  }

  return {
    ...message,
    content: '응답이 취소되었습니다.',
    progress: 0,
    status: 'cancelled',
  }
}

export function retryStreamingReply(message: ChatMessage, requestId: string): ChatMessage {
  streamControllers.set(requestId, new AbortController())

  return {
    ...message,
    content: '답변을 다시 생성하는 중입니다.',
    progress: 35,
    requestId,
    status: 'streaming',
  }
}

export function advanceStreamingReply(message: ChatMessage): ChatMessage {
  if (message.status !== 'streaming') {
    return message
  }

  const nextProgress = Math.min((message.progress ?? 0) + 35, 100)

  if (nextProgress >= 100) {
    if (message.requestId) {
      streamControllers.delete(message.requestId)
    }

    return {
      ...message,
      content: '현재 페이지의 핵심 개념을 예시와 함께 정리했습니다.',
      progress: 100,
      status: 'sent',
    }
  }

  return {
    ...message,
    content: '답변을 이어서 생성하는 중입니다.',
    progress: nextProgress,
  }
}

export function isMockStreamAborted(requestId: string): boolean {
  return streamControllers.get(requestId)?.signal.aborted ?? false
}

export function resetMockStreamingState(): void {
  requestSequence = 0
  streamControllers.clear()
}

export const initialChatMessages: ChatMessage[] = [
  {
    content: '현재 페이지의 핵심 개념을 질문해 보세요.',
    id: 'system-welcome',
    role: 'system',
    status: 'sent',
  },
]
