import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TestAuthProvider } from '../../test/TestAuthProvider'
import { installApiFixtureServer } from '../../test/apiFixtureServer'
import { SettingsPage } from './SettingsPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function renderSettings() {
  return render(
    <TestAuthProvider>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<p>로그인 화면</p>} />
        </Routes>
      </MemoryRouter>
    </TestAuthProvider>,
  )
}

describe('SettingsPage', () => {
  it('shows the profile without a logout action', () => {
    renderSettings()

    expect(screen.getByDisplayValue('learner')).toBeInTheDocument()
    expect(screen.getByDisplayValue('learner@example.com')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /로그아웃/ }),
    ).not.toBeInTheDocument()
  })

  it('withdraws the account after password confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))

    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'password-123' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: '회원 탈퇴 실행' }),
    )

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
    expect(window.confirm).toHaveBeenCalled()
  })

  it('shows a field error for a wrong password', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))

    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'wrong-password-1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: '회원 탈퇴 실행' }),
    )

    expect(
      await screen.findByText('비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument()
  })
})
