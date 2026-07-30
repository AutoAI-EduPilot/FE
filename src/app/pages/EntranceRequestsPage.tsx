import { isInstructorRole, useAuth } from '../../features/auth'
import { ButtonLink, EmptyState, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { routes } from '../routes'

export function EntranceRequestsPage() {
  usePageTitle('입장 요청')
  const { user } = useAuth()

  if (!isInstructorRole(user?.role)) {
    return (
      <EmptyState
        title="강의자 전용 화면입니다."
        description="입장 요청 관리는 강의자 계정에서만 사용할 수 있습니다."
        action={
          <ButtonLink to={routes.classrooms} variant="secondary">
            내 강의실로
          </ButtonLink>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Classroom access"
        title="입장 요청"
        description="초대 코드로 참여를 요청한 학습자를 확인하고 승인합니다."
      />
      <EmptyState
        title="표시할 입장 요청이 없습니다."
        description="입장 요청 API가 연결되면 실제 승인 대기 목록과 처리 내역이 이곳에 표시됩니다."
      />
    </div>
  )
}
