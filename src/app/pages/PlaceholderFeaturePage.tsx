import type { LucideIcon } from 'lucide-react'
import { CalendarDays, NotebookPen } from 'lucide-react'

import { Badge, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'

/**
 * 시안 사이드바의 캘린더·내 노트 화면.
 * 두 도메인 모두 백엔드가 없어 자리만 유지한다.
 * 요청 스펙: docs/be-api-requests.md §1-1(노트), §3-4(캘린더)
 */
function PlaceholderFeaturePage({
  description,
  eyebrow,
  icon: Icon,
  requestRef,
  title,
}: {
  description: string
  eyebrow: string
  icon: LucideIcon
  requestRef: string
  title: string
}) {
  usePageTitle(title)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<Badge tone="warning">미연동 미리보기</Badge>}
      />

      <section className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-6 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm">
          <Icon aria-hidden="true" size={20} />
        </span>
        <p className="text-sm font-semibold text-stone-600">
          백엔드 API 연동을 기다리는 화면입니다.
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-stone-400">
          요청 스펙은 <code className="font-mono">docs/be-api-requests.md</code>{' '}
          {requestRef}에 정리해 두었습니다. API가 준비되면 이 자리에 바로
          연결됩니다.
        </p>
      </section>
    </div>
  )
}

export function CalendarPage() {
  return (
    <PlaceholderFeaturePage
      description="학습 일정과 자료 공개일을 한눈에 봅니다."
      eyebrow="Calendar"
      icon={CalendarDays}
      requestRef="§3-4"
      title="캘린더"
    />
  )
}

export function NotesPage() {
  return (
    <PlaceholderFeaturePage
      description="학습 중 저장한 노트를 모아 봅니다."
      eyebrow="Notes"
      icon={NotebookPen}
      requestRef="§1-1"
      title="내 노트"
    />
  )
}
