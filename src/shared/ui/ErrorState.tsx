import type { ReactNode } from 'react'

export interface ErrorStateProps {
  action?: ReactNode
  description: string
  title: string
}

export function ErrorState({ action, description, title }: ErrorStateProps) {
  return (
    <section
      className="rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm"
      role="alert"
    >
      <h1 className="text-xl font-bold text-zinc-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  )
}
