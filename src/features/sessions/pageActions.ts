import type { UiAction } from './sessionTypes'

export function movePage(nextPage: number, totalPages: number): number {
  return clampPage(nextPage, totalPages)
}

export function applyUiActionToPage(
  action: UiAction,
  currentPage: number,
  totalPages: number,
): number {
  if (action.kind === 'MOVE_NEXT_PAGE') {
    return clampPage(currentPage + (action.step ?? 1), totalPages)
  }

  return currentPage
}

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), totalPages)
}
