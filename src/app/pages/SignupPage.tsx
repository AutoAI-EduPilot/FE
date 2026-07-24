import { Link } from 'react-router-dom'

import { Button, PageHeader, TextInput } from '../../shared/ui'
import { routes } from '../routes'

export function SignupPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Auth"
        title="회원가입"
        description="회원 생성 계약이 연결되면 제출 동작을 추가합니다."
      />

      <form className="mt-6 space-y-4">
        <TextInput id="signup-name" label="이름" placeholder="홍길동" />
        <TextInput id="signup-email" label="이메일" type="email" placeholder="user@example.com" />
        <TextInput id="signup-password" label="비밀번호" type="password" placeholder="password" />
        <Button type="button" disabled className="w-full">
          회원가입 준비 중
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        이미 계정이 있다면{' '}
        <Link
          to={routes.login}
          className="font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  )
}
