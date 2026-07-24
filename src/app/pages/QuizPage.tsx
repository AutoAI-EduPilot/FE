import { useParams } from 'react-router-dom'

import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function QuizPage() {
  const { quizId } = useParams()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quiz"
        title="퀴즈"
        description={`퀴즈 ${quizId ?? '-'}의 문항, 제출, 결과 화면이 들어갈 route입니다.`}
        actions={<Badge tone="warning">BE#33 연동 예정</Badge>}
      />

      <EmptyState
        title="퀴즈 풀이 화면이 준비되었습니다."
        description="공개 문항 조회와 제출 결과 렌더링은 퀴즈 API 계약에 맞춰 연결합니다."
        action={
          <ButtonLink to={routes.sessions} variant="secondary">
            세션 화면으로
          </ButtonLink>
        }
      />
    </div>
  )
}
