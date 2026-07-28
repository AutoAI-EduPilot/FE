import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../features/auth'
import { installApiFixtureServer } from '../../test/apiFixtureServer'
import { SignupPage } from './SignupPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  window.localStorage.clear()
})

function renderSignup() {
  return render(
    <AuthProvider initialUser={null}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/materials" element={<p>자료 화면</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('SignupPage', () => {
  it('validates required fields before calling the API', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: /회원가입/ }))

    expect(screen.getByText('이름을 입력하세요.')).toBeInTheDocument()
  })

  it('signs up, auto-logs-in, and redirects to materials', async () => {
    renderSignup()

    fireEvent.change(screen.getByLabelText('이름'), {
      target: { value: '학습자' },
    })
    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password-123' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'password-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /회원가입/ }))

    expect(await screen.findByText('자료 화면')).toBeInTheDocument()
  })
})
