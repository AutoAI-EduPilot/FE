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
    let createdNotice: { content: string; title: string } | null = null
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
        if (init?.method === 'POST') {
          createdNotice = JSON.parse(String(init.body)) as { content: string; title: string }
          return success({
            classroomId: 12,
            content: createdNotice.content,
            createdAt: '2026-08-03T11:00:00Z',
            noticeId: 3,
            publishedAt: '2026-08-03T11:00:00Z',
            title: createdNotice.title,
            updatedAt: '2026-08-03T11:00:00Z',
          })
        }
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
    expect(screen.getByText('2026. 8. 3. 오전 9:07')).toBeInTheDocument()
    expect(screen.queryByText(/9:07:42/)).not.toBeInTheDocument()
    expect(screen.queryByText(/자료 관리 ·/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/classrooms/12/settings')
    fireEvent.click(screen.getByRole('button', { name: '새 항목 추가' }))
    expect(screen.getByRole('dialog', { name: '새 항목 추가' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /강의자료/ }))
    expect(screen.getByRole('dialog', { name: '강의자료 업로드' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '강의자료 업로드 닫기' }))
    fireEvent.click(screen.getByRole('button', { name: '새 항목 추가' }))
    fireEvent.click(screen.getByRole('button', { name: /공지사항/ }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '중간고사 안내' } })
    fireEvent.change(screen.getByLabelText('내용'), { target: { value: '시험 범위를 확인해 주세요.' } })
    fireEvent.click(screen.getByRole('button', { name: '전체 공지 게시' }))
    await waitFor(() => expect(createdNotice).toEqual({ content: '시험 범위를 확인해 주세요.', title: '중간고사 안내' }))
    expect(screen.getByRole('heading', { name: '전체 공지' })).toBeInTheDocument()
    expect(screen.getByText('중간고사 안내')).toBeInTheDocument()
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
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
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
      if (url.pathname === '/api/sessions' && init?.method === 'POST') {
        return success({
          currentPage: 1,
          materialId: 91,
          sessionId: 901,
          status: 'ACTIVE',
          uiActions: [],
        })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/12']}>
        <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
          <ToastProvider>
            <Routes>
              <Route path="/classrooms/:classroomId" element={<ClassroomDetailPage />} />
              <Route path="/sessions/:sessionId" element={<p>PDF 뷰어</p>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/기존 자료는 확인할 수 있지만/)).toHaveTextContent(
      '새 자료 업로드, 삭제, 공개 상태 변경은 할 수 없습니다.',
    )
    expect(screen.queryByText('연결 리스트.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('24쪽 · 8월 2일 업로드')).toBeInTheDocument()
    expect(screen.getByText('자료 1 · 평균 진도 38%')).toBeInTheDocument()
    expect(screen.getByText('열람 -/42명')).toBeInTheDocument()
    expect(screen.queryByLabelText('1주차 PDF 드롭 영역')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '연결 리스트.pdf 주차에서 제거' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '지금 공개' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '연결 리스트' }))
    expect(await screen.findByText('PDF 뷰어')).toBeInTheDocument()
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
  releaseAt: '2026-08-03T09:07:42',
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
