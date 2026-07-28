export function movePage(nextPage: number, totalPages: number): number {
  return Math.min(Math.max(nextPage, 1), totalPages)
}
