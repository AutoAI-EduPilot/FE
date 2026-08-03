import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../../features/auth'
import { ToastProvider } from '../../../shared/ui'
import { InstructorClassroomEditPage } from './InstructorClassroomEditPage'

afterEach(() => {
  cleanup()
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
    expect(
      screen.getByRole('heading', { name: '주차 구성' }),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('자료구조')).toBeInTheDocument()
    expect(screen.getByLabelText('1주차 이름')).toHaveValue('1주차')
    expect(screen.getByLabelText('15주차 이름')).toBeInTheDocument()
    expect(screen.getByText('7QK4-MZ2A')).toBeInTheDocument()
    expect(screen.getByText('김학습')).toBeInTheDocument()
    expect(screen.getByText('김')).toBeInTheDocument()
    expect(screen.getByText(/2026.*오전 10:00/)).not.toHaveTextContent('10:00:00')
    expect(screen.getByRole('button', { name: '제외' })).toBeDisabled()
    expect(
      screen.getByRole('heading', { name: '위험 구역' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '위험 구역' }).closest('section')).toHaveClass('mt-auto')
    expect(document.getElementById('classroom-edit-form')).toHaveClass('xl:flex-1', 'flex-col', 'xl:overflow-hidden')
    expect(screen.getByRole('heading', { name: '강의실 수정' }).closest('.w-full')).toHaveClass(
      'xl:h-[calc(100dvh-4.5rem)]',
      'xl:overflow-hidden',
    )

    fireEvent.click(screen.getByRole('button', { name: '1주차 상태 메뉴' }))
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '휴강' }))
    expect(screen.getByText('휴강')).toBeInTheDocument()

    const dataTransfer = { effectAllowed: 'none', setData: vi.fn() }
    fireEvent.dragStart(screen.getByRole('button', { name: '1주차 순서 이동' }), { dataTransfer })
    fireEvent.dragEnter(screen.getByLabelText('2주차 항목'), { dataTransfer })
    expect(screen.getByLabelText('2주차 이름')).toHaveValue('1주차')
    expect(screen.queryByRole('button', { name: '위로 이동' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '아래로 이동' })).not.toBeInTheDocument()

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: '강의실 종료' }))
    expect(confirmSpy).toHaveBeenCalledWith(
      '강의실 운영을 종료할까요? 종료 후에는 새 자료 업로드와 학습자 추가가 불가능하며, 기존 자료와 학습 기록만 확인할 수 있습니다.',
    )
  })

  it('saves changed week titles through the week update API', async () => {
    const requests: Array<{ method: string; pathname: string }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        'http://localhost',
      )
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      requests.push({ method, pathname: url.pathname })

      if (url.pathname === '/api/classrooms/12' && method === 'GET') {
        return success({ ...classroomFixture, weekCount: 1 })
      }
      if (url.pathname === '/api/classrooms/12/weeks' && method === 'GET') {
        return success({
          items: [{
            materials: [],
            releaseAt: '2026-08-03T00:00:00Z',
            status: 'PUBLISHED',
            title: '1주차',
            weekNumber: 1,
          }],
        })
      }
      if (url.pathname === '/api/classrooms/12/join-requests') {
        return success({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })
      }
      if (url.pathname === '/api/classrooms/12/invite-code') {
        return success({ inviteCode: '7QK4-MZ2A' })
      }
      if (url.pathname === '/api/classrooms/12/weeks/1' && method === 'PATCH') {
        return success({ materials: [], status: 'PUBLISHED', title: '연결 리스트', weekNumber: 1 })
      }
      if (url.pathname === '/api/classrooms/12' && method === 'PATCH') {
        return success({ ...classroomFixture, weekCount: 1 })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12/edit']}>
        <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
          <ToastProvider>
            <Routes>
              <Route path="/classrooms/:classroomId/edit" element={<InstructorClassroomEditPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.change(await screen.findByLabelText('1주차 이름'), {
      target: { value: '연결 리스트' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(requests).toContainEqual({ method: 'PATCH', pathname: '/api/classrooms/12/weeks/1' })
      expect(requests).toContainEqual({ method: 'PATCH', pathname: '/api/classrooms/12' })
    })
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
