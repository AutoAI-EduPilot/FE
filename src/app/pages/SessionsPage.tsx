import { Badge, ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sessions"
        title="학습 세션"
        description="세션 목록, 진입, 재진입 복원 기능이 들어갈 기본 화면입니다."
        actions={<Badge tone="warning">BE#20 연동 예정</Badge>}
      />

      <EmptyState
        title="진행 중인 세션이 없습니다."
        description="세션 API가 연결되면 최근 학습 기록과 재진입 버튼이 이 영역에 표시됩니다."
        action={
          <ButtonLink to={routes.materials} variant="secondary">
            자료 화면으로
          </ButtonLink>
        }
      />
    </div>
  )
}
