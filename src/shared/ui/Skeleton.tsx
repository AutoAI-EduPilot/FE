import { cx } from '../lib/cx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-lg bg-stone-200', className)}
    />
  )
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-stone-100">
      {Array.from({ length: count }, (_, index) => (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5" key={index}>
          <Skeleton className="size-9 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
