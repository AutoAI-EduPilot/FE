import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider, type AuthUser } from '../features/auth'
import { ToastProvider } from '../shared/ui'
import {
  apiFailure,
  apiSuccess,
  installApiFixtureServer,
} from '../test/apiFixtureServer'
import { AppRoutes } from './AppRoutes'

const authenticatedUser: AuthUser = {
  email: 'learner@example.com',
  name: 'learner',
}

beforeEach(() => {
  window.localStorage.clear()
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  window.localStorage.clear()
})

function renderRoute(path: string, initialUser: AuthUser | null = authenticatedUser) {
  return render(
    <AuthProvider initialUser={initialUser}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>,
  )
}

describe('AppRoutes', () => {
  it('renders the forgot password route', () => {
    renderRoute('/forgot-password', null)

    expect(
      screen.getByRole('heading', { name: '비밀번호 찾기' }),
    ).toBeInTheDocument()
  })

  it('redirects the root route to classrooms', () => {
    renderRoute('/')

    expect(
      screen.getByRole('heading', { name: '내 강의실' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('아직 참여 중인 강의실이 없습니다'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: '설정' }),
    ).not.toBeInTheDocument()
  })

  it('renders the integrated session detail route', async () => {
    renderRoute('/sessions/100')

    expect(
      await screen.findByRole('heading', { name: '학습 공간' }),
    ).toBeInTheDocument()
    expect(screen.getByText('시험 대비 요약.pdf 학습 화면입니다.')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'AI 채팅' })).toBeInTheDocument()
  })

  it('opens the settings page from the profile menu', async () => {
    renderRoute('/')

    const [profileTrigger] = screen.getAllByRole('button', { name: '프로필 메뉴' })
    fireEvent.click(profileTrigger)
    const [settingsMenuItem] = screen.getAllByRole('menuitem', { name: '설정' })
    fireEvent.click(settingsMenuItem)

    expect(
      await screen.findByRole('heading', { name: '설정' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    expect(
      screen.getByRole('button', { name: '회원 탈퇴 실행' }),
    ).toBeInTheDocument()
  })

  it('keeps instructor menus out of learner navigation', () => {
    renderRoute('/')

    expect(screen.queryByRole('link', { name: '캘린더' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '내 노트' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '입장 요청' })).not.toBeInTheDocument()
  })

  it('redirects learners away from instructor-only routes', () => {
    renderRoute('/entrance-requests')

    expect(
      screen.getByRole('heading', { name: '내 강의실' }),
    ).toBeInTheDocument()
  })

  it('renders instructor navigation and management routes', () => {
    renderRoute('/entrance-requests', {
      email: 'instructor@example.com',
      name: '강의자',
      role: 'INSTRUCTOR',
    })

    expect(
      screen.getByRole('heading', { name: '입장 요청' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '캘린더' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '학습 현황' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '공지 관리' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '입장 요청' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '자료' })).not.toBeInTheDocument()
  })

  it('renders the not found route for unknown paths', () => {
    renderRoute('/missing-page')

    expect(
      screen.getByRole('heading', {
        name: '페이지를 찾을 수 없습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '내 강의실로' })).toHaveAttribute(
      'href',
      '/classrooms',
    )
  })

  it('redirects protected routes to login when unauthenticated', () => {
    renderRoute('/materials', null)

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('returns to the originally requested protected route after login', async () => {
    renderRoute('/sessions/100', null)

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'learner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '학습 공간' })).toBeInTheDocument()
    expect(screen.getByText('시험 대비 요약.pdf 학습 화면입니다.')).toBeInTheDocument()
  })

  it('shows the session expired login notice', () => {
    renderRoute('/login?reason=session-expired', null)

    expect(screen.getByRole('alert')).toHaveTextContent(
      '세션이 만료되었습니다. 다시 로그인하세요.',
    )
  })

  it('validates login form fields', () => {
    renderRoute('/login', null)

    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력하세요.')).toBeInTheDocument()
  })

  it('keeps the access token in memory only after login (DEC-004)', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    window.localStorage.clear()
    window.sessionStorage.clear()
    render(
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>,
    )

    fireEvent.change(await screen.findByLabelText('이메일'), {
      target: { value: 'learner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByRole('heading', { name: '내 강의실' }),
    ).toBeInTheDocument()
    expect(screen.getByText('learner')).toBeInTheDocument()
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('restores the session from the refresh cookie on load', async () => {
    installApiFixtureServer((request) => {
      const url = new URL(request.url)
      if (request.method === 'POST' && url.pathname === '/api/auth/refresh') {
        return apiSuccess({
          accessToken: 'refreshed-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        })
      }
      return undefined
    })

    render(
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/materials']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: '자료' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('PDF 업로드')).toBeInTheDocument()
  })

  it('renews the access token once and retries a 401 request', async () => {
    let materialsCalls = 0
    let refreshCalls = 0
    installApiFixtureServer((request) => {
      const url = new URL(request.url)
      if (request.method === 'GET' && url.pathname === '/api/materials') {
        materialsCalls += 1
        if (materialsCalls === 1) {
          return apiFailure('TOKEN_INVALID', '토큰이 만료되었습니다.', 401)
        }
        return undefined
      }
      if (request.method === 'POST' && url.pathname === '/api/auth/refresh') {
        refreshCalls += 1
        return apiSuccess({
          accessToken: `renewed-token-${refreshCalls}`,
          expiresIn: 3600,
          tokenType: 'Bearer',
        })
      }
      return undefined
    })

    render(
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/materials']}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>,
    )

    expect(await screen.findByText('시험 대비 요약.pdf')).toBeInTheDocument()
    expect(materialsCalls).toBe(2)
    expect(refreshCalls).toBe(2)
  })

  it('maps API validation errors onto login fields', async () => {
    renderRoute('/login', null)

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'locked@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('이메일 또는 비밀번호를 확인하세요.'),
    ).toBeInTheDocument()
  })

  it('validates signup form fields', () => {
    renderRoute('/signup', null)

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }))

    expect(screen.getByText('이름을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('필수 약관에 동의해 주세요.')).toBeInTheDocument()
  })
})
