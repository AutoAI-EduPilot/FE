import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  hasFormErrors,
  mapMockAuthErrorToFormErrors,
  useAuth,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '../../features/auth'
import { Button, PageHeader, TextInput } from '../../shared/ui'
import { routes } from '../routes'

interface LoginLocationState {
  from?: string
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSessionExpired = searchParams.get('reason') === 'session-expired'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    if (hasFormErrors(nextErrors)) {
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      await login(values)
      navigate(getRedirectPath(location.state), { replace: true })
    } catch (error) {
      const formErrors = mapMockAuthErrorToFormErrors(error)

      if (formErrors) {
        setErrors(formErrors as LoginFormErrors)
      } else {
        setServerError('로그인 요청을 처리하지 못했습니다.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateValue(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Auth"
        title="로그인"
        description="학습 자료와 세션으로 이동하려면 계정 인증이 필요합니다."
      />

      {isSessionExpired ? (
        <p
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
          role="alert"
        >
          세션이 만료되었습니다. 다시 로그인하세요.
        </p>
      ) : null}

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <TextInput
          autoComplete="email"
          error={errors.email}
          id="login-email"
          label="이메일"
          onChange={(event) => updateValue('email', event.target.value)}
          placeholder="user@example.com"
          type="email"
          value={values.email}
        />
        <TextInput
          autoComplete="current-password"
          error={errors.password}
          id="login-password"
          label="비밀번호"
          onChange={(event) => updateValue('password', event.target.value)}
          placeholder="8자 이상"
          type="password"
          value={values.password}
        />
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? '로그인 중' : '로그인'}
        </Button>
      </form>

      {serverError ? (
        <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
          {serverError}
        </p>
      ) : null}

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

function getRedirectPath(state: unknown): string {
  if (isLoginLocationState(state) && state.from?.startsWith('/')) {
    return state.from
  }

  return routes.materials
}

function isLoginLocationState(state: unknown): state is LoginLocationState {
  return typeof state === 'object' && state !== null && 'from' in state
}
