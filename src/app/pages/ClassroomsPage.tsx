import {
  ArrowDownUp,
  Check,
  DoorOpen,
  Plus,
  Search,
  X,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import { isInstructorRole, useAuth } from '../../features/auth'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { Button, PageContainer, useToast } from '../../shared/ui'
import { InstructorClassroomsPage } from './instructor/InstructorClassroomsPage'

type ClassroomSort = 'name' | 'progress' | 'recent' | 'unread'

const sortOptions: Array<{ label: string; value: ClassroomSort }> = [
  { label: '최근 학습순', value: 'recent' },
  { label: '이름순', value: 'name' },
  { label: '진도 낮은 순', value: 'progress' },
  { label: '새 자료 우선', value: 'unread' },
]

export function ClassroomsPage() {
  const { user } = useAuth()

  return isInstructorRole(user?.role) ? (
    <InstructorClassroomsPage />
  ) : (
    <LearnerClassroomsPage />
  )
}

function LearnerClassroomsPage() {
  usePageTitle('내 강의실')
  const { show: showToast } = useToast()
  const [sort, setSort] = useState<ClassroomSort>('recent')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const joinInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
        setIsJoinOpen(false)
        setIsSortOpen(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (isJoinOpen) joinInputRef.current?.focus()
  }, [isJoinOpen])

  function submitInviteCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inviteCode.trim()) return
    showToast(
      '초대 코드 참여 API가 준비되면 이 코드로 참여를 요청합니다.',
      'info',
    )
  }

  const selectedSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ??
    '최근 학습순'

  return (
    <PageContainer>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-bold text-stone-950">내 강의실</h1>
          <p className="text-xs text-stone-400">
            {getAcademicTermLabel()} · 0개
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="강의실 검색"
            className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-left text-sm text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:min-w-72 xl:flex-none"
            onClick={() => setIsSearchOpen(true)}
            type="button"
          >
            <Search aria-hidden="true" size={15} />
            <span className="flex-1">강의실 검색</span>
            <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-400">
              Ctrl K
            </kbd>
          </button>

          <div className="relative">
            <button
              aria-expanded={isSortOpen}
              aria-haspopup="menu"
              className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:border-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onClick={() => setIsSortOpen((open) => !open)}
              type="button"
            >
              <ArrowDownUp aria-hidden="true" size={14} />
              {selectedSortLabel}
            </button>
            {isSortOpen ? (
              <div
                className="absolute top-[calc(100%+6px)] right-0 z-20 w-40 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg"
                role="menu"
              >
                {sortOptions.map((option) => (
                  <button
                    className="flex h-9 w-full items-center rounded-md px-2.5 text-left text-[13px] text-stone-700 hover:bg-stone-100"
                    key={option.value}
                    onClick={() => {
                      setSort(option.value)
                      setIsSortOpen(false)
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {option.label}
                    {sort === option.value ? (
                      <Check
                        aria-hidden="true"
                        className="ml-auto text-brand-700"
                        size={14}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Button className="h-10" onClick={() => setIsJoinOpen(true)}>
            <Plus aria-hidden="true" size={15} />
            강의실 참여
          </Button>
        </div>
      </header>

      <section
        aria-labelledby="classroom-list-heading"
        className="border-t border-stone-100 pt-5"
      >
        <h2 className="sr-only" id="classroom-list-heading">
          참여 중인 강의실
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-300 bg-white px-6 py-8 text-center text-stone-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() => setIsJoinOpen(true)}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-stone-100">
              <Plus aria-hidden="true" size={16} />
            </span>
            <span className="text-sm font-semibold">초대 코드로 참여</span>
          </button>
        </div>

        <div className="mt-10 border-t border-stone-100 pt-7 text-center">
          <h2 className="text-base font-bold text-stone-900">
            아직 참여 중인 강의실이 없습니다
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            강의자가 전달한 초대 코드를 입력해 첫 강의실에 참여하세요.
          </p>
        </div>
      </section>

      {isSearchOpen ? (
        <div
          aria-label="강의실 검색"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/35 px-4 pt-[15vh]"
          role="dialog"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
            <div className="flex h-14 items-center gap-3 border-b border-stone-100 px-4">
              <Search aria-hidden="true" className="text-stone-400" size={16} />
              <input
                aria-label="검색어"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="강의실 이름을 검색하세요"
                ref={searchInputRef}
                value={searchQuery}
              />
              <button
                aria-label="검색 닫기"
                className="flex size-7 items-center justify-center rounded-md border border-stone-200 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                onClick={() => setIsSearchOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={14} />
              </button>
            </div>
            <div className="flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center">
              <Search aria-hidden="true" className="text-stone-300" size={22} />
              <p className="mt-3 text-sm font-semibold text-stone-800">
                {searchQuery.trim()
                  ? '일치하는 강의실이 없습니다'
                  : '검색할 강의실 이름을 입력하세요'}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                참여 중인 강의실이 검색 결과에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isJoinOpen ? (
        <div
          aria-labelledby="join-classroom-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <DoorOpen aria-hidden="true" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  className="text-base font-bold text-stone-950"
                  id="join-classroom-title"
                >
                  강의실 참여
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  강의자가 공유한 초대 코드를 입력하세요.
                </p>
              </div>
              <button
                aria-label="참여 창 닫기"
                className="flex size-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                onClick={() => setIsJoinOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>

            <form className="mt-5" onSubmit={submitInviteCode}>
              <label
                className="text-[13px] font-semibold text-stone-800"
                htmlFor="classroom-invite-code"
              >
                초대 코드
              </label>
              <input
                autoComplete="off"
                className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-medium tracking-wider text-stone-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                id="classroom-invite-code"
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="예: EDU-2026"
                ref={joinInputRef}
                value={inviteCode}
              />
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  onClick={() => setIsJoinOpen(false)}
                  variant="secondary"
                >
                  취소
                </Button>
                <Button disabled={!inviteCode.trim()} type="submit">
                  참여 요청
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageContainer>
  )
}

function getAcademicTermLabel(date = new Date()): string {
  const semester = date.getMonth() < 8 ? 1 : 2
  return `${date.getFullYear()}년 ${semester}학기`
}
