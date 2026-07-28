import { LogOut, UserX } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import { ApiClientError, getRequestErrorMessage } from '../../shared/api'
import { Button, Card, PageHeader, TextInput } from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function SettingsPage() {
  usePageTitle('설정')
  const { logout, user, withdraw } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  async function handleLogout() {
    await logout()
    navigate(routes.login, { replace: true })
  }

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isWithdrawing) return
    if (!password) {
      setPasswordError('비밀번호를 입력하세요.')
      return
    }
    if (
      !window.confirm(
        '정말 탈퇴할까요? 자료와 학습 세션이 삭제되며 복구할 수 없습니다.',
      )
    ) {
      return
    }

    setIsWithdrawing(true)
    setPasswordError(undefined)
    try {
      await withdraw(password)
      navigate(routes.login, { replace: true })
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === 'INVALID_CREDENTIALS'
      ) {
        setPasswordError('비밀번호가 올바르지 않습니다.')
      } else {
        setPasswordError(getRequestErrorMessage(error))
      }
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="설정"
        description="계정 정보를 확인하고 관리합니다."
      />

      <Card as="section" className="p-5 sm:p-6">
        <h2 className="text-base font-bold text-stone-950">프로필</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-stone-500">이름</dt>
            <dd className="mt-1.5 flex min-h-10 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-800">
              {user?.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-stone-500">이메일</dt>
            <dd className="mt-1.5 flex min-h-10 items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-800">
              {user?.email}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end border-t border-stone-100 pt-4">
          <Button onClick={() => void handleLogout()} type="button" variant="secondary">
            <LogOut aria-hidden="true" size={15} />
            로그아웃
          </Button>
        </div>
      </Card>

      <section className="rounded-xl border border-rose-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-rose-900">회원 탈퇴</h2>
        <p className="mt-1 text-sm text-stone-500">
          탈퇴하면 자료와 학습 세션이 삭제되고 복구할 수 없습니다. 계속하려면
          비밀번호를 입력하세요.
        </p>
        <form className="mt-4 space-y-4" noValidate onSubmit={handleWithdraw}>
          <TextInput
            autoComplete="current-password"
            error={passwordError}
            id="withdraw-password"
            label="비밀번호 확인"
            onChange={(event) => {
              setPassword(event.target.value)
              setPasswordError(undefined)
            }}
            type="password"
            value={password}
          />
          <div className="flex justify-end">
            <Button
              className="border-rose-700 bg-rose-700 hover:bg-rose-800"
              disabled={isWithdrawing}
              type="submit"
            >
              <UserX aria-hidden="true" size={15} />
              {isWithdrawing ? '탈퇴 처리 중' : '회원 탈퇴'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
