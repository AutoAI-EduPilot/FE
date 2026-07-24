import { ButtonLink, ErrorState } from '../../shared/ui'
import { routes } from '../routes'

export function NotFoundPage() {
  return (
    <ErrorState
      title="페이지를 찾을 수 없습니다."
      description="주소를 확인하거나 자료 화면으로 돌아가세요."
      action={<ButtonLink to={routes.materials}>자료 화면으로</ButtonLink>}
    />
  )
}
