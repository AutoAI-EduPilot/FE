import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../../features/auth'
import { ToastProvider } from '../../../shared/ui'
import { InstructorClassroomEditPage } from './InstructorClassroomEditPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('InstructorClassroomEditPage', () => {
  it('renders the design sections with API-backed classroom data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        'http://localhost',
      )
      if (url.pathname === '/api/classrooms/12') {
        return success(classroomFixture)
      }
      if (url.pathname === '/api/classrooms/12/weeks') {
        return success({
          items: [
            {
              materials: [],
              releaseAt: '2026-08-03T00:00:00Z',
              status: 'PUBLISHED',
              title: '1주차',
              weekNumber: 1,
            },
          ],
        })
      }
      if (url.pathname === '/api/classrooms/12/join-requests') {
        return success({
          items: [
            {
              classroomId: 12,
              classroomName: '자료구조',
              learner: {
                affiliation: '서울대학교',
                email: 'learner@example.com',
                name: '김학습',
                userId: 9,
              },
              processedAt: '2026-08-02T01:00:00Z',
              requestedAt: '2026-08-01T01:00:00Z',
              requestId: 31,
              status: 'APPROVED',
            },
          ],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        })
      }
      if (url.pathname === '/api/classrooms/12/invite-code') {
        return success({ inviteCode: '7QK4-MZ2A' })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12/edit']}>
        <AuthProvider
          initialUser={{
            email: 'instructor@example.com',
            id: 7,
            name: '강의자',
            role: 'INSTRUCTOR',
          }}
        >
          <ToastProvider>
            <Routes>
              <Route
                path="/classrooms/:classroomId/edit"
                element={<InstructorClassroomEditPage />}
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: '기본 정보' }),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('자료구조')).toBeInTheDocument()
    expect(screen.getByText('7QK4-MZ2A')).toBeInTheDocument()
    expect(screen.getByText('김학습')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제외' })).toBeDisabled()
    expect(
      screen.getByRole('heading', { name: '위험 영역' }),
    ).toBeInTheDocument()
  })
})

const classroomFixture = {
  classroomId: 12,
  color: 'BLUE',
  description: '자료구조 강의실',
  endDate: '2026-11-15',
  instructorName: '박교수',
  learnerCount: 1,
  name: '자료구조',
  pendingRequestCount: 0,
  progressRate: 38,
  startDate: '2026-08-03',
  status: 'ACTIVE',
  weekCount: 15,
}

function success(data: unknown): Response {
  return new Response(
    JSON.stringify({ data, message: '요청이 성공했습니다.', success: true }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}
