import type { ReactNode } from 'react'

export interface PageHeaderProps {
  actions?: ReactNode
  title: string
}

export function PageHeader({ actions, title }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="min-w-0 break-words text-[22px] font-bold text-stone-950">
        {title}
      </h1>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
