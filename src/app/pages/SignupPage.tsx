import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Presentation,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  hasFormErrors,
  mapAuthErrorToFormErrors,
  useAuth,
  validateSignupForm,
  type SignupFormErrors,
  type SignupFormValues,
} from '../../features/auth'
import { Button } from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const initialValues: SignupFormValues = {
  email: '',
  name: '',
  password: '',
}

type SignupRole = 'instructor' | 'learner'
type SignupStep = 'account' | 'role'

const roleOptions: Array<{
  description: string
  icon: LucideIcon
  label: string
  value: SignupRole
}> = [
  {
    description:
      '초대코드로 강의실에 참여하고, 자료를 보며 AI와 학습해요',
    icon: GraduationCap,
    label: '학습자',
    value: 'learner',
  },
  {
    description:
      '강의실을 만들어 자료를 올리고, 초대코드로 학습자를 초대해요',
    icon: Presentation,
    label: '강의자',
    value: 'instructor',
  },
]

const AFFILIATIONS = [
  { name: '서울대학교', type: '대학교' },
  { name: '서울과학기술대학교', type: '대학교' },
  { name: '서울시립대학교', type: '대학교' },
  { name: '연세대학교', type: '대학교' },
  { name: '고려대학교', type: '대학교' },
]

export function SignupPage() {
  usePageTitle('회원가입')
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<SignupStep>('role')
  // BE SignupRequest에 role이 없어 현재 선택은 가입 흐름 UI 상태로만 유지한다.
  const [selectedRole, setSelectedRole] = useState<SignupRole>('learner')
  const [values, setValues] = useState<SignupFormValues>(initialValues)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [affiliation, setAffiliation] = useState('')
  const [isAffiliationOpen, setIsAffiliationOpen] = useState(false)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [acceptsLearningEmails, setAcceptsLearningEmails] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)
  const affiliationContainerRef = useRef<HTMLDivElement | null>(null)

  const filteredAffiliations = useMemo(() => {
    const query = affiliation.trim().toLowerCase()
    if (!query) return AFFILIATIONS.slice(0, 3)
    return AFFILIATIONS.filter((item) =>
      item.name.toLowerCase().includes(query),
    ).slice(0, 3)
  }, [affiliation])

  useEffect(() => {
    if (!isAffiliationOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (
        !affiliationContainerRef.current?.contains(event.target as Node)
      ) {
        setIsAffiliationOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [isAffiliationOpen])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    if (!hasAcceptedTerms) {
      setTermsError('필수 약관에 동의해 주세요.')
    }
    if (hasFormErrors(nextErrors) || !hasAcceptedTerms) return

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

  const selectedRoleLabel =
    selectedRole === 'instructor' ? '강의자' : '학습자'
  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    values.email.trim(),
  )
  const passwordStrength = getPasswordStrength(values.password)

  if (step === 'role') {
    return (
      <div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-stone-400">회원가입 1 / 2</p>
          <h1 className="text-2xl font-bold text-stone-900">
            어떤 역할로 사용하시나요?
          </h1>
          <p className="text-sm text-stone-400">
            가입 후에도 설정에서 변경할 수 있어요
          </p>
        </div>

        <div
          aria-label="사용 역할"
          className="mt-6 grid gap-3"
          role="radiogroup"
        >
          {roleOptions.map((option) => {
            const isSelected = selectedRole === option.value

            return (
              <button
                aria-checked={isSelected}
                className={[
                  'flex min-h-21 w-full items-center gap-4 rounded-xl border p-5 text-left transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  isSelected
                    ? 'border-[1.5px] border-brand-600 bg-brand-50'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50',
                ].join(' ')}
                key={option.value}
                onClick={() => setSelectedRole(option.value)}
                role="radio"
                type="button"
              >
                <span
                  className={[
                    'flex size-11 shrink-0 items-center justify-center rounded-[11px]',
                    isSelected
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-stone-100 text-stone-500',
                  ].join(' ')}
                >
                  <option.icon aria-hidden="true" size={21} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[15.5px] font-bold text-stone-900">
                    {option.label}
                  </strong>
                  <span className="mt-0.5 block text-[13px] leading-5 text-stone-600">
                    {option.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    'flex size-5 shrink-0 items-center justify-center rounded-full',
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'border-[1.5px] border-stone-200',
                  ].join(' ')}
                >
                  {isSelected ? <Check size={12} strokeWidth={2.5} /> : null}
                </span>
              </button>
            )
          })}
        </div>

        <Button
          className="mt-6 h-11 w-full"
          onClick={() => setStep('account')}
          type="button"
        >
          다음
          <ArrowRight aria-hidden="true" size={15} />
        </Button>

        <p className="mt-6 text-center text-sm text-stone-600">
          이미 계정이 있다면{' '}
          <Link
            to={routes.login}
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] text-stone-400">
          회원가입 2 / 2 ·{' '}
          <strong className="font-semibold text-brand-600">
            {selectedRoleLabel}
          </strong>
        </p>
        <h1 className="text-2xl font-bold text-stone-900">
          계정 정보를 입력하세요
        </h1>
      </div>

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              className="text-[13px] font-semibold text-stone-800"
              htmlFor="signup-name"
            >
              이름
            </label>
            {errors.name ? (
              <p
                className="text-xs font-medium text-rose-700"
                id="signup-name-error"
                role="alert"
              >
                {errors.name}
              </p>
            ) : null}
          </div>
          <input
            aria-describedby={errors.name ? 'signup-name-error' : undefined}
            aria-invalid={errors.name ? true : undefined}
            autoComplete="name"
            className={`${fieldClassName(Boolean(errors.name), '')} mt-1`}
            id="signup-name"
            onChange={(event) => updateValue('name', event.target.value)}
            placeholder="홍길동"
            value={values.name}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              className="text-[13px] font-semibold text-stone-800"
              htmlFor="signup-email"
            >
              이메일
            </label>
            {errors.email ? (
              <p
                className="text-xs font-medium text-rose-700"
                id="signup-email-error"
                role="alert"
              >
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="relative mt-1">
            <input
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="email"
              className={fieldClassName(Boolean(errors.email), 'pr-24')}
              id="signup-email"
              onChange={(event) => updateValue('email', event.target.value)}
              placeholder="user@example.com"
              type="email"
              value={values.email}
            />
            {isEmailFormatValid && !errors.email ? (
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] font-semibold text-emerald-700">
                ✓ 사용 가능
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              className="text-[13px] font-semibold text-stone-800"
              htmlFor="signup-password"
            >
              비밀번호
            </label>
            {errors.password ? (
              <p
                className="text-xs font-medium text-rose-700"
                id="signup-password-error"
                role="alert"
              >
                {errors.password}
              </p>
            ) : null}
          </div>
          <div className="relative mt-1">
            <input
              aria-describedby={
                errors.password ? 'signup-password-error' : 'password-strength'
              }
              aria-invalid={errors.password ? true : undefined}
              autoComplete="new-password"
              className={fieldClassName(Boolean(errors.password), 'pr-11')}
              id="signup-password"
              onChange={(event) => updateValue('password', event.target.value)}
              placeholder="영문·숫자 포함 8~64자"
              type={isPasswordVisible ? 'text' : 'password'}
              value={values.password}
            />
            <button
              aria-label={
                isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 표시'
              }
              className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded text-stone-400 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              type="button"
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
            </button>
          </div>
          <div
            aria-live="polite"
            className="mt-2 flex items-center gap-1.5"
            id="password-strength"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <span
                className={[
                  'h-1 flex-1 rounded-full',
                  index < passwordStrength.score
                    ? passwordStrength.barClassName
                    : 'bg-stone-200',
                ].join(' ')}
                key={index}
              />
            ))}
            <span
              className={[
                'ml-1.5 min-w-9 text-right text-[11px] font-semibold',
                passwordStrength.labelClassName,
              ].join(' ')}
            >
              {passwordStrength.label}
            </span>
          </div>
        </div>

        <div className="relative" ref={affiliationContainerRef}>
          <label
            className="text-[13px] font-semibold text-stone-800"
            htmlFor="signup-affiliation"
          >
            소속{' '}
            <span className="font-normal text-stone-400">(선택)</span>
          </label>
          <div className="relative mt-1">
            <input
              aria-autocomplete="list"
              aria-controls="affiliation-options"
              aria-expanded={isAffiliationOpen}
              autoComplete="organization"
              className={fieldClassName(false, 'pr-10')}
              id="signup-affiliation"
              onChange={(event) => {
                setAffiliation(event.target.value)
                setIsAffiliationOpen(true)
              }}
              onFocus={() => setIsAffiliationOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsAffiliationOpen(false)
              }}
              placeholder="학교 · 기관"
              role="combobox"
              value={affiliation}
            />
            <ChevronUp
              aria-hidden="true"
              className={[
                'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 transition-transform',
                isAffiliationOpen ? '' : 'rotate-180',
              ].join(' ')}
              size={15}
            />
          </div>

          {isAffiliationOpen ? (
            <div
              className="absolute top-[calc(100%+5px)] right-0 left-0 z-20 overflow-hidden rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
              id="affiliation-options"
              role="listbox"
            >
              {filteredAffiliations.map((item, index) => (
                <button
                  className={[
                    'flex h-9 w-full items-center rounded-md px-3 text-left text-[13px] text-stone-700 hover:bg-stone-50',
                    index === 0 ? 'bg-stone-100 font-semibold text-stone-900' : '',
                  ].join(' ')}
                  key={item.name}
                  onClick={() => {
                    setAffiliation(item.name)
                    setIsAffiliationOpen(false)
                  }}
                  role="option"
                  type="button"
                >
                  {item.name}
                  <span className="ml-auto text-[11px] font-normal text-stone-400">
                    {item.type}
                  </span>
                </button>
              ))}
              <div className="mx-2 my-1 h-px bg-stone-100" />
              <button
                className="flex h-9 w-full items-center rounded-md px-3 text-left text-[13px] font-semibold text-brand-700 hover:bg-brand-50"
                onClick={() => setIsAffiliationOpen(false)}
                type="button"
              >
                + “{affiliation.trim() || '소속'}” 직접 입력
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 pt-1">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-stone-600">
            <input
              checked={hasAcceptedTerms}
              className="size-4 shrink-0 rounded border-stone-300 accent-brand-600"
              onChange={(event) => {
                setHasAcceptedTerms(event.target.checked)
                setTermsError(null)
              }}
              type="checkbox"
            />
            <span>
              이용약관 및 개인정보 처리방침 동의{' '}
              <span className="font-semibold text-rose-600">*</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5 text-stone-600">
            <input
              checked={acceptsLearningEmails}
              className="size-4 shrink-0 rounded border-stone-300 accent-brand-600"
              onChange={(event) => setAcceptsLearningEmails(event.target.checked)}
              type="checkbox"
            />
            학습 소식 이메일 수신 (선택)
          </label>
          {termsError ? (
            <p className="text-xs font-medium text-rose-700" role="alert">
              {termsError}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            className="h-11 shrink-0 px-5"
            onClick={() => setStep('role')}
            type="button"
            variant="secondary"
          >
            <ArrowLeft aria-hidden="true" size={15} />
            이전
          </Button>
          <Button className="h-11 flex-1" disabled={isSubmitting} type="submit">
            {isSubmitting ? '가입 중' : '가입 완료'}
          </Button>
        </div>
      </form>

      {serverError ? (
        <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
          {serverError}
        </p>
      ) : null}

    </div>
  )
}

function fieldClassName(hasError: boolean, spacingClassName: string): string {
  return [
    'block h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-stone-950',
    'placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100',
    hasError ? 'border-rose-400' : 'border-stone-300',
    spacingClassName,
  ].join(' ')
}

function getPasswordStrength(password: string): {
  barClassName: string
  label: string
  labelClassName: string
  score: number
} {
  if (!password) {
    return {
      barClassName: 'bg-stone-300',
      label: '',
      labelClassName: 'text-stone-400',
      score: 0,
    }
  }

  const score = [
    password.length >= 8,
    /[a-z]/i.test(password),
    /\d/.test(password),
    password.length >= 12 || /[^a-z\d]/i.test(password),
  ].filter(Boolean).length

  if (score >= 3) {
    return {
      barClassName: 'bg-emerald-600',
      label: '안전',
      labelClassName: 'text-emerald-700',
      score,
    }
  }

  if (score === 2) {
    return {
      barClassName: 'bg-amber-500',
      label: '보통',
      labelClassName: 'text-amber-700',
      score,
    }
  }

  return {
    barClassName: 'bg-rose-500',
    label: '약함',
    labelClassName: 'text-rose-700',
    score: Math.max(1, score),
  }
}
