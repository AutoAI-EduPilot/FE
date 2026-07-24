import { useParams } from 'react-router-dom'

import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function SessionDetailPage() {
  const { sessionId } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning Session"
        title="학습 공간"
        description={`세션 ${sessionId ?? '-'}의 PDF 뷰어와 학습 채팅이 연결될 화면입니다.`}
        actions={<Badge tone="info">BE#20 · BE#28</Badge>}
      />

      <EmptyState
        title="학습 화면 구조가 준비되었습니다."
        description="PDF 동기화, 메시지 목록, 스트리밍 답변 렌더링은 후속 기능 이슈에서 연결합니다."
        action={
          <ButtonLink to={routes.sessions} variant="secondary">
            세션 목록으로
          </ButtonLink>
        }
      />
    </div>
  )
}
