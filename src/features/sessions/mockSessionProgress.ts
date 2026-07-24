import type { LearningSession } from './sessionTypes'

const lastPageBySessionId = new Map<string, number>()

export function restoreLastPage(session: LearningSession): number {
  return lastPageBySessionId.get(session.id) ?? session.currentPage
}

export function saveLastPage(sessionId: string, page: number): void {
  lastPageBySessionId.set(sessionId, page)
}

export function resetMockSessionProgress(): void {
  lastPageBySessionId.clear()
}
