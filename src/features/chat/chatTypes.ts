export type ChatMessageRole = 'assistant' | 'system' | 'user'
export type ChatMessageStatus = 'cancelled' | 'sent' | 'streaming'

export interface ChatMessage {
  content: string
  id: string
  progress?: number
  requestId?: string
  role: ChatMessageRole
  status: ChatMessageStatus
}
