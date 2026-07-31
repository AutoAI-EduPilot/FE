import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { cx } from '../../../shared/lib/cx'
import { PageContainer, PageHeader } from '../../../shared/ui'

type CalendarView = 'list' | 'month' | 'week'

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export function InstructorCalendarPage() {
  usePageTitle('캘린더')
  const today = useMemo(() => startOfDay(new Date()), [])
  const [cursor, setCursor] = useState(() => startOfMonth(today))
  const [view, setView] = useState<CalendarView>('month')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(cursor.getFullYear())
  const pickerRef = useRef<HTMLDivElement | null>(null)

  const label = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`

  useEffect(() => {
    if (!isPickerOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPickerOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isPickerOpen])

  function move(direction: -1 | 1) {
    setCursor((current) =>
      view === 'week'
        ? addDays(current, direction * 7)
        : new Date(current.getFullYear(), current.getMonth() + direction, 1),
    )
  }

  function togglePicker() {
    setPickerYear(cursor.getFullYear())
    setIsPickerOpen((open) => !open)
  }

  function selectMonth(month: number) {
    setCursor(new Date(pickerYear, month, 1))
    setIsPickerOpen(false)
  }

  return (
    <PageContainer>
      <PageHeader
        actions={
          <SegmentedControl onChange={setView} value={view} />
        }
        title="캘린더"
        titleAccessory={
          <div className="flex items-center gap-1.5" ref={pickerRef}>
            <button
              aria-label="이전 기간"
              className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
              onClick={() => move(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={15} />
            </button>
            <div className="relative">
              <button
                aria-expanded={isPickerOpen}
                aria-haspopup="dialog"
                aria-label="연도와 월 선택"
                className="flex h-8 min-w-32 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-stone-900 hover:bg-stone-100 sm:min-w-36"
                onClick={togglePicker}
                type="button"
              >
                {label}
                <ChevronDown aria-hidden="true" size={14} />
              </button>
              {isPickerOpen ? (
                <MonthYearPicker
                  onChangeYear={setPickerYear}
                  onSelectMonth={selectMonth}
                  selectedMonth={cursor.getMonth()}
                  selectedYear={cursor.getFullYear()}
                  year={pickerYear}
                />
              ) : null}
            </div>
            <button
              aria-label="다음 기간"
              className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
              onClick={() => move(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
        }
      />

      {view === 'month' ? <MonthView cursor={cursor} today={today} /> : null}
      {view === 'week' ? <WeekView cursor={cursor} today={today} /> : null}
      {view === 'list' ? <ListView /> : null}
    </PageContainer>
  )
}

function MonthYearPicker({
  onChangeYear,
  onSelectMonth,
  selectedMonth,
  selectedYear,
  year,
}: {
  onChangeYear: (year: number) => void
  onSelectMonth: (month: number) => void
  selectedMonth: number
  selectedYear: number
  year: number
}) {
  return (
    <div
      aria-label="연도와 월 선택"
      className="absolute top-[calc(100%+8px)] left-1/2 z-30 w-64 -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-3 shadow-xl"
      role="dialog"
    >
      <label className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-500">
        연도
        <select
          aria-label="연도 선택"
          className="h-9 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-900"
          onChange={(event) => onChangeYear(Number(event.target.value))}
          value={year}
        >
          {Array.from({ length: 101 }, (_, index) => 2000 + index).map(
            (optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}년
              </option>
            ),
          )}
        </select>
      </label>
      <div className="mt-3 grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, month) => (
          <button
            aria-pressed={
              selectedYear === year && selectedMonth === month
            }
            className={cx(
              'h-9 rounded-md text-xs font-semibold',
              selectedYear === year && selectedMonth === month
                ? 'bg-brand-600 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950',
            )}
            key={month}
            onClick={() => onSelectMonth(month)}
            type="button"
          >
            {month + 1}월
          </button>
        ))}
      </div>
    </div>
  )
}

function SegmentedControl({
  onChange,
  value,
}: {
  onChange: (value: CalendarView) => void
  value: CalendarView
}) {
  return (
    <div
      aria-label="캘린더 보기"
      className="inline-flex rounded-lg border border-stone-200 bg-white p-1"
      role="group"
    >
      {[
        ['month', '월'],
        ['week', '주'],
        ['list', '목록'],
      ].map(([option, label]) => (
        <button
          aria-pressed={value === option}
          className={cx(
            'h-8 min-w-10 rounded-md px-2.5 text-xs font-semibold',
            value === option
              ? 'bg-stone-900 text-white'
              : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
          )}
          key={option}
          onClick={() => onChange(option as CalendarView)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function MonthView({ cursor, today }: { cursor: Date; today: Date }) {
  const cells = getMonthCells(cursor)

  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
        {WEEKDAY_LABELS.map((label) => (
          <div
            className="px-2 py-2 text-center text-[11px] font-semibold text-stone-500"
            key={label}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const isCurrentMonth = date.getMonth() === cursor.getMonth()
          const isToday = isSameDay(date, today)
          return (
            <div
              className="min-h-28 border-r border-b border-stone-100 p-2 last:border-r-0 sm:min-h-32"
              key={date.toISOString()}
            >
              <span
                className={cx(
                  'flex size-6 items-center justify-center rounded-full text-[11px] font-medium',
                  isToday
                    ? 'bg-brand-600 font-bold text-white'
                    : isCurrentMonth
                      ? 'text-stone-800'
                      : 'text-stone-300',
                )}
              >
                {date.getDate()}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function WeekView({ cursor, today }: { cursor: Date; today: Date }) {
  const week = getWeek(cursor)
  return (
    <section className="grid overflow-hidden rounded-lg border border-stone-200 bg-white md:grid-cols-7">
      {week.map((date, index) => (
        <div
          className="min-h-48 border-b border-stone-100 p-3 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
          key={date.toISOString()}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400">
              {WEEKDAY_LABELS[index]}
            </span>
            <span
              className={cx(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                isSameDay(date, today)
                  ? 'bg-brand-600 text-white'
                  : 'text-stone-800',
              )}
            >
              {date.getDate()}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}

function ListView() {
  return (
    <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-stone-200 bg-white px-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
        <CalendarDays aria-hidden="true" size={19} />
      </span>
      <h2 className="mt-4 text-base font-bold text-stone-900">
        예정된 일정이 없습니다
      </h2>
      <p className="mt-1.5 text-sm text-stone-500">
        자료 공개와 공지 일정이 등록되면 날짜순으로 표시됩니다.
      </p>
    </section>
  )
}

function getMonthCells(cursor: Date): Date[] {
  const first = startOfMonth(cursor)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = addDays(first, -mondayOffset)
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate()
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) => addDays(start, index))
}

function getWeek(cursor: Date): Date[] {
  const offset = (cursor.getDay() + 6) % 7
  const monday = addDays(startOfDay(cursor), -offset)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function isSameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}
