import type { ChatMessage } from './chatTypes'

let requestSequence = 0

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
  return {
    ...message,
    content: '응답이 취소되었습니다.',
    progress: 0,
    status: 'cancelled',
  }
}

export function retryStreamingReply(message: ChatMessage, requestId: string): ChatMessage {
  return {
    ...message,
    content: '답변을 다시 생성하는 중입니다.',
    progress: 35,
    requestId,
    status: 'streaming',
  }
}

export const initialChatMessages: ChatMessage[] = [
  {
    content: '현재 페이지의 핵심 개념을 질문해 보세요.',
    id: 'system-welcome',
    role: 'system',
    status: 'sent',
  },
]
