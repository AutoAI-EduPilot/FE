import { ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { routes } from '../routes'

export function ClassroomDetailPage() {
  usePageTitle('강의실')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Classrooms"
        title="강의실"
        description="강의실 자료와 학습 진행 상황을 확인합니다."
      />

      <EmptyState
        title="강의실 정보를 불러올 수 없습니다."
        description="강의실 상세 조회 API가 연결되면 실제 강의실 정보가 표시됩니다."
        action={
          <ButtonLink to={routes.classrooms} variant="secondary">
            강의실 목록으로
          </ButtonLink>
        }
      />
    </div>
  )
}
