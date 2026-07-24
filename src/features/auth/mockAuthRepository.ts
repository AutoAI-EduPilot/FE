import type { AuthUser } from './authContext'
import type {
  LoginFormErrors,
  LoginFormValues,
  SignupFormErrors,
  SignupFormValues,
} from './authValidation'

export class MockAuthValidationError extends Error {
  constructor(
    message: string,
    readonly formErrors: LoginFormErrors | SignupFormErrors,
  ) {
    super(message)
    this.name = 'MockAuthValidationError'
  }
}

export interface MockAuthRepository {
  login: (values: LoginFormValues) => Promise<AuthUser>
  logout: () => Promise<void>
  signup: (values: SignupFormValues) => Promise<AuthUser>
}

export const mockAuthRepository: MockAuthRepository = {
  async login(values) {
    await waitForMockAuth()
    const email = values.email.trim().toLowerCase()

    if (email === 'locked@example.com') {
      throw new MockAuthValidationError('Mock login rejected', {
        email: '가입되지 않았거나 비활성화된 계정입니다.',
      })
    }

    return {
      email,
      name: getNameFromEmail(email),
    }
  },

  async logout() {
    await waitForMockAuth()
  },

  async signup(values) {
    await waitForMockAuth()
    const email = values.email.trim().toLowerCase()

    if (email === 'taken@example.com') {
      throw new MockAuthValidationError('Mock signup rejected', {
        email: '이미 가입된 이메일입니다.',
      })
    }

    return {
      email,
      name: values.name.trim(),
    }
  },
}

export function mapMockAuthErrorToFormErrors(
  error: unknown,
): LoginFormErrors | SignupFormErrors | null {
  if (error instanceof MockAuthValidationError) {
    return error.formErrors
  }

  return null
}

function getNameFromEmail(email: string): string {
  return email.trim().split('@')[0] || 'EduPilot 사용자'
}

function waitForMockAuth(): Promise<void> {
  return Promise.resolve()
}
