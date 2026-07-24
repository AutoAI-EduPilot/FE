import { Link, Outlet } from 'react-router-dom'

import { routes } from '../routes'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <Link
          to={routes.materials}
          className="text-xl font-bold text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          EduPilot
        </Link>
        <div className="mt-6">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
