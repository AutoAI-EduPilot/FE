export type ChatMessageRole = 'assistant' | 'user'
export type ChatMessageStatus = 'sent' | 'streaming'

export interface ChatMessage {
  content: string
  createdAt?: string
  id: string
  messageType?: string
  pageNumber?: number
  role: ChatMessageRole
  status: ChatMessageStatus
}
