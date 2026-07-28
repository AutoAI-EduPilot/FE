export type ChatMessageRole = 'assistant' | 'user'
export type ChatMessageStatus = 'sent'

export interface ChatMessage {
  content: string
  id: string
  role: ChatMessageRole
  status: ChatMessageStatus
}
