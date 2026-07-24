import { Link } from 'react-router-dom'

import { Button, PageHeader, TextInput } from '../../shared/ui'
import { routes } from '../routes'

export function LoginPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Auth"
        title="로그인"
        description="인증 API 연결 전까지 화면 구조만 준비합니다."
      />

      <form className="mt-6 space-y-4">
        <TextInput id="login-email" label="이메일" type="email" placeholder="user@example.com" />
        <TextInput id="login-password" label="비밀번호" type="password" placeholder="password" />
        <Button type="button" disabled className="w-full">
          로그인 준비 중
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        계정이 없다면{' '}
        <Link
          to={routes.signup}
          className="font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  )
}
