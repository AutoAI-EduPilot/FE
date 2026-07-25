import type { LearningSession, UiAction } from './sessionTypes'

export const mockSessions: LearningSession[] = [
  {
    currentPage: 1,
    id: 'session-100',
    lastActivityAt: '2026-07-23 22:10',
    materialTitle: '시험 대비 요약.pdf',
    status: 'ACTIVE',
    totalPages: 5,
  },
  {
    currentPage: 7,
    id: 'session-101',
    lastActivityAt: '2026-07-22 19:30',
    materialTitle: '강의 노트 5주차.pdf',
    status: 'PAUSED',
    totalPages: 12,
  },
  {
    currentPage: 16,
    id: 'session-102',
    lastActivityAt: '2026-07-20 15:45',
    materialTitle: '중간고사 개념 정리.pdf',
    status: 'COMPLETED',
    totalPages: 16,
  },
]

export const mockUiActions: UiAction[] = [
  {
    kind: 'MOVE_NEXT_PAGE',
    label: '다음 페이지로',
    step: 1,
  },
  {
    durationMs: 800,
    kind: 'WAIT',
    label: '잠시 생각하기',
  },
]

export function findMockSession(sessionId: string | undefined): LearningSession | undefined {
  return mockSessions.find((session) => session.id === sessionId)
}
