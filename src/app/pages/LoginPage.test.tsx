import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../features/auth'
import { installApiFixtureServer } from '../../test/apiFixtureServer'
import { LoginPage } from './LoginPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  window.localStorage.clear()
})

function renderLogin(path = '/login') {
  return render(
    <AuthProvider initialUser={null}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/forgot-password"
            element={<p>비밀번호 찾기 화면</p>}
          />
          <Route path="/classrooms" element={<p>내 강의실 화면</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('places Google login after local login and shows service health', async () => {
    renderLogin()

    const localLogin = screen.getByRole('button', { name: '로그인' })
    const googleLogin = screen.getByRole('button', {
      name: 'Google로 계속하기',
    })

    expect(
      localLogin.compareDocumentPosition(googleLogin) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', { name: '서비스 상태: 정상' }),
    ).toBeInTheDocument()
  })

  it('validates empty fields before calling the API', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
  })

  it('logs in and redirects to classrooms on success', async () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'learner@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    expect(await screen.findByText('내 강의실 화면')).toBeInTheDocument()
  })

  it('shows the mapped field error for invalid credentials', async () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'locked@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /로그인/ }))

    expect(
      await screen.findByText('이메일 또는 비밀번호를 확인하세요.'),
    ).toBeInTheDocument()
  })

  it('shows the session expired banner from the query string', () => {
    renderLogin('/login?reason=session-expired')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '세션이 만료되었습니다. 다시 로그인하세요.',
    )
  })

  it('shows the idle logout banner from the query string', () => {
    renderLogin('/login?reason=idle')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '10분 동안 활동이 없어 로그아웃되었습니다.',
    )
  })

  it('opens the forgot password page', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('link', { name: '비밀번호 찾기' }))

    expect(screen.getByText('비밀번호 찾기 화면')).toBeInTheDocument()
  })
})
