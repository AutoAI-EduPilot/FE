import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import { Badge, Button } from '../../shared/ui'
import { routes } from '../routes'

const primaryNavigation = [
  { label: '자료', to: routes.materials },
  { label: '세션', to: routes.sessions },
]

export function AppLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate(routes.login, { replace: true })
  }

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-white px-4 py-4 lg:w-64 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div>
              <p className="text-xl font-bold">EduPilot</p>
              <p className="mt-1 text-sm text-zinc-500">FE Foundation</p>
            </div>
            <Badge tone="info">FE#1</Badge>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col" aria-label="주요 메뉴">
            {primaryNavigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-5 border-t border-zinc-200 pt-5">
            <p className="text-xs font-semibold text-zinc-500">계정</p>
            <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
              <p className="mt-1 break-all text-xs text-zinc-500">{user?.email}</p>
              <Button
                className="mt-3 w-full"
                onClick={handleLogout}
                size="sm"
                type="button"
                variant="secondary"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  const activeClass = isActive
    ? 'border-teal-600 bg-teal-50 text-teal-800'
    : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950'

  return [
    'shrink-0 rounded-lg border px-3 py-2 text-sm font-medium',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
    activeClass,
  ].join(' ')
}
