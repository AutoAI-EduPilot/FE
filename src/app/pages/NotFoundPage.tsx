import { ButtonLink, ErrorState } from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없음')
  return (
    <ErrorState
      title="페이지를 찾을 수 없습니다."
      description="주소를 확인하거나 내 강의실로 돌아가세요."
      action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>}
    />
  )
}
