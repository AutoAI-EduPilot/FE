import type {
  LoginFormErrors,
  SignupFormErrors,
} from './authValidation'

export class AuthValidationError extends Error {
  constructor(
    message: string,
    readonly formErrors: LoginFormErrors | SignupFormErrors,
  ) {
    super(message)
    this.name = 'AuthValidationError'
  }
}

export function mapAuthErrorToFormErrors(
  error: unknown,
): LoginFormErrors | SignupFormErrors | null {
  return error instanceof AuthValidationError ? error.formErrors : null
}
