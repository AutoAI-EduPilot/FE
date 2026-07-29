import { ArrowRight, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  placeholderClassrooms,
  placeholderContinue,
  PLACEHOLDER_NOTICE,
  type ClassroomSummary,
} from '../../features/classrooms'
import { cx } from '../../shared/lib/cx'
import { Badge, Button, PageHeader, useToast } from '../../shared/ui'
import { classroomDetailPath } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const ACCENT_CLASSES: Record<ClassroomSummary['accent'], string> = {
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  indigo: 'bg-brand-100 text-brand-700',
  neutral: 'bg-stone-200 text-stone-500',
  violet: 'bg-violet-100 text-violet-700',
}

export function ClassroomsPage() {
  usePageTitle('내 강의실')
  const { show: showToast } = useToast()
  const notifyPending = () => showToast(PLACEHOLDER_NOTICE, 'info')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Classrooms"
        title="내 강의실"
        description={`2026년 1학기 · ${placeholderClassrooms.length}개`}
        actions={<Badge tone="warning">미연동 미리보기</Badge>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-200 px-3 text-[13px] text-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:max-w-70 sm:flex-none"
          onClick={notifyPending}
          type="button"
        >
          <Search aria-hidden="true" size={14} />
          강의실 검색
          <span className="ml-auto rounded border border-stone-200 px-1.5 py-0.5 text-[11px] text-stone-400">
            ⌘K
          </span>
        </button>
        <Button onClick={notifyPending} size="sm" type="button" variant="secondary">
          최근 학습순
        </Button>
        <Button onClick={notifyPending} size="sm" type="button">
          <Plus aria-hidden="true" size={14} />
          초대 코드
        </Button>
      </div>

      <section className="flex flex-col gap-4 rounded-xl bg-stone-100 px-5 py-4 sm:flex-row sm:items-center">
        <span className="flex h-6 w-10 shrink-0 items-center justify-center rounded-md bg-rose-100 text-[11px] font-bold text-rose-700">
          PDF
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold text-stone-900">
            이어서 학습하기 — {placeholderContinue.materialTitle}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-stone-400">
            {placeholderContinue.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3.5 sm:ml-auto">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${placeholderContinue.progressRate}%` }}
            />
          </div>
          <Button onClick={notifyPending} size="sm" type="button">
            {placeholderContinue.pageNumber}쪽부터 계속
            <ArrowRight aria-hidden="true" size={14} />
          </Button>
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {placeholderClassrooms.map((classroom) => (
          <li key={classroom.classroomId}>
            <ClassroomCard classroom={classroom} />
          </li>
        ))}
        <li>
          <button
            className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-stone-300 p-5 text-stone-400 hover:border-stone-400 hover:text-stone-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={notifyPending}
            type="button"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-stone-100">
              <Plus aria-hidden="true" size={15} />
            </span>
            <span className="text-[13px] font-semibold">초대 코드로 참여</span>
          </button>
        </li>
      </ul>
    </div>
  )
}

function ClassroomCard({ classroom }: { classroom: ClassroomSummary }) {
  const isCompleted = classroom.status === 'COMPLETED'

  return (
    <Link
      className={cx(
        'flex h-full flex-col gap-3 rounded-xl border border-stone-200 p-5 hover:border-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        isCompleted && 'opacity-60',
      )}
      to={classroomDetailPath(classroom.classroomId)}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cx(
            'flex size-9.5 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold',
            ACCENT_CLASSES[classroom.accent],
          )}
        >
          {classroom.name.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-stone-900">
            {classroom.name}
          </span>
          <span className="block truncate text-xs text-stone-400">
            {classroom.instructorName} · {classroom.currentWeekLabel}
          </span>
        </span>
        {classroom.newMaterialCount ? (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            새 자료 {classroom.newMaterialCount}
          </span>
        ) : null}
        {isCompleted ? (
          <span className="ml-auto shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">
            완료
          </span>
        ) : null}
      </div>

      <div>
        <div className="flex justify-between text-xs text-stone-400">
          <span>진도</span>
          <span className={cx('font-semibold', !isCompleted && 'text-brand-600')}>
            {classroom.progressRate}%
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
          <div
            className={cx(
              'h-full rounded-full',
              isCompleted ? 'bg-stone-300' : 'bg-brand-600',
            )}
            style={{ width: `${classroom.progressRate}%` }}
          />
        </div>
      </div>

      <p className="truncate text-[12.5px] text-stone-500">
        {classroom.lastStudiedLabel}
      </p>
    </Link>
  )
}
