import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import {
  hasFormErrors,
  mapMockAuthErrorToFormErrors,
  useAuth,
  validateSignupForm,
  type SignupFormErrors,
  type SignupFormValues,
} from '../../features/auth'
import { Button, PageHeader, TextInput } from '../../shared/ui'
import { routes } from '../routes'

const initialValues: SignupFormValues = {
  email: '',
  name: '',
  password: '',
  passwordConfirm: '',
}

export function SignupPage() {
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

    if (hasFormErrors(nextErrors)) {
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      await signup(values)
      navigate(routes.materials, { replace: true })
    } catch (error) {
      const formErrors = mapMockAuthErrorToFormErrors(error)

      if (formErrors) {
        setErrors(formErrors as SignupFormErrors)
      } else {
        setServerError('회원가입 요청을 처리하지 못했습니다.')
      }
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
      <PageHeader
        eyebrow="Auth"
        title="회원가입"
        description="학습 자료와 세션을 관리할 계정을 만듭니다."
      />

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
          placeholder="8자 이상"
          type="password"
          value={values.password}
        />
        <TextInput
          autoComplete="new-password"
          error={errors.passwordConfirm}
          id="signup-password-confirm"
          label="비밀번호 확인"
          onChange={(event) => updateValue('passwordConfirm', event.target.value)}
          placeholder="8자 이상"
          type="password"
          value={values.passwordConfirm}
        />
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? '가입 중' : '회원가입'}
        </Button>
      </form>

      {serverError ? (
        <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
          {serverError}
        </p>
      ) : null}

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
