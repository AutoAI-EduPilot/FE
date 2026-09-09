import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  apiRequest as requestApi,
  ApiClientError,
  rawApiRequest as requestRawApi,
} from '../../shared/api'
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type LogoutReason,
} from './authContext'
import { getAuthRepository } from './authRepository'
import type {
  GoogleAuthValues,
  LoginFormValues,
  SignupFormValues,
} from './authValidation'

interface AuthProviderProps {
  initialUser?: AuthUser | null
}

export const AUTH_IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const AUTH_IDLE_WARNING_MS = 28 * 60 * 1000
export const AUTH_RESTORE_TIMEOUT_MS = 5_000
export const AUTH_REFRESH_TIMEOUT_MS = 10_000
const IDLE_CHECK_INTERVAL_MS = 30_000

interface AuthSession {
  accessToken: string
  user: AuthUser
}

export function AuthProvider({
  children,
  initialUser,
}: PropsWithChildren<AuthProviderProps>) {
  const hasExplicitInitialUser = initialUser !== undefined
  const [session, setSession] = useState<AuthSession | null>(() =>
    initialUser
      ? { accessToken: 'test-access-token', user: initialUser }
      : null,
  )
  const [isInitializing, setIsInitializing] = useState(!hasExplicitInitialUser)
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null)
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false)
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(
    null,
  )
  const sessionRef = useRef(session)
  const sessionRevisionRef = useRef(0)
  // 로그인/복원 시점에 beginSession·restore가 현재 시각으로 초기화한다.
  const lastActivityAtRef = useRef(0)
  const examInProgressRef = useRef(false)
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)
  const repository = getAuthRepository()

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const clearSession = useCallback((reason: LogoutReason) => {
    sessionRevisionRef.current += 1
    sessionRef.current = null
    setSession(null)
    setLogoutReason(reason)
    setIsIdleWarningOpen(false)
  }, [])

  const setExamInProgress = useCallback((isInProgress: boolean) => {
    examInProgressRef.current = isInProgress
    if (!isInProgress) setIsIdleWarningOpen(false)
  }, [])

  // access 재발급 — 동시 401이 몰려도 refresh 호출은 하나만 나간다.
  const renewAccessToken = useCallback((): Promise<string | null> => {
    if (!refreshPromiseRef.current) {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        AUTH_REFRESH_TIMEOUT_MS,
      )

      refreshPromiseRef.current = repository
        .refresh(controller.signal)
        .then((accessToken) => {
          const current = sessionRef.current
          if (current) {
            const nextSession = { ...current, accessToken }
            sessionRef.current = nextSession
            setSession(nextSession)
          }
          return accessToken
        })
        .catch((error: unknown) => {
          if (
            error instanceof ApiClientError &&
            (error.status === 401 || error.status === 403)
          ) {
            return null
          }
          throw error
        })
        .finally(() => {
          window.clearTimeout(timeoutId)
          refreshPromiseRef.current = null
        })
    }

    return refreshPromiseRef.current
  }, [repository])

  // 초기 진입/새로고침: refresh 쿠키로 세션 복원 (DEC-004 — access는 메모리에만 보관)
  useEffect(() => {
    if (hasExplicitInitialUser) {
      return
    }

    const controller = new AbortController()
    let isActive = true
    const restoreRevision = sessionRevisionRef.current
    const timeoutId = window.setTimeout(() => {
      controller.abort()
      if (isActive) setIsInitializing(false)
    }, AUTH_RESTORE_TIMEOUT_MS)

    repository
      .refresh(controller.signal)
      .then(async (accessToken) => {
        const user = await repository.getMe(accessToken, controller.signal)
        if (
          controller.signal.aborted ||
          restoreRevision !== sessionRevisionRef.current
        ) {
          return
        }
        lastActivityAtRef.current = Date.now()
        const restoredSession = { accessToken, user }
        sessionRef.current = restoredSession
        setSession(restoredSession)
      })
      .catch(() => {
        // 쿠키 없음/만료(TOKEN_INVALID) — 비로그인 상태로 시작 (배너 없음)
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
        if (isActive) setIsInitializing(false)
      })

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [hasExplicitInitialUser, repository])

  // 30분 무활동 시 로그아웃 (refresh 쿠키도 폐기)
  useEffect(() => {
    if (!session || hasExplicitInitialUser) {
      return
    }

    const recordActivity = () => {
      lastActivityAtRef.current = Date.now()
      setIsIdleWarningOpen(false)
    }

    const checkIdle = () => {
      if (!sessionRef.current) return
      const elapsedMs = Date.now() - lastActivityAtRef.current

      if (
        examInProgressRef.current &&
        document.visibilityState !== 'visible'
      ) {
        return
      }

      if (elapsedMs >= AUTH_IDLE_TIMEOUT_MS) {
        void repository.logout().catch(() => undefined)
        clearSession('idle')
      } else if (
        examInProgressRef.current &&
        elapsedMs >= AUTH_IDLE_WARNING_MS
      ) {
        setIsIdleWarningOpen(true)
      }
    }

    const checkVisibility = () => {
      if (document.visibilityState !== 'visible') return

      if (
        examInProgressRef.current &&
        Date.now() - lastActivityAtRef.current >= AUTH_IDLE_TIMEOUT_MS
      ) {
        // 시험 중 자료를 확인하고 돌아온 사용자를 즉시 내보내지 않고
        // 경고에 응답할 2분을 다시 보장한다.
        lastActivityAtRef.current = Date.now() - AUTH_IDLE_WARNING_MS
        setIsIdleWarningOpen(true)
        return
      }

      checkIdle()
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    )
    document.addEventListener('visibilitychange', checkVisibility)
    const intervalId = window.setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS)

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity),
      )
      document.removeEventListener('visibilitychange', checkVisibility)
      window.clearInterval(intervalId)
    }
  }, [clearSession, hasExplicitInitialUser, repository, session])

  const beginSession = useCallback((accessToken: string, user: AuthUser) => {
    sessionRevisionRef.current += 1
    lastActivityAtRef.current = Date.now()
    const nextSession = { accessToken, user }
    sessionRef.current = nextSession
    setLogoutReason(null)
    setIsIdleWarningOpen(false)
    setSession(nextSession)
  }, [])

  const login = useCallback(
    async (values: LoginFormValues) => {
      const result = await repository.login(values)
      beginSession(result.accessToken, result.user)
      return result.user
    },
    [beginSession, repository],
  )

  const loginWithGoogle = useCallback(
    async (values: GoogleAuthValues) => {
      const result = await repository.loginWithGoogle(values)
      setPendingGoogleIdToken(null)
      beginSession(result.accessToken, result.user)
      return result.user
    },
    [beginSession, repository],
  )

  const prepareGoogleSignup = useCallback((idToken: string) => {
    setPendingGoogleIdToken(idToken)
  }, [])

  const clearGoogleSignup = useCallback(() => {
    setPendingGoogleIdToken(null)
  }, [])

  const checkEmailAvailability = useCallback(
    (email: string, signal?: AbortSignal) =>
      repository.checkEmailAvailability(email, signal),
    [repository],
  )

  const signup = useCallback(
    async (values: SignupFormValues) => {
      await repository.signup(values)
      const result = await repository.login(values)
      beginSession(result.accessToken, result.user)
    },
    [beginSession, repository],
  )

  const logout = useCallback(async () => {
    await repository.logout().catch(() => undefined)
    clearSession('manual')
  }, [clearSession, repository])

  const updateUser = useCallback((user: AuthUser) => {
    const current = sessionRef.current
    if (!current) return
    const nextSession = { ...current, user: { ...current.user, ...user } }
    sessionRef.current = nextSession
    setSession(nextSession)
  }, [])

  const authenticatedRequest = useCallback<AuthContextValue['apiRequest']>(
    async (path, options = {}) => {
      const accessToken = sessionRef.current?.accessToken

      if (!accessToken) {
        clearSession('session-expired')
        throw new ApiClientError({
          code: 'AUTH_REQUIRED',
          message: '로그인이 필요합니다.',
          status: 401,
        })
      }

      try {
        return await requestApi(path, { ...options, accessToken })
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          if (!hasExplicitInitialUser) {
            const renewedToken = await renewAccessToken()
            if (renewedToken) {
              return await requestApi(path, {
                ...options,
                accessToken: renewedToken,
              })
            }
          }
          clearSession('session-expired')
        }
        throw error
      }
    },
    [clearSession, hasExplicitInitialUser, renewAccessToken],
  )

  const authenticatedRawRequest = useCallback<
    AuthContextValue['rawApiRequest']
  >(
    async (path, options = {}) => {
      const accessToken = sessionRef.current?.accessToken

      if (!accessToken) {
        clearSession('session-expired')
        throw new ApiClientError({
          code: 'AUTH_REQUIRED',
          message: '로그인이 필요합니다.',
          status: 401,
        })
      }

      try {
        return await requestRawApi(path, { ...options, accessToken })
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          if (!hasExplicitInitialUser) {
            const renewedToken = await renewAccessToken()
            if (renewedToken) {
              return await requestRawApi(path, {
                ...options,
                accessToken: renewedToken,
              })
            }
          }
          clearSession('session-expired')
        }
        throw error
      }
    },
    [clearSession, hasExplicitInitialUser, renewAccessToken],
  )

  const withdraw = useCallback(
    async (password: string) => {
      await authenticatedRequest('/api/users/me', {
        body: { password },
        method: 'DELETE',
      })
      clearSession('manual')
    },
    [authenticatedRequest, clearSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      apiRequest: authenticatedRequest,
      rawApiRequest: authenticatedRawRequest,
      checkEmailAvailability,
      clearGoogleSignup,
      isAuthenticated: session !== null,
      isInitializing,
      login,
      loginWithGoogle,
      logoutReason,
      logout,
      pendingGoogleIdToken,
      prepareGoogleSignup,
      setExamInProgress,
      signup,
      user: session?.user ?? null,
      updateUser,
      withdraw,
    }),
    [
      authenticatedRequest,
      authenticatedRawRequest,
      checkEmailAvailability,
      clearGoogleSignup,
      isInitializing,
      login,
      loginWithGoogle,
      logout,
      logoutReason,
      pendingGoogleIdToken,
      prepareGoogleSignup,
      setExamInProgress,
      session,
      signup,
      updateUser,
      withdraw,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isIdleWarningOpen ? (
        <div
          aria-labelledby="exam-idle-warning-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-2xl">
            <h2
              className="type-dialog-title font-bold text-stone-950"
              id="exam-idle-warning-title"
            >
              계속 응시 중이신가요?
            </h2>
            <p className="mt-2 type-body text-stone-600">
              2분 안에 응답하지 않으면 보안을 위해 로그아웃됩니다. 작성한
              답안은 이 기기에 임시 저장됩니다.
            </p>
            <button
              className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-4 type-control font-semibold text-white hover:bg-brand-800"
              onClick={() => {
                lastActivityAtRef.current = Date.now()
                setIsIdleWarningOpen(false)
              }}
              type="button"
            >
              계속 응시
            </button>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  )
}
