import { ArrowLeft, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  hasFormErrors,
  mapAuthErrorToFormErrors,
  useAuth,
  validateSignupForm,
  type SignupFormErrors,
  type SignupFormValues,
} from '../../features/auth'
import { Button, TextInput } from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const initialValues: SignupFormValues = {
  email: '',
  name: '',
  password: '',
  passwordConfirm: '',
}

export function SignupPage() {
  usePageTitle('회원가입')
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<SignupFormValues>(initialValues)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    if (hasFormErrors(nextErrors)) return

    setIsSubmitting(true)
    setServerError(null)
    try {
      await signup(values)
      navigate(routes.materials, { replace: true })
    } catch (error) {
      const formErrors = mapAuthErrorToFormErrors(error)
      if (formErrors) setErrors(formErrors as SignupFormErrors)
      else setServerError('회원가입 요청을 처리하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function updateValue(field: keyof SignupFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError(null)
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-stone-900">회원가입</h1>
        <p className="text-sm text-stone-400">학습 자료와 세션을 관리할 계정을 만듭니다</p>
      </div>

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <TextInput
          autoComplete="name"
          error={errors.name}
          id="signup-name"
          label="이름"
          onChange={(event) => updateValue('name', event.target.value)}
          placeholder="홍길동"
          value={values.name}
        />
        <TextInput
          autoComplete="email"
          error={errors.email}
          id="signup-email"
          label="이메일"
          onChange={(event) => updateValue('email', event.target.value)}
          placeholder="user@example.com"
          type="email"
          value={values.email}
        />
        <TextInput
          autoComplete="new-password"
          error={errors.password}
          id="signup-password"
          label="비밀번호"
          onChange={(event) => updateValue('password', event.target.value)}
          placeholder="영문·숫자 포함 8~64자"
          type="password"
          value={values.password}
        />
        <TextInput
          autoComplete="new-password"
          error={errors.passwordConfirm}
          id="signup-password-confirm"
          label="비밀번호 확인"
          onChange={(event) => updateValue('passwordConfirm', event.target.value)}
          placeholder="영문·숫자 포함 8~64자"
          type="password"
          value={values.passwordConfirm}
        />
        <Button className="w-full" disabled={isSubmitting} type="submit">
          <UserPlus aria-hidden="true" size={15} />
          {isSubmitting ? '가입 중' : '회원가입'}
        </Button>
      </form>

      {serverError ? (
        <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
          {serverError}
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-stone-600">
        이미 계정이 있다면{' '}
        <Link
          to={routes.login}
          className="inline-flex items-center gap-1 font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={14} />
          로그인
        </Link>
      </p>
    </div>
  )
}
