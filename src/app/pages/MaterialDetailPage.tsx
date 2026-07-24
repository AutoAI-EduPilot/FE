import { useParams } from 'react-router-dom'

import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function MaterialDetailPage() {
  const { materialId } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Material Detail"
        title="자료 상세"
        description={`자료 ${materialId ?? '-'}의 상세 정보와 처리 상태가 표시될 화면입니다.`}
        actions={<Badge tone="warning">BE#48 연동 예정</Badge>}
      />

      <EmptyState
        title="자료 상세 영역이 준비되었습니다."
        description="자료 상세 API가 연결되면 제목, 페이지 수, 처리 상태, 학습 시작 진입점을 배치합니다."
        action={
          <ButtonLink to={routes.materials} variant="secondary">
            자료 목록으로
          </ButtonLink>
        }
      />
    </div>
  )
}
