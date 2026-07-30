import type { PropsWithChildren } from 'react'

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export interface BadgeProps {
  tone?: BadgeTone
}

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={[
        'inline-flex min-h-6 items-center rounded-lg border px-2 py-0.5 text-xs font-semibold',
        toneClasses[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-stone-200 bg-stone-50 text-stone-700',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
}
