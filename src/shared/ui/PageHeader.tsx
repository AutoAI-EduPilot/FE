import type { ReactNode } from 'react'

export interface PageHeaderProps {
  actions?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold text-brand-700 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 break-words text-2xl font-bold text-stone-950">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
