export function getRequestErrorMessage(
  error: unknown,
  fallback = '요청을 처리하는 중 오류가 발생했습니다.',
): string {
  return error instanceof Error ? error.message : fallback
}
