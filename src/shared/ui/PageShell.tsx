import type { PropsWithChildren } from 'react'

export function PageShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen px-5 py-16 sm:px-8">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/80 bg-white/70 p-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-12">
        {children}
      </section>
    </main>
  )
}
