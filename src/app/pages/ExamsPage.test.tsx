import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../features/auth'
import { ToastProvider } from '../../shared/ui'
import { ExamsPage } from './ExamsPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ExamsPage creation entry', () => {
  it('opens the composer with the requested classroom week', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      if (url.pathname === '/api/classrooms') {
        return success({ items: [classroomFixture], page: 0, size: 100, totalElements: 1, totalPages: 1 })
      }
      if (url.pathname === '/api/classrooms/12/exams') {
        return success({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12/exams?create=1&weekNumber=3']}>
        <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
          <ToastProvider>
            <Routes>
              <Route element={<ExamsPage />} path="/classrooms/:classroomId/exams" />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '시험 만들기' })).toBeInTheDocument()
    expect(screen.getByLabelText('주차 (선택)')).toHaveValue(3)
  })
})

const classroomFixture = {
  classroomId: 12,
  color: 'BLUE',
  description: '자료구조 강의실',
  endDate: '2026-11-15',
  instructorName: '박교수',
  inviteCode: '7QK4-MZ2A',
  learnerCount: 42,
  name: '자료구조',
  pendingRequestCount: 0,
  progressRate: 38,
  startDate: '2026-08-03',
  status: 'ACTIVE',
  weekCount: 15,
}

function success(data: unknown): Response {
  return new Response(JSON.stringify({ data, message: '요청이 성공했습니다.', success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}
