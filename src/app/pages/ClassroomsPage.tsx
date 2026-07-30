import { ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { routes } from '../routes'

export function ClassroomsPage() {
  usePageTitle('내 강의실')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Classrooms"
        title="내 강의실"
        description="참여 중인 강의실과 학습 진행 상황을 확인합니다."
      />

      <EmptyState
        title="표시할 강의실이 없습니다."
        description="강의실 조회 API가 연결되면 참여 중인 강의실이 이곳에 표시됩니다."
        action={
          <ButtonLink to={routes.materials} variant="secondary">
            내 자료 보기
          </ButtonLink>
        }
      />
    </div>
  )
}
