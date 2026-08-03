import { ArrowRight, FileText, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../features/auth'
import { getRequestErrorMessage } from '../../shared/api'
import {
  createSessionsRepository,
  type LearningSession,
  type LearningSessionStatus,
} from '../../features/sessions'
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from '../../shared/ui'
import { formatDateTime } from '../../shared/lib/format'
import { routes, sessionDetailPath } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function SessionsPage() {
  usePageTitle('학습 세션')
  const { apiRequest } = useAuth()
  const repository = useMemo(
    () => createSessionsRepository(apiRequest),
    [apiRequest],
  )
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  async function handleDelete(session: LearningSession) {
    if (deletingSessionId) return
    if (!window.confirm('세션을 삭제할까요? 대화 기록이 사라집니다.')) return

    setDeletingSessionId(session.id)
    try {
      await repository.delete(session.id)
      setSessions((current) => current.filter((item) => item.id !== session.id))
      setError(null)
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setDeletingSessionId(null)
    }
  }

  const loadSessions = useCallback(async (signal?: AbortSignal) => {
    try {
      setSessions(await repository.list(signal))
      setError(null)
    } catch (requestError) {
      if (!signal?.aborted) setError(getRequestErrorMessage(requestError))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    const controller = new AbortController()
    repository
      .list(controller.signal)
      .then((nextSessions) => {
        setSessions(nextSessions)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getRequestErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [repository])

  return (
    <PageContainer>
      <PageHeader
        title="학습 세션"
      />

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4 sm:px-5">
          <h2 className="type-section-title font-bold text-stone-950">최근 세션</h2>
          <span className="type-caption font-medium text-stone-500">
            {sessions.length}개 세션
          </span>
        </div>
        {isLoading && sessions.length === 0 ? (
          <LoadingState message="학습 세션을 불러오는 중입니다." />
        ) : error && sessions.length === 0 ? (
          <ErrorState
            title="세션을 불러오지 못했습니다."
            description={error}
            action={
              <Button onClick={() => void loadSessions()} type="button">
                다시 시도
              </Button>
            }
          />
        ) : sessions.length === 0 ? (
          <EmptyState
            title="학습 세션이 없습니다."
            description="준비 완료된 자료에서 새 학습을 시작하세요."
          />
        ) : (
        <div className="divide-y divide-stone-200">
          {sessions.map((session) => (
            <SessionRow
              isDeleting={deletingSessionId === session.id}
              key={session.id}
              onDelete={() => void handleDelete(session)}
              session={session}
            />
          ))}
        </div>
        )}
        {error && sessions.length > 0 ? (
          <p className="border-t border-stone-200 px-4 py-3 type-caption font-medium text-rose-700 sm:px-5" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
            <Plus aria-hidden="true" size={17} />
          </span>
          <div>
            <h2 className="type-body font-bold text-stone-950">새 학습 시작</h2>
            <p className="mt-1 type-body text-stone-500">
              자료 처리가 끝나면 자료 상세에서 새 세션을 시작합니다.
            </p>
          </div>
        </div>
        <ButtonLink className="shrink-0" to={routes.materials} variant="secondary">
          자료 화면으로
          <ArrowRight aria-hidden="true" size={15} />
        </ButtonLink>
      </section>
    </PageContainer>
  )
}

function SessionRow({
  isDeleting,
  onDelete,
  session,
}: {
  isDeleting: boolean
  onDelete: () => void
  session: LearningSession
}) {
  const actionLabel = session.status === 'ACTIVE' ? '학습 재개' : '학습 보기'

  return (
    <article className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
          <FileText aria-hidden="true" size={17} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words type-body font-bold text-stone-950">
            {session.materialTitle}
          </h3>
          <p className="mt-1 type-caption text-stone-500">
            {session.currentPage}
            {session.totalPages ? `/${session.totalPages}` : ''}쪽 · 최근 학습{' '}
            {formatDateTime(session.lastActivityAt)}
          </p>
        </div>
      </div>
      <div>
        <StatusBadge status={session.status} />
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink to={sessionDetailPath(session.id)} variant="secondary">
          {actionLabel}
          <ArrowRight aria-hidden="true" size={15} />
        </ButtonLink>
        <Button
          aria-label={`${session.materialTitle} 세션 삭제`}
          disabled={isDeleting}
          onClick={onDelete}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" size={15} />
        </Button>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: LearningSessionStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
}

const statusTone: Record<
  LearningSessionStatus,
  'info' | 'neutral' | 'success'
> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  DELETED: 'neutral',
  PAUSED: 'neutral',
}

const statusLabels: Record<LearningSessionStatus, string> = {
  ACTIVE: '진행 중',
  COMPLETED: '완료',
  DELETED: '삭제됨',
  PAUSED: '일시정지',
}
