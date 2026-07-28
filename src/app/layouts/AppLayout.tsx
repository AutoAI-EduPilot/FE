import {
  BookOpenCheck,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  GraduationCap,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import { cx } from '../../shared/lib/cx'
import { routes } from '../routes'

const primaryNavigation: Array<{ icon: LucideIcon; label: string; to: string }> = [
  { icon: FileText, label: '자료', to: routes.materials },
  { icon: GraduationCap, label: '세션', to: routes.sessions },
]

export function AppLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !menuContainerRef.current?.contains(target) &&
        !mobileMenuContainerRef.current?.contains(target)
      ) {
        setIsMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  async function handleLogout() {
    setIsMenuOpen(false)
    await logout()
    navigate(routes.login, { replace: true })
  }

  function openSettings() {
    setIsMenuOpen(false)
    navigate(routes.settings)
  }

  const profileMenu = (
    <div
      className="w-48 rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
      role="menu"
    >
      <div className="border-b border-stone-100 px-2.5 py-2">
        <p className="truncate text-[13px] font-semibold text-stone-800">
          {user?.name}
        </p>
        <p className="truncate text-[11px] text-stone-400">{user?.email}</p>
      </div>
      <button
        className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        onClick={openSettings}
        role="menuitem"
        type="button"
      >
        <Settings aria-hidden="true" size={15} />
        설정
      </button>
      <button
        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        onClick={() => void handleLogout()}
        role="menuitem"
        type="button"
      >
        <LogOut aria-hidden="true" size={15} />
        로그아웃
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-stone-900 lg:flex">
      <aside
        className={cx(
          'flex border-b border-stone-200 bg-stone-100 px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:py-4',
          isCollapsed ? 'lg:w-14 lg:px-2' : 'lg:w-50 lg:px-3',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:block lg:flex-none">
          <div
            className={cx(
              'flex items-center justify-between gap-2',
              isCollapsed && 'lg:flex-col lg:gap-3',
            )}
          >
            <Link
              className={cx(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600',
                isCollapsed && 'lg:justify-center lg:px-0',
              )}
              to={routes.materials}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-brand-600 text-white">
                <BookOpenCheck aria-hidden="true" size={16} />
              </span>
              <span
                className={cx('text-[15px] font-bold', isCollapsed && 'lg:hidden')}
              >
                EduPilot
              </span>
            </Link>
            <button
              aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              className="hidden size-7 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-white hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:flex"
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
              title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              type="button"
            >
              {isCollapsed ? (
                <ChevronsRight aria-hidden="true" size={15} />
              ) : (
                <ChevronsLeft aria-hidden="true" size={15} />
              )}
            </button>
          </div>

          <nav
            aria-label="주요 메뉴"
            className="ml-auto flex gap-1 overflow-x-auto lg:mt-6 lg:ml-0 lg:flex-col lg:gap-0.5"
          >
            {primaryNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navLinkClassName(isActive, isCollapsed)}
                title={item.label}
              >
                <item.icon aria-hidden="true" className="shrink-0" size={16} />
                <span className={cx(isCollapsed && 'lg:sr-only')}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="relative ml-2 shrink-0 lg:hidden" ref={mobileMenuContainerRef}>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="프로필 메뉴"
            className="flex size-9 items-center justify-center rounded-full bg-stone-200 text-[12px] font-semibold text-stone-600 hover:bg-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {user?.name?.slice(0, 1) ?? '?'}
          </button>
          {isMenuOpen ? (
            <div className="absolute top-[calc(100%+8px)] right-0 z-30 lg:hidden">
              {profileMenu}
            </div>
          ) : null}
        </div>

        <div
          className="relative hidden lg:mt-auto lg:block"
          ref={menuContainerRef}
        >
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="프로필 메뉴"
            className={cx(
              'flex w-full items-center gap-2.5 rounded-lg border-t border-transparent p-1.5 text-left hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              isCollapsed && 'justify-center p-1',
            )}
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-semibold text-stone-600">
              {user?.name?.slice(0, 1) ?? '?'}
            </span>
            <span className={cx('min-w-0 flex-1', isCollapsed && 'lg:hidden')}>
              <span className="block truncate text-[13px] font-semibold text-stone-800">
                {user?.name}
              </span>
              <span className="block truncate text-[11px] text-stone-400">
                {user?.email}
              </span>
            </span>
          </button>
          {isMenuOpen ? (
            <div
              className={cx(
                'absolute z-30 hidden lg:block',
                isCollapsed
                  ? 'bottom-0 left-[calc(100%+8px)]'
                  : 'bottom-[calc(100%+8px)] left-0',
              )}
            >
              {profileMenu}
            </div>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function navLinkClassName(isActive: boolean, isCollapsed: boolean): string {
  return cx(
    'inline-flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[13.5px]',
    isCollapsed && 'lg:w-9 lg:justify-center lg:px-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    isActive
      ? 'bg-white font-semibold text-stone-900 shadow-sm'
      : 'font-medium text-stone-500 hover:bg-white/60 hover:text-stone-800',
  )
}
