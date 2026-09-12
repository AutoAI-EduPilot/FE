import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResponsiveViewportProvider } from '../../../shared/responsive'
import { TestAuthProvider } from '../../../test/TestAuthProvider'
import { AdminPage } from './AdminPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AdminPage', () => {
  it('refreshes the selected AI usage range from an icon-only button', async () => {
    const requestedPaths: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      requestedPaths.push(url.pathname)
      if (url.pathname === '/api/admin/users') {
        return success({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
      }
      if (url.pathname === '/api/admin/ai-usage/summary') {
        return success({ daily: [], features: [] })
      }
      if (url.pathname === '/api/admin/ai-usage/users') {
        return success({ items: [] })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <ResponsiveViewportProvider>
        <TestAuthProvider>
          <MemoryRouter><AdminPage /></MemoryRouter>
        </TestAuthProvider>
      </ResponsiveViewportProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'AI 사용량' }))
    await waitFor(() => expect(countRequests(requestedPaths, '/api/admin/ai-usage/summary')).toBe(1))

    const refreshButton = screen.getByRole('button', { name: 'AI 사용량 새로고침' })
    expect(refreshButton).toHaveAttribute('title', '새로고침')
    expect(refreshButton).toHaveTextContent('')
    fireEvent.click(refreshButton)

    await waitFor(() => expect(countRequests(requestedPaths, '/api/admin/ai-usage/summary')).toBe(2))
    expect(countRequests(requestedPaths, '/api/admin/ai-usage/users')).toBe(2)
  })

  it('shows recent activity and issues a one-time temporary password', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      if (url.pathname === '/api/admin/users/7/password-reset' && init?.method === 'POST') {
        return success({ message: '로그인 후 즉시 변경하세요.', temporaryPassword: 'Temporary1234' })
      }
      if (url.pathname === '/api/admin/users/7') {
        return success({ affiliation: '테스트 학교', authProvider: 'LOCAL', consentedAt: null, createdAt: '2026-09-01T00:00:00Z', email: 'member@example.com', id: 7, name: '회원', role: 'LEARNER', status: 'ACTIVE' })
      }
      if (url.pathname === '/api/admin/users') {
        return success({ items: [{ authProvider: 'LOCAL', createdAt: '2026-09-01T00:00:00Z', email: 'member@example.com', id: 7, lastActiveAt: new Date().toISOString(), name: '회원', role: 'LEARNER', status: 'ACTIVE' }], page: 0, size: 20, totalElements: 1, totalPages: 1 })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <ResponsiveViewportProvider>
        <TestAuthProvider>
          <MemoryRouter><AdminPage /></MemoryRouter>
        </TestAuthProvider>
      </ResponsiveViewportProvider>,
    )

    expect(await screen.findByText('방금 전')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '가입일 내림차순 정렬' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '회원 · ID 오름차순 정렬' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: '최근 활동 내림차순 정렬' }))
    await waitFor(() => expect(vi.mocked(globalThis.fetch).mock.calls.some(([input]) => String(input instanceof Request ? input.url : input).includes('sort=RECENT_ACTIVITY_DESC'))).toBe(true))
    expect(screen.getByRole('button', { name: '최근 활동 오름차순 정렬' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '회원 상세 정보' }))
    expect(await screen.findByRole('button', { name: '임시 비밀번호 발급' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '임시 비밀번호 발급' }))
    expect(await screen.findByText('Temporary1234')).toBeInTheDocument()
  })
})

function countRequests(paths: string[], path: string) {
  return paths.filter((requestedPath) => requestedPath === path).length
}

function success(data: unknown) {
  return new Response(JSON.stringify({ data, message: '요청이 성공했습니다.', success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}
