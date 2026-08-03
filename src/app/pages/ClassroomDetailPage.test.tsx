import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../features/auth'
import { ToastProvider } from '../../shared/ui'
import { ClassroomDetailPage } from './ClassroomDetailPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ClassroomDetailPage instructor materials', () => {
  it('uploads a dropped PDF into the target week without management buttons', async () => {
    let uploadedValues: {
      classroomId: FormDataEntryValue | null
      file: FormDataEntryValue | null
      weekNumber: FormDataEntryValue | null
    } | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        'http://localhost',
      )

      if (url.pathname === '/api/classrooms/12') {
        return success(classroomFixture)
      }
      if (url.pathname === '/api/classrooms/12/weeks') {
        return success({ items: [weekFixture] })
      }
      if (url.pathname === '/api/classrooms/12/notices') {
        return success({
          items: [],
          page: 0,
          size: 100,
          totalElements: 0,
          totalPages: 0,
        })
      }
      if (url.pathname === '/api/materials' && init?.method === 'POST') {
        const body = init.body as FormData
        uploadedValues = {
          classroomId: body.get('classroomId'),
          file: body.get('file'),
          weekNumber: body.get('weekNumber'),
        }
        return success({
          createdAt: '2026-08-02T00:00:00Z',
          materialId: 91,
          pageCount: null,
          processingStatus: 'PROCESSING',
          title: 'lecture.pdf',
        })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12']}>
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
              <Route path="/classrooms/:classroomId" element={<ClassroomDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    const dropZone = await screen.findByLabelText('1주차 PDF 드롭 영역')
    expect(screen.getByRole('heading', { level: 1, name: '자료구조' })).toBeInTheDocument()
    expect(screen.queryByText(/자료 관리 ·/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/classrooms/12/edit')
    fireEvent.click(screen.getByRole('button', { name: '자료 업로드' }))
    expect(screen.getByRole('dialog', { name: '자료 업로드' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '자료 업로드 닫기' }))
    expect(screen.queryByRole('button', { name: '주차 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'PDF 업로드' })).not.toBeInTheDocument()

    const file = new File(['pdf'], 'lecture.pdf', { type: 'application/pdf' })
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [file] } })
    expect(dropZone).toHaveTextContent('PDF를 놓아 이 주차에 추가')
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    await waitFor(() => expect(uploadedValues).not.toBeNull())
    expect(uploadedValues).toEqual({
      classroomId: '12',
      file,
      weekNumber: '1',
    })
  })

  it('keeps completed classroom materials read-only and available for viewing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        'http://localhost',
      )

      if (url.pathname === '/api/classrooms/12') {
        return success({ ...classroomFixture, status: 'COMPLETED' })
      }
      if (url.pathname === '/api/classrooms/12/weeks') {
        return success({
          items: [{
            ...weekFixture,
            materials: [{
              materialId: 91,
              pageCount: 24,
              processingStatus: 'READY',
              title: '연결 리스트.pdf',
              uploadedAt: '2026-08-02T00:00:00Z',
            }],
          }],
        })
      }
      if (url.pathname === '/api/classrooms/12/notices') {
        return success({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12']}>
        <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
          <ToastProvider>
            <Routes>
              <Route path="/classrooms/:classroomId" element={<ClassroomDetailPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/기존 자료는 확인할 수 있지만/)).toHaveTextContent(
      '새 자료 업로드, 삭제, 공개 상태 변경은 할 수 없습니다.',
    )
    expect(screen.getByRole('link', { name: '연결 리스트.pdf' })).toHaveAttribute(
      'href',
      '/materials/91',
    )
    expect(screen.getByText('자료 1 · 평균 진도 38%')).toBeInTheDocument()
    expect(screen.getByText('열람 -/42명')).toBeInTheDocument()
    expect(screen.queryByLabelText('1주차 PDF 드롭 영역')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '연결 리스트.pdf 주차에서 제거' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '지금 공개' })).not.toBeInTheDocument()
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

const weekFixture = {
  materials: [],
  releaseAt: '2026-08-03T00:00:00Z',
  status: 'PUBLISHED',
  title: '자료구조 기초',
  weekNumber: 1,
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
