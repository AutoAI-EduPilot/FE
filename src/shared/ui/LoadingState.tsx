export interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = '불러오는 중입니다.' }: LoadingStateProps) {
  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600 shadow-sm"
      role="status"
    >
      {message}
    </div>
  )
}
