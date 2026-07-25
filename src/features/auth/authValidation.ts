export interface LoginFormValues {
  email: string
  password: string
}

export interface SignupFormValues extends LoginFormValues {
  name: string
  passwordConfirm: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>
export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}

  if (!values.email.trim()) {
    errors.email = '이메일을 입력하세요.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력하세요.'
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }

  return errors
}

export function validateSignupForm(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = { ...validateLoginForm(values) }

  if (!values.name.trim()) {
    errors.name = '이름을 입력하세요.'
  } else if (values.name.trim().length < 2) {
    errors.name = '이름은 2자 이상이어야 합니다.'
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력하세요.'
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  return errors
}

export function hasFormErrors(errors: LoginFormErrors | SignupFormErrors): boolean {
  return Object.keys(errors).length > 0
}
