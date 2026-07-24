import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider, type AuthUser } from '../features/auth'
import { AppRoutes } from './AppRoutes'

const authenticatedUser: AuthUser = {
  email: 'learner@example.com',
  name: 'learner',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderRoute(path: string, initialUser: AuthUser | null = authenticatedUser) {
  return render(
    <AuthProvider initialUser={initialUser}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AppRoutes', () => {
  it('redirects the root route to materials', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { name: '자료' })).toBeInTheDocument()
    expect(screen.getByText('BE#48 연동 예정')).toBeInTheDocument()
  })

  it('renders the session detail placeholder route', () => {
    renderRoute('/sessions/session-100')

    expect(screen.getByRole('heading', { name: '학습 공간' })).toBeInTheDocument()
    expect(screen.getByText(/세션 session-100/)).toBeInTheDocument()
  })

  it('renders the not found route for unknown paths', () => {
    renderRoute('/missing-page')

    expect(
      screen.getByRole('heading', {
        name: '페이지를 찾을 수 없습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '자료 화면으로' })).toHaveAttribute(
      'href',
      '/materials',
    )
  })

  it('redirects protected routes to login when unauthenticated', () => {
    renderRoute('/materials', null)

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('returns to the originally requested protected route after login', async () => {
    renderRoute('/sessions/session-100', null)

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'learner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '학습 공간' })).toBeInTheDocument()
    expect(screen.getByText(/세션 session-100/)).toBeInTheDocument()
  })

  it('shows the mock session expired login notice', () => {
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

  it('logs in with memory-only mock auth state', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    window.localStorage.clear()
    window.sessionStorage.clear()
    renderRoute('/login', null)

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'learner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '자료' })).toBeInTheDocument()
    expect(screen.getByText('learner')).toBeInTheDocument()
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('token')).toBeNull()
    expect(window.sessionStorage.getItem('token')).toBeNull()
  })

  it('maps mock server validation errors onto login fields', async () => {
    renderRoute('/login', null)

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'locked@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('가입되지 않았거나 비활성화된 계정입니다.'),
    ).toBeInTheDocument()
  })

  it('validates signup form fields', () => {
    renderRoute('/signup', null)

    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('이름을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호 확인을 입력하세요.')).toBeInTheDocument()
  })
})
