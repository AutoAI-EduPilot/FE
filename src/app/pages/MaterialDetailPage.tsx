import { AlertTriangle, ArrowRight, FileText, Play } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  createMaterialsRepository,
  getMaterialStatusLabel,
  type MaterialStatus,
  type StudyMaterial,
} from '../../features/materials'
import { useAuth } from '../../features/auth'
import { getRequestErrorMessage } from '../../shared/api'
import {
  createMemoryRepository,
  isEmptyLearnerMemory,
  type LearnerMemory,
} from '../../features/memory'
import { createSessionsRepository } from '../../features/sessions'
import {
  Badge,
  Button,
  ButtonLink,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../shared/ui'
import { formatDate, formatFileSize } from '../../shared/lib/format'
import { usePolling } from '../../shared/state'
import { routes, sessionDetailPath } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function MaterialDetailPage() {
  usePageTitle('자료 상세')
  const { materialId } = useParams()
  const navigate = useNavigate()
  const { apiRequest } = useAuth()
  const materialsRepository = useMemo(
    () => createMaterialsRepository(apiRequest),
    [apiRequest],
  )
  const sessionsRepository = useMemo(
    () => createSessionsRepository(apiRequest),
    [apiRequest],
  )
  const memoryRepository = useMemo(
    () => createMemoryRepository(apiRequest),
    [apiRequest],
  )
  const [material, setMaterial] = useState<StudyMaterial | null | undefined>()
  const [memory, setMemory] = useState<LearnerMemory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!materialId) return
    const controller = new AbortController()
    memoryRepository
      .getByMaterial(materialId, controller.signal)
      .then((nextMemory) => {
        setMemory(isEmptyLearnerMemory(nextMemory) ? null : nextMemory)
      })
      .catch(() => {
        // 학습 분석은 부가 정보 — 실패 시 조용히 생략
      })
    return () => controller.abort()
  }, [materialId, memoryRepository])

  useEffect(() => {
    if (!materialId) return

    const controller = new AbortController()
    materialsRepository
      .getById(materialId, controller.signal)
      .then((nextMaterial) => {
        setMaterial(nextMaterial)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getRequestErrorMessage(requestError))
          setMaterial(null)
        }
      })

    return () => controller.abort()
  }, [materialId, materialsRepository, reloadKey])

  const refreshInBackground = useCallback(async () => {
    if (!materialId) return
    try {
      const nextMaterial = await materialsRepository.getById(materialId)
      if (nextMaterial) setMaterial(nextMaterial)
    } catch {
      // 백그라운드 폴링 실패는 무시
    }
  }, [materialId, materialsRepository])

  usePolling(material?.status === 'PROCESSING', refreshInBackground)

  async function startLearning() {
    if (!material) return
    setIsStarting(true)
    setError(null)
    try {
      const session = await sessionsRepository.create(material.id)
      navigate(sessionDetailPath(session.id))
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
      setIsStarting(false)
    }
  }

  if (!materialId) {
    return (
      <ErrorState
        title="자료를 찾을 수 없습니다."
        description="자료 식별자가 없습니다."
        action={<ButtonLink to={routes.materials}>자료 목록으로</ButtonLink>}
      />
    )
  }

  if (material === undefined) {
    return <LoadingState message="자료 정보를 불러오는 중입니다." />
  }

  if (!material) {
    return (
      <ErrorState
        title="자료를 찾을 수 없습니다."
        description={error ?? '목록에서 다시 선택하세요.'}
        action={
          error ? (
            <Button
              onClick={() => {
                setError(null)
                setMaterial(undefined)
                setReloadKey((key) => key + 1)
              }}
              type="button"
            >
              다시 시도
            </Button>
          ) : (
            <ButtonLink to={routes.materials}>자료 목록으로</ButtonLink>
          )
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={material.title}
        actions={<StatusBadge status={material.status} />}
      />

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-4 sm:px-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
            <FileText aria-hidden="true" size={17} />
          </span>
          <h2 className="text-base font-bold text-stone-950">자료 정보</h2>
        </div>
        <dl className="grid divide-y divide-stone-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          <DetailTerm label="상태" value={getMaterialStatusLabel(material.status)} />
          <DetailTerm
            label="파일 크기"
            value={
              material.fileSizeBytes
                ? formatFileSize(material.fileSizeBytes)
                : '정보 없음'
            }
          />
          <DetailTerm label="업로드일" value={formatDate(material.createdAt)} />
          <DetailTerm label="페이지" value={material.pageCount ? `${material.pageCount}쪽` : '-'} />
        </dl>

        {material.failureReason ? (
          <p className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 sm:px-5">
            {material.failureReason}
          </p>
        ) : null}
      </section>

      {memory ? (
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-stone-950">학습 분석</h2>
            {memory.memoryDigest ? (
              <p className="mt-1 text-sm leading-6 text-stone-600">
                {memory.memoryDigest}
              </p>
            ) : null}
          </div>
          <dl className="grid divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {memory.strengths.length > 0 ? (
              <div className="px-4 py-4 sm:px-5">
                <dt className="text-xs font-semibold text-emerald-700">강점</dt>
                <dd className="mt-2 space-y-1 text-sm text-stone-700">
                  {memory.strengths.map((strength) => (
                    <p key={strength}>{strength}</p>
                  ))}
                </dd>
              </div>
            ) : null}
            {memory.weaknesses.length > 0 ? (
              <div className="px-4 py-4 sm:px-5">
                <dt className="text-xs font-semibold text-amber-700">보완할 부분</dt>
                <dd className="mt-2 space-y-1 text-sm text-stone-700">
                  {memory.weaknesses.map((weakness) => (
                    <p key={weakness}>{weakness}</p>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {material.activeSessionId ? (
        <section className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-amber-700"
              size={18}
            />
            <div>
              <h2 className="text-sm font-bold text-amber-950">활성 세션 충돌 안내</h2>
              <p className="mt-1 text-sm text-amber-900">
                이 자료에는 이미 진행 중인 학습 세션이 있습니다.
              </p>
            </div>
          </div>
          <ButtonLink
            className="shrink-0"
            to={sessionDetailPath(material.activeSessionId)}
            variant="secondary"
          >
            진행 중인 세션으로
            <ArrowRight aria-hidden="true" size={15} />
          </ButtonLink>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-stone-950">학습 시작</h2>
            <p className="mt-1 text-sm text-stone-500">
              자료 처리가 완료되면 이 자료로 새 학습 세션을 시작합니다.
            </p>
          </div>
          <Button
            disabled={material.status !== 'READY' || isStarting}
            onClick={startLearning}
            type="button"
          >
            <Play aria-hidden="true" size={15} />
            {isStarting ? '세션 생성 중' : '학습 시작'}
          </Button>
          {error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      )}
    </div>
  )
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 sm:border-r sm:border-stone-200 sm:px-5 last:sm:border-r-0">
      <dt className="text-xs font-semibold text-stone-500">{label}</dt>
      <dd className="mt-2 text-sm font-bold text-stone-950">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  return <Badge tone={statusTone[status]}>{getMaterialStatusLabel(status)}</Badge>
}

const statusTone: Record<MaterialStatus, 'danger' | 'success' | 'warning'> = {
  FAILED: 'danger',
  PROCESSING: 'warning',
  READY: 'success',
}
