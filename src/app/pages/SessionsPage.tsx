import {
  mockSessions,
  type LearningSession,
  type LearningSessionStatus,
} from '../../features/sessions'
import { Badge, ButtonLink, PageHeader } from '../../shared/ui'
import { routes, sessionDetailPath } from '../routes'

export function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sessions"
        title="학습 세션"
        description="진행 중인 학습을 시작하거나 이어서 봅니다."
        actions={<Badge tone="warning">BE#20 연동 예정</Badge>}
      />

      <section className="grid gap-4">
        {mockSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </section>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-center shadow-sm">
        <h2 className="text-lg font-bold text-zinc-950">새 학습 시작</h2>
        <p className="mt-2 text-sm text-zinc-600">
          자료가 READY 상태가 되면 자료 상세에서 새 세션을 시작합니다.
        </p>
        <ButtonLink className="mt-4" to={routes.materials} variant="secondary">
          자료 화면으로
        </ButtonLink>
      </section>
    </div>
  )
}

function SessionCard({ session }: { session: LearningSession }) {
  const actionLabel = session.status === 'ACTIVE' ? '학습 재개' : '학습 보기'

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-lg font-bold text-zinc-950">
              {session.materialTitle}
            </h2>
            <StatusBadge status={session.status} />
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {session.currentPage}/{session.totalPages}쪽 · 최근 학습 {session.lastActivityAt}
          </p>
        </div>
        <ButtonLink to={sessionDetailPath(session.id)}>{actionLabel}</ButtonLink>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: LearningSessionStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>
}

const statusTone: Record<LearningSessionStatus, 'info' | 'neutral' | 'success'> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  PAUSED: 'neutral',
}
