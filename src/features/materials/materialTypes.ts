export type MaterialStatus = 'PROCESSING' | 'READY' | 'FAILED'

export interface StudyMaterial {
  activeSessionId?: string
  createdAt: string
  failureReason?: string
  fileSizeBytes?: number
  id: string
  pageCount?: number
  status: MaterialStatus
  title: string
}
