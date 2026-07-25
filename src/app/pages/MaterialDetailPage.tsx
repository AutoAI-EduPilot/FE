import { useParams } from 'react-router-dom'

import {
  findMockMaterial,
  getMaterialStatusLabel,
  type MaterialStatus,
} from '../../features/materials'
import { Badge, Button, ButtonLink, ErrorState, PageHeader } from '../../shared/ui'
import { routes, sessionDetailPath } from '../routes'

export function MaterialDetailPage() {
  const { materialId } = useParams()
  const material = findMockMaterial(materialId)

  if (!material) {
    return (
      <ErrorState
        title="자료를 찾을 수 없습니다."
        description="목록에서 다시 선택하세요."
        action={<ButtonLink to={routes.materials}>자료 목록으로</ButtonLink>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Material Detail"
        title={material.title}
        description="자료 처리 상태와 학습 진입 가능 여부를 확인합니다."
        actions={<StatusBadge status={material.status} />}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailTerm label="상태" value={getMaterialStatusLabel(material.status)} />
          <DetailTerm label="파일 크기" value={formatFileSize(material.fileSizeBytes)} />
          <DetailTerm label="업로드일" value={material.createdAt} />
          <DetailTerm label="페이지" value={material.pageCount ? `${material.pageCount}쪽` : '-'} />
        </dl>

        {material.failureReason ? (
          <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
            {material.failureReason}
          </p>
        ) : null}
      </section>

      {material.activeSessionId ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h2 className="text-lg font-bold">활성 세션 충돌 안내</h2>
          <p className="mt-2 text-sm leading-6">
            이 자료에는 이미 진행 중인 학습 세션이 있습니다.
          </p>
          <ButtonLink
            className="mt-4"
            to={sessionDetailPath(material.activeSessionId)}
            variant="secondary"
          >
            진행 중인 세션으로
          </ButtonLink>
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">학습 시작</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            READY 상태가 되면 이 자료로 새 학습 세션을 시작합니다.
          </p>
          <Button className="mt-4" disabled={material.status !== 'READY'} type="button">
            학습 시작
          </Button>
        </section>
      )}
    </div>
  )
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-950">{value}</dd>
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

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
