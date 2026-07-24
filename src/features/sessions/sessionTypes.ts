export type LearningSessionStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED'

export interface LearningSession {
  currentPage: number
  id: string
  lastActivityAt: string
  materialTitle: string
  status: LearningSessionStatus
  totalPages: number
}

export type UiAction =
  | {
      kind: 'MOVE_NEXT_PAGE'
      label: string
      step?: number
    }
  | {
      durationMs: number
      kind: 'WAIT'
      label: string
    }
