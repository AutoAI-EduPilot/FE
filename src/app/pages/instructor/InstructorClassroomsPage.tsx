import { BookOpen, KeyRound, Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { Button, EmptyState, PageContainer, useToast } from '../../../shared/ui'

const CLASSROOM_COLORS = [
  { className: 'bg-brand-600', label: '파랑', value: 'blue' },
  { className: 'bg-orange-600', label: '주황', value: 'orange' },
  { className: 'bg-emerald-600', label: '초록', value: 'green' },
  { className: 'bg-violet-600', label: '보라', value: 'violet' },
] as const

export function InstructorClassroomsPage() {
  usePageTitle('내 강의실')
  const { show: showToast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setIsCreateOpen(false)
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

  return (
    <PageContainer>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-bold text-stone-950">내 강의실</h1>
          <p className="text-xs text-stone-400">
            {getAcademicTermLabel()} · 운영 중 0개
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label="강의실 검색"
            className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-left text-sm text-stone-400 hover:border-stone-300 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:min-w-72 xl:flex-none"
            onClick={() => setIsSearchOpen(true)}
            type="button"
          >
            <Search aria-hidden="true" size={15} />
            <span className="flex-1">강의실 검색</span>
            <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </button>
          <Button className="h-10" onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" size={15} />
            강의실 만들기
          </Button>
        </div>
      </header>

      <EmptyState
        description="새 강의실을 만들면 운영 현황과 초대 코드를 확인할 수 있습니다."
        title="아직 운영 중인 강의실이 없습니다"
      />

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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="강의실 또는 자료 검색"
                ref={searchInputRef}
                value={query}
              />
              <button
                aria-label="검색 닫기"
                className="flex h-7 items-center justify-center rounded-md border border-stone-200 px-2 text-[10px] font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                onClick={() => setIsSearchOpen(false)}
                type="button"
              >
                esc
              </button>
            </div>
            <div className="min-h-52 px-4 py-4">
              <p className="text-xs font-semibold text-stone-400">강의실</p>
              <div className="flex min-h-32 flex-col items-center justify-center text-center">
                <BookOpen aria-hidden="true" className="text-stone-300" size={22} />
                <p className="mt-3 text-sm font-semibold text-stone-800">
                  {query.trim()
                    ? '일치하는 검색 결과가 없습니다'
                    : '검색어를 입력하세요'}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  운영 중인 강의실과 등록 자료를 함께 찾습니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-100 px-4 py-2.5 text-[10px] font-medium text-stone-400">
              <span>↑↓ 이동</span>
              <span>↵ 열기</span>
              <span className="ml-auto">⌘K로 어디서든 열기</span>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <CreateClassroomDialog
          onClose={() => setIsCreateOpen(false)}
          onSubmit={() =>
            showToast(
              '현재 강의실 생성 기능을 사용할 수 없습니다.',
              'info',
            )
          }
        />
      ) : null}
    </PageContainer>
  )
}

function CreateClassroomDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [color, setColor] =
    useState<(typeof CLASSROOM_COLORS)[number]['value']>('blue')
  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState(15)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit()
  }

  return (
    <div
      aria-labelledby="create-classroom-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-2xl"
        onSubmit={submit}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-stone-950" id="create-classroom-title">
            강의실 만들기
          </h2>
          <button
            aria-label="강의실 만들기 닫기"
            className="flex size-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <label className="mt-5 block text-[13px] font-semibold text-stone-800">
          강의실 이름
          <input
            autoFocus
            className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setName(event.target.value)}
            placeholder="강의실 이름을 입력하세요"
            value={name}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-[13px] font-semibold text-stone-800">
            학기
            <select className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
              <option>{getAcademicTermLabel()}</option>
            </select>
          </label>
          <label className="text-[13px] font-semibold text-stone-800">
            주차 수 <span className="font-normal text-stone-400">(수업 차수)</span>
            <input
              className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              max={24}
              min={1}
              onChange={(event) => setWeeks(Number(event.target.value))}
              type="number"
              value={weeks}
            />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="text-[13px] font-semibold text-stone-800">색상</legend>
          <div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-stone-300 px-3">
            {CLASSROOM_COLORS.map((option) => (
              <button
                aria-label={option.label}
                aria-pressed={color === option.value}
                className={`size-5 rounded-md ${option.className} ${
                  color === option.value
                    ? 'ring-2 ring-stone-900 ring-offset-2'
                    : ''
                }`}
                key={option.value}
                onClick={() => setColor(option.value)}
                type="button"
              />
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block text-[13px] font-semibold text-stone-800">
          설명 <span className="font-normal text-stone-400">(선택)</span>
          <textarea
            className="mt-1 min-h-24 w-full resize-none rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="학습자에게 보이는 한 줄 소개"
          />
        </label>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
          <KeyRound aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500" size={15} />
          <span>
            초대 코드는 만들기 완료 후 자동 발급돼요.
            <br />
            강의실 카드에서 언제든 복사·재발급할 수 있어요.
          </span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            취소
          </Button>
          <Button disabled={!name.trim()} type="submit">
            만들기
          </Button>
        </div>
      </form>
    </div>
  )
}

function getAcademicTermLabel(date = new Date()): string {
  const semester = date.getMonth() < 8 ? 1 : 2
  return `${date.getFullYear()}년 ${semester}학기`
}
