import { useParams } from 'react-router-dom'

import { ChatPanel } from '../../features/chat'
import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function SessionDetailPage() {
  const { sessionId } = useParams()
  const resolvedSessionId = sessionId ?? 'sample'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning Session"
        title="학습 공간"
        description={`세션 ${resolvedSessionId}의 질문과 스트리밍 응답을 확인합니다.`}
        actions={<Badge tone="info">BE#27 · BE#28</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <EmptyState
          title="PDF 뷰어 영역"
          description="PDF 페이지 동기화는 세션/PDF 기능 PR에서 연결합니다."
          action={
            <ButtonLink to={routes.sessions} variant="secondary">
              세션 목록으로
            </ButtonLink>
          }
        />
        <ChatPanel sessionId={resolvedSessionId} />
      </div>
    </div>
  )
}
