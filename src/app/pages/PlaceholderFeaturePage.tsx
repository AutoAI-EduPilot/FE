import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  PenLine,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { cx } from '../../shared/lib/cx'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  useToast,
} from '../../shared/ui'

type CalendarView = 'list' | 'month' | 'week'

interface CalendarEvent {
  classroom: string
  dateLabel: string
  description: string
  id: string
  tone: 'amber' | 'emerald' | 'indigo'
  type: string
}

const calendarEvents: CalendarEvent[] = [
  {
    classroom: '자료구조',
    dateLabel: '오늘 · 7월 29일',
    description: '중간고사 공지 확인 — 범위 1~4주차',
    id: 'event-1',
    tone: 'amber',
    type: '공지',
  },
  {
    classroom: '자료구조',
    dateLabel: '8월 3일',
    description: '4주차 공개 — 스택과 큐 · 자료 5개',
    id: 'event-2',
    tone: 'indigo',
    type: '공개 예정',
  },
  {
    classroom: '운영체제',
    dateLabel: '8월 4일',
    description: '5주차 공개 — 메모리 관리',
    id: 'event-3',
    tone: 'amber',
    type: '공개 예정',
  },
  {
    classroom: '데이터베이스',
    dateLabel: '8월 7일',
    description: '3주차 공개 — SQL 기초',
    id: 'event-4',
    tone: 'emerald',
    type: '공개 예정',
  },
]

const calendarCells = [
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1 },
  { day: 2 },
  { day: 3 },
  { day: 4, weekend: true },
  { day: 5, weekend: true },
  { day: 6 },
  { day: 7, event: { label: 'DB 2주차 공개', tone: 'emerald' as const } },
  { day: 8 },
  { day: 9 },
  { day: 10 },
  { day: 11, weekend: true },
  { day: 12, weekend: true },
  { day: 13, event: { label: 'OS 4주차 공개', tone: 'amber' as const } },
  { day: 14 },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18, weekend: true },
  { day: 19, weekend: true },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  {
    day: 24,
    event: { label: '자료구조 3주차 공개', tone: 'indigo' as const },
  },
  { day: 25, weekend: true },
  { day: 26, weekend: true },
  { day: 27 },
  { day: 28 },
  {
    day: 29,
    event: { label: '중간고사 공지 확인', tone: 'amber' as const },
    today: true,
  },
  { day: 30 },
  { day: 31 },
  { day: 1, muted: true },
  {
    day: 2,
    event: { label: '자료구조 4주차 공개', tone: 'indigo' as const },
    muted: true,
  },
]

const toneClasses = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  indigo: 'border-brand-200 bg-brand-50 text-brand-800',
}

export function CalendarPage() {
  usePageTitle('캘린더')
  const [view, setView] = useState<CalendarView>('month')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="캘린더"
        description="강의 자료 공개 일정과 공지를 한눈에 확인합니다."
        actions={<Badge tone="warning">미연동 미리보기</Badge>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button aria-label="이전 달" size="sm" type="button" variant="secondary">
          <ChevronLeft aria-hidden="true" size={15} />
        </Button>
        <strong className="px-1 text-sm text-stone-900">
          {view === 'list' ? '2026년 7월 – 8월' : '2026년 7월'}
        </strong>
        <Button aria-label="다음 달" size="sm" type="button" variant="secondary">
          <ChevronRight aria-hidden="true" size={15} />
        </Button>
        <div
          aria-label="캘린더 보기"
          className="ml-auto inline-flex rounded-lg border border-stone-200 bg-white p-0.5"
          role="tablist"
        >
          {[
            { id: 'month' as const, label: '월' },
            { id: 'week' as const, label: '주' },
            { id: 'list' as const, label: '목록' },
          ].map((option) => (
            <button
              aria-selected={view === option.id}
              className={cx(
                'h-8 rounded-md px-3 text-xs font-semibold',
                view === option.id
                  ? 'bg-stone-900 text-white dark:text-[#1b1c20]'
                  : 'text-stone-500 hover:text-stone-800',
              )}
              key={option.id}
              onClick={() => setView(option.id)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <CalendarList />
      ) : (
        <CalendarGrid compact={view === 'week'} />
      )}
    </div>
  )
}

function CalendarGrid({ compact }: { compact: boolean }) {
  const cells = compact ? calendarCells.slice(21, 28) : calendarCells

  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 bg-stone-50">
            {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
              <div
                className="flex h-9 items-center justify-center border-r border-stone-100 text-xs font-semibold text-stone-500 last:border-r-0"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, index) => (
              <div
                className={cx(
                  'min-h-27 border-t border-r border-stone-100 p-2 last:border-r-0',
                  !compact && index % 7 === 6 && 'border-r-0',
                )}
                key={`${cell.day}-${index}`}
              >
                <span
                  className={cx(
                    'flex size-6 items-center justify-center rounded-full text-xs',
                    cell.muted && 'text-stone-300',
                    cell.weekend && !cell.muted && 'text-stone-500',
                    cell.today &&
                      'bg-brand-600 font-semibold text-white dark:text-white',
                  )}
                >
                  {cell.day}
                </span>
                {cell.event ? (
                  <div
                    className={cx(
                      'mt-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold leading-4',
                      toneClasses[cell.event.tone],
                    )}
                  >
                    {cell.event.label}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CalendarList() {
  return (
    <section className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
      {calendarEvents.map((event) => (
        <article
          className="grid gap-2 px-5 py-4 sm:grid-cols-[130px_130px_minmax(0,1fr)_100px] sm:items-center"
          key={event.id}
        >
          <strong className="text-xs text-stone-800">{event.dateLabel}</strong>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900">
            <span
              className={cx(
                'size-2 rounded-sm',
                event.tone === 'indigo'
                  ? 'bg-brand-600'
                  : event.tone === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600',
              )}
            />
            {event.classroom}
          </span>
          <p className="text-sm text-stone-600">{event.description}</p>
          <Badge tone={event.tone === 'amber' ? 'warning' : 'neutral'}>
            {event.type}
          </Badge>
        </article>
      ))}
    </section>
  )
}

interface NotePreview {
  classroom: string
  content: string
  date: string
  id: string
  page: string
  source: 'AI 답변' | '내 메모' | '퀴즈'
  title: string
}

const notes: NotePreview[] = [
  {
    classroom: '자료구조',
    content:
      'prev·next 두 포인터를 가지며, 삽입 시 4개의 포인터를 갱신한다. 시간 복잡도는 O(1)…',
    date: '어제 오후 2:41',
    id: 'note-1',
    page: '연결 리스트.pdf · 12쪽',
    source: 'AI 답변',
    title: '이중 연결 리스트 삽입 요약',
  },
  {
    classroom: '자료구조',
    content:
      'head가 null일 때 삽입 처리 — 시험 전에 다시 보기. 더미 노드를 쓰면 분기를 줄일 수 있음',
    date: '어제 오후 3:02',
    id: 'note-2',
    page: '연결 리스트.pdf · 9쪽',
    source: '내 메모',
    title: '헷갈리는 부분',
  },
  {
    classroom: '운영체제',
    content:
      'RR은 타임 퀀텀 기반 선점, SJF는 실행 시간 예측 기반. 평균 대기시간은 SJF가 최적…',
    date: '7월 25일',
    id: 'note-3',
    page: '프로세스 스케줄링.pptx · 7',
    source: 'AI 답변',
    title: 'RR vs SJF 차이',
  },
  {
    classroom: '데이터베이스',
    content:
      'σ는 행 선택, π는 열 선택. 조합하면 SQL의 WHERE + SELECT 절에 대응…',
    date: '7월 22일',
    id: 'note-4',
    page: '관계 대수.pdf · 3쪽',
    source: 'AI 답변',
    title: '셀렉션과 프로젝션',
  },
  {
    classroom: '자료구조',
    content:
      'Q1. 임의 접근이 O(1)인 자료구조는? Q2. 중간 삽입이 유리한 쪽은?…',
    date: '7월 21일 · 4/5 정답',
    id: 'note-5',
    page: '배열 vs 리스트 비교.pdf',
    source: '퀴즈',
    title: '자가 점검 퀴즈 5문항',
  },
]

export function NotesPage() {
  usePageTitle('내 노트')
  const { show: showToast } = useToast()
  const [query, setQuery] = useState('')
  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return notes
    return notes.filter((note) =>
      [note.classroom, note.content, note.page, note.title]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [query])

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Notes"
        title="내 노트"
        description="AI 답변과 학습 중 작성한 메모를 자료별로 모아 봅니다."
        actions={
          <>
            <Badge tone="neutral">24개</Badge>
            <Badge tone="warning">미연동 미리보기</Badge>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-80">
          <span className="sr-only">노트 검색</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
            size={14}
          />
          <input
            className="h-9 w-full rounded-lg border border-stone-200 bg-white pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="노트 검색"
            type="search"
            value={query}
          />
        </label>
        <Button size="sm" type="button" variant="secondary">
          전체 강의실
        </Button>
        <Button
          onClick={() =>
            showToast('새 노트 작성 API가 연결되면 사용할 수 있습니다.', 'info')
          }
          size="sm"
          type="button"
        >
          <Plus aria-hidden="true" size={14} />새 노트
        </Button>
      </div>

      {filteredNotes.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다."
          description="다른 검색어로 노트를 찾아보세요."
        />
      ) : (
        <section className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {filteredNotes.map((note) => (
            <article className="px-5 py-4" key={note.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <strong className="text-stone-800">{note.classroom}</strong>
                <span className="text-stone-300">/</span>
                <span className="text-stone-500">{note.page}</span>
                <span className="ml-auto text-stone-400">{note.date}</span>
              </div>
              <div className="mt-2 flex items-start gap-3">
                <span
                  className={cx(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                    note.source === 'AI 답변'
                      ? 'bg-brand-50 text-brand-700'
                      : note.source === '내 메모'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700',
                  )}
                >
                  {note.source === 'AI 답변' ? (
                    <Sparkles aria-hidden="true" size={14} />
                  ) : note.source === '내 메모' ? (
                    <PenLine aria-hidden="true" size={14} />
                  ) : (
                    <ListChecks aria-hidden="true" size={14} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-stone-900">
                      {note.title}
                    </h2>
                    <Badge tone="neutral">{note.source}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {note.content}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
