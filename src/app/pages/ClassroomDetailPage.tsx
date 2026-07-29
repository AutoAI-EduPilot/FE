import { ArrowRight, Check, ChevronDown, Pin } from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import {
  findPlaceholderClassroom,
  PLACEHOLDER_NOTICE,
  type ClassroomMaterial,
  type ClassroomWeek,
} from '../../features/classrooms'
import { cx } from '../../shared/lib/cx'
import {
  Badge,
  Button,
  ButtonLink,
  ErrorState,
  PageHeader,
  useToast,
} from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const FILE_TYPE_CLASSES: Record<ClassroomMaterial['fileType'], string> = {
  PDF: 'bg-rose-100 text-rose-700',
  PPT: 'bg-amber-100 text-amber-700',
}

export function ClassroomDetailPage() {
  const { classroomId } = useParams()
  const classroom = useMemo(
    () => (classroomId ? findPlaceholderClassroom(classroomId) : null),
    [classroomId],
  )
  usePageTitle(classroom?.name ?? '강의실')
  const { show: showToast } = useToast()
  const notifyPending = () => showToast(PLACEHOLDER_NOTICE, 'info')

  if (!classroom) {
    return (
      <ErrorState
        title="강의실을 찾을 수 없습니다."
        description="목록에서 다시 선택하세요."
        action={<ButtonLink to={routes.classrooms}>강의실 목록으로</ButtonLink>}
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="내 강의실 /"
        title={classroom.name}
        description={`${classroom.instructorName} · ${classroom.currentWeekLabel}`}
        actions={
          <>
            <Badge tone="warning">미연동 미리보기</Badge>
            <div className="w-48">
              <div className="flex justify-between text-xs text-stone-400">
                <span>전체 진도 · 자료 {classroom.materialCount}개</span>
                <span className="font-semibold text-brand-600">
                  {classroom.progressRate}%
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${classroom.progressRate}%` }}
                />
              </div>
            </div>
            <Button onClick={notifyPending} size="sm" type="button">
              이어서 학습
              <ArrowRight aria-hidden="true" size={14} />
            </Button>
          </>
        }
      />

      {classroom.notices.map((notice) => (
        <section
          className="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-3"
          key={notice.noticeId}
        >
          <Pin aria-hidden="true" className="shrink-0 text-amber-700" size={15} />
          <span className="shrink-0 font-semibold text-stone-900">
            {notice.authorName} 공지
          </span>
          <span className="min-w-0 text-stone-600">{notice.content}</span>
          <span className="shrink-0 text-xs text-stone-400 sm:ml-auto">
            {notice.createdAtLabel}
          </span>
        </section>
      ))}

      <div className="space-y-2.5">
        {classroom.weeks.map((week) => (
          <WeekSection key={week.weekNumber} onOpen={notifyPending} week={week} />
        ))}
      </div>
    </div>
  )
}

function WeekSection({
  onOpen,
  week,
}: {
  onOpen: () => void
  week: ClassroomWeek
}) {
  const isCurrent = week.status === 'CURRENT'
  const materialCount = week.materialCount ?? week.materials.length
  const completedCount =
    week.completedCount ??
    week.materials.filter((material) => material.completed).length

  return (
    <section
      className={cx(
        'overflow-hidden rounded-xl border border-stone-200',
        week.status === 'SCHEDULED' && 'opacity-60',
      )}
    >
      <div
        className={cx(
          'flex h-12.5 items-center gap-2.5 px-5',
          isCurrent && 'bg-stone-50',
        )}
      >
        <h2 className="truncate text-[14.5px] font-bold text-stone-900">
          {week.weekNumber}주차 — {week.title}
        </h2>
        {isCurrent ? (
          <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            이번 주
          </span>
        ) : null}
        {week.status === 'COMPLETED' ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            완료
          </span>
        ) : null}
        {week.releaseLabel ? (
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">
            {week.releaseLabel}
          </span>
        ) : null}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-stone-400">
          자료 {materialCount}
          {completedCount > 0 ? ` · 완료 ${completedCount}` : ''}
          <ChevronDown
            aria-hidden="true"
            className={cx(isCurrent && 'rotate-180')}
            size={14}
          />
        </span>
      </div>

      {week.materials.map((material) => (
        <div
          className="flex h-12.5 items-center gap-3 border-t border-stone-100 px-5"
          key={material.materialId}
        >
          <span
            className={cx(
              'flex h-5.5 w-9 shrink-0 items-center justify-center rounded-md text-[10.5px] font-bold',
              FILE_TYPE_CLASSES[material.fileType],
            )}
          >
            {material.fileType}
          </span>
          <span
            className={cx(
              'truncate text-sm font-semibold',
              material.completed
                ? 'text-stone-400 line-through'
                : 'text-stone-900',
            )}
          >
            {material.title}
          </span>
          <span className="hidden shrink-0 text-xs text-stone-400 sm:inline">
            {material.pageLabel}
            {material.uploadedAt ? ` · ${material.uploadedAt}` : ''}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {material.completed ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check aria-hidden="true" size={13} />
                완료
              </span>
            ) : (
              <>
                {material.progressRate > 0 ? (
                  <div className="hidden h-1 w-25 overflow-hidden rounded-full bg-stone-100 sm:block">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${material.progressRate}%` }}
                    />
                  </div>
                ) : (
                  <span className="hidden text-xs text-stone-400 sm:inline">
                    시작 전
                  </span>
                )}
                <button
                  className="text-xs font-semibold text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  onClick={onOpen}
                  type="button"
                >
                  {material.progressRate > 0 ? '이어보기' : '열기'} →
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  )
}
