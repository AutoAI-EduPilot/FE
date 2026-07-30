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
  it('selects a role before showing the account form', () => {
    renderSignup()

    expect(
      screen.getByRole('heading', { name: '어떤 역할로 사용하시나요?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^학습자/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    fireEvent.click(screen.getByRole('radio', { name: /^강의자/ }))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(
      screen.getByRole('heading', { name: '계정 정보를 입력하세요' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/회원가입 2 \/ 2/)).toHaveTextContent('강의자')

    fireEvent.click(screen.getByRole('button', { name: '이전' }))
    expect(screen.getByRole('radio', { name: /^강의자/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('validates required fields before calling the API', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }))

    expect(screen.getByText('이름을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('이메일을 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('필수 약관에 동의해 주세요.')).toBeInTheDocument()
  })

  it('shows password strength and selects an affiliation suggestion', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password-123' },
    })

    expect(screen.getByText('안전')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute(
      'type',
      'password',
    )
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 표시' }))
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'text')

    fireEvent.change(screen.getByRole('combobox', { name: /소속/ }), {
      target: { value: '서울' },
    })
    fireEvent.click(screen.getByRole('option', { name: /서울대학교/ }))

    expect(screen.getByRole('combobox', { name: /소속/ })).toHaveValue(
      '서울대학교',
    )
  })

  it('signs up, auto-logs-in, and redirects to materials', async () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.change(screen.getByLabelText('이름'), {
      target: { value: '학습자' },
    })
    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password-123' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /이용약관 및 개인정보 처리방침 동의/,
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }))

    expect(await screen.findByText('자료 화면')).toBeInTheDocument()
  })
})
