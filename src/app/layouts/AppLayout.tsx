import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  FileText,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Monitor,
  Megaphone,
  Moon,
  Settings,
  Sun,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { getRoleLabel, isInstructorRole, useAuth } from '../../features/auth'
import { cx } from '../../shared/lib/cx'
import { useTheme, type ThemeMode } from '../../shared/theme'
import { useToast } from '../../shared/ui'
import { routes } from '../routes'

const learnerNavigation: Array<{
  icon: LucideIcon
  label: string
  to: string
}> = [
  { icon: LayoutGrid, label: '내 강의실', to: routes.classrooms },
  { icon: FileText, label: '자료', to: routes.materials },
  { icon: GraduationCap, label: '세션', to: routes.sessions },
]

const instructorNavigation: Array<{
  icon: LucideIcon
  label: string
  to: string
}> = [
  { icon: LayoutGrid, label: '내 강의실', to: routes.classrooms },
  { icon: CalendarDays, label: '캘린더', to: routes.calendar },
  { icon: BarChart3, label: '학습 현황', to: routes.learningStatus },
  { icon: Megaphone, label: '공지 관리', to: routes.announcements },
  { icon: UserPlus, label: '입장 요청', to: routes.entranceRequests },
]

export function AppLayout() {
  const { logout, user } = useAuth()
  const { mode, setMode } = useTheme()
  const { show: showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const isStudyWorkspace = /^\/sessions\/[^/]+\/?$/.test(location.pathname)
  const [sidebarPreference, setSidebarPreference] = useState<{
    isCollapsed: boolean
    pathname: string
  } | null>(null)
  const isCollapsed =
    sidebarPreference?.pathname === location.pathname
      ? sidebarPreference.isCollapsed
      : isStudyWorkspace
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuContainerRef = useRef<HTMLDivElement | null>(null)
  const roleLabel = getRoleLabel(user?.role)
  const primaryNavigation = isInstructorRole(user?.role)
    ? instructorNavigation
    : learnerNavigation

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
      className="w-60 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg dark:bg-stone-50"
      role="menu"
    >
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-2.5 py-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
          {user?.name?.slice(0, 1) ?? '?'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-stone-800">
            {user?.name}
          </p>
          <p className="truncate text-[11px] text-stone-400">
            {user?.email} · {roleLabel}
          </p>
        </div>
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
        onClick={() =>
          showToast('도움말과 피드백 채널은 준비 중입니다.', 'info')
        }
        role="menuitem"
        type="button"
      >
        <CircleHelp aria-hidden="true" size={15} />
        도움말 · 피드백
      </button>
      <div className="flex h-10 items-center gap-2.5 px-2.5 text-[13.5px] font-medium text-stone-700">
        <Monitor aria-hidden="true" size={15} />
        <span>화면 모드</span>
        <div
          aria-label="화면 모드"
          className="ml-auto inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5"
          role="group"
        >
          {themeOptions.map((option) => (
            <button
              aria-label={option.label}
              aria-pressed={mode === option.value}
              className={cx(
                'flex size-6 items-center justify-center rounded-md text-stone-400',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                mode === option.value
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-300'
                  : 'hover:text-stone-700',
              )}
              key={option.value}
              onClick={() => setMode(option.value)}
              title={option.label}
              type="button"
            >
              <option.icon aria-hidden="true" size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="mx-2 my-1 h-px bg-stone-100" />
      <button
        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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
    <div
      className={cx(
        'bg-white text-stone-900 dark:bg-[#1b1c20] lg:flex',
        isStudyWorkspace ? 'h-dvh overflow-hidden' : 'min-h-screen',
      )}
    >
      <aside
        className={cx(
          'flex border-b border-stone-200 bg-stone-100 px-4 py-3 dark:bg-[#222327] lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:py-4',
          isCollapsed ? 'lg:w-14 lg:px-2' : 'lg:w-50 lg:px-3',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 lg:block lg:flex-none">
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
              to={routes.classrooms}
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
              onClick={() =>
                setSidebarPreference({
                  isCollapsed: !isCollapsed,
                  pathname: location.pathname,
                })
              }
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
            className="order-2 mt-3 flex w-full gap-1 overflow-x-auto lg:mt-6 lg:ml-0 lg:w-auto lg:flex-col lg:gap-0.5"
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
                {roleLabel}
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

      <main
        className={cx(
          'min-w-0 flex-1',
          isStudyWorkspace
            ? 'h-[calc(100dvh-61px)] overflow-hidden p-0 lg:h-dvh'
            : 'px-4 py-5 sm:px-6 lg:px-10 lg:py-8',
        )}
      >
        <div
          className={
            isStudyWorkspace
              ? 'h-full min-h-0'
              : 'mx-auto w-full max-w-[1600px]'
          }
        >
          <Outlet />
        </div>
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
      ? 'bg-white font-semibold text-stone-900 shadow-sm dark:bg-stone-200'
      : 'font-medium text-stone-500 hover:bg-white/60 hover:text-stone-800',
  )
}

const themeOptions: Array<{
  icon: LucideIcon
  label: string
  value: ThemeMode
}> = [
  { icon: Sun, label: '라이트 모드', value: 'light' },
  { icon: Moon, label: '다크 모드', value: 'dark' },
  { icon: Monitor, label: '시스템 설정', value: 'system' },
]
