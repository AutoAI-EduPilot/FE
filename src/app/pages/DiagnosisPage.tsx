import { useParams } from 'react-router-dom'

import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { sessionDetailPath } from '../routes'

export function DiagnosisPage() {
  const { diagnosisId, sessionId } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnosis"
        title="진단·교정"
        description={`진단 ${diagnosisId ?? '-'}의 질문 표시와 교정 응답이 들어갈 route입니다.`}
        actions={<Badge tone="warning">BE#40 연동 예정</Badge>}
      />

      <EmptyState
        title="진단 화면 구조가 준비되었습니다."
        description="진단 답변 제출과 교정 렌더링은 후속 기능 이슈에서 연결합니다."
        action={
          <ButtonLink to={sessionDetailPath(sessionId ?? 'sample')} variant="secondary">
            학습 화면으로
          </ButtonLink>
        }
      />
    </div>
  )
}
