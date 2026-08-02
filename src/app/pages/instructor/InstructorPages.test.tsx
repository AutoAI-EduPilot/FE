import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from '../../../features/auth'
import { ToastProvider } from '../../../shared/ui'
import { InstructorCalendarPage } from './InstructorCalendarPage'
import { InstructorClassroomsPage } from './InstructorClassroomsPage'
import { InstructorLearningStatusPage } from './InstructorLearningStatusPage'
import { InstructorNoticesPage } from './InstructorNoticesPage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

function renderCalendar() {
  return render(
    <AuthProvider
      initialUser={{
        email: 'instructor@example.com',
        id: 7,
        name: '강의자',
        role: 'INSTRUCTOR',
      }}
    >
      <InstructorCalendarPage />
    </AuthProvider>,
  )
}

function renderInstructorPage(page: ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
        <ToastProvider>{page}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}


function stubNoticesApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input)
    const envelope = (data: unknown) =>
      new Response(JSON.stringify({ data, message: 'ok', success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })

    if (url.includes('/notices')) {
      return envelope({
        items: [
          {
            classroomId: 1,
            content: '중간고사 범위는 1~4주차입니다.',
            createdAt: '2026-07-26T00:00:00Z',
            noticeId: 11,
            publishedAt: '2026-07-26T00:00:00Z',
            title: '중간고사 범위 안내',
            updatedAt: '2026-07-26T00:00:00Z',
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      })
    }
    if (url.includes('/api/classrooms')) {
      return envelope({
        items: [
          {
            classroomId: 1,
            color: 'INDIGO',
            endDate: '2026-11-15',
            instructorName: '박교수',
            name: '자료구조',
            startDate: '2026-08-03',
            status: 'ACTIVE',
            weekCount: 15,
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      })
    }
    return envelope(null)
  })
}

describe('instructor pages', () => {
  it('derives the classroom end date from its start date and week count', () => {
    renderInstructorPage(<InstructorClassroomsPage />)

    expect(
      screen.getAllByRole('button', { name: '강의실 만들기' }),
    ).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '강의실 만들기' }))

    const dialog = screen.getByRole('dialog', { name: '강의실 만들기' })
    const submitButton = screen.getByRole('button', { name: '만들기' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).queryByText('학기')).not.toBeInTheDocument()
    expect(within(dialog).getByText('15주')).toBeInTheDocument()
    expect(screen.getByText('운영 중 0개')).toBeInTheDocument()
    expect(screen.queryByText(/\d{4}년 \d학기/)).not.toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('강의실 이름'), {
      target: { value: '자료구조' },
    })
    fireEvent.change(screen.getByLabelText('수업 시작일'), {
      target: { value: '2026-08-03' },
    })
    expect(screen.getByText('2026-11-15까지 · 15개 주차가 자동 생성됩니다.')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()

    expect(dialog).toBeInTheDocument()
    expect(window.localStorage.length).toBe(0)
  })

  it('requires a classroom name and start date before creation', () => {
    renderInstructorPage(<InstructorClassroomsPage />)

    fireEvent.click(screen.getByRole('button', { name: '강의실 만들기' }))
    fireEvent.change(screen.getByLabelText('강의실 이름'), {
      target: { value: '자료구조' },
    })
    expect(screen.getByRole('button', { name: '만들기' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('수업 시작일'), {
      target: { value: '2026-08-10' },
    })
    expect(screen.getByRole('button', { name: '만들기' })).toBeEnabled()
  })

  it('matches the classroom search controls from the instructor design', () => {
    renderInstructorPage(<InstructorClassroomsPage />)

    fireEvent.click(screen.getByRole('button', { name: '강의실 검색' }))

    expect(
      screen.getByRole('dialog', { name: '강의실 검색' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '검색 닫기' })).toHaveTextContent(
      'esc',
    )
    expect(screen.queryByText('⌘K로 어디서든 열기')).not.toBeInTheDocument()
  })

  it('offers edit and takedown controls for each notice', async () => {
    const fetchMock = stubNoticesApi()
    renderInstructorPage(<InstructorNoticesPage />)

    const editButtons = await screen.findAllByRole('button', { name: /수정$/ })
    expect(editButtons.length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: /내리기$/ }).length,
    ).toBeGreaterThan(0)

    fireEvent.click(editButtons[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('공지 수정')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '저장' })).toBeInTheDocument()
    fetchMock.mockRestore()
  })

  it('asks for confirmation before taking a notice down', async () => {
    const fetchMock = stubNoticesApi()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderInstructorPage(<InstructorNoticesPage />)

    const [takeDown] = await screen.findAllByRole('button', { name: /내리기$/ })
    fireEvent.click(takeDown)

    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
    fetchMock.mockRestore()
  })

  it('switches between calendar views', () => {
    renderCalendar()

    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    expect(
      screen.getByRole('heading', { name: '예정된 일정이 없습니다' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '주' }))
    expect(screen.queryByText('예정된 일정이 없습니다')).not.toBeInTheDocument()
  })

  it('moves directly to a selected year and month', () => {
    renderCalendar()
    const targetYear = new Date().getFullYear() + 2

    fireEvent.click(
      screen.getByRole('button', { name: '연도와 월 선택' }),
    )
    expect(
      screen.getByRole('dialog', { name: '연도와 월 선택' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('연도 선택'), {
      target: { value: String(targetYear) },
    })
    fireEvent.click(screen.getByRole('button', { name: '12월' }))

    expect(
      screen.getByRole('button', { name: '연도와 월 선택' }),
    ).toHaveTextContent(`${targetYear}년 12월`)
    expect(
      screen.queryByRole('dialog', { name: '연도와 월 선택' }),
    ).not.toBeInTheDocument()
  })

  it('uses distinct colors for Saturday and Sunday dates', () => {
    renderCalendar()

    fireEvent.click(screen.getByRole('button', { name: '연도와 월 선택' }))
    fireEvent.change(screen.getByLabelText('연도 선택'), {
      target: { value: '2026' },
    })
    fireEvent.click(screen.getByRole('button', { name: '8월' }))

    const saturday = screen.getByLabelText('2026년 8월 8일 토요일 일정 0개')
    const sunday = screen.getByLabelText('2026년 8월 9일 일요일 일정 0개')
    expect(within(saturday).getByText('8')).toHaveClass('text-sky-700')
    expect(within(sunday).getByText('9')).toHaveClass('text-rose-600')
  })

  it('adds and removes a calendar schedule', () => {
    renderCalendar()

    fireEvent.click(screen.getByRole('button', { name: '일정 추가' }))
    expect(
      screen.getByRole('dialog', { name: '일정 추가' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('일정 이름'), {
      target: { value: '중간고사 범위 공지' },
    })
    fireEvent.change(screen.getByLabelText('날짜와 시간'), {
      target: { value: '2099-08-03T09:00' },
    })
    fireEvent.change(screen.getByLabelText('일정 유형'), {
      target: { value: 'NOTICE' },
    })
    fireEvent.click(screen.getByRole('button', { name: '추가' }))

    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    fireEvent.click(
      screen.getByRole('button', { name: /중간고사 범위 공지/ }),
    )
    expect(
      screen.getByRole('dialog', { name: '중간고사 범위 공지' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '일정 삭제' }))
    expect(screen.queryByText('중간고사 범위 공지')).not.toBeInTheDocument()
    expect(window.localStorage.length).toBe(0)
  })

  it('supports all-day and ranged calendar schedules', () => {
    renderCalendar()

    fireEvent.click(screen.getByRole('button', { name: '일정 추가' }))
    fireEvent.click(screen.getByRole('switch', { name: '기간' }))
    fireEvent.click(screen.getByRole('switch', { name: '시간' }))

    expect(screen.getByLabelText('시작')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('종료일')).toHaveAttribute('type', 'date')
    expect(screen.getByRole('switch', { name: '기간' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: '시간' })).toHaveAttribute('aria-checked', 'false')
  })

  it('shows the instructor learning status header actions', () => {
    render(<InstructorLearningStatusPage />)

    expect(screen.getByLabelText('강의실 선택')).toBeDisabled()
    expect(screen.getByText('마지막 갱신 정보 없음')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '리마인더 보내기' }),
    ).toBeDisabled()
  })

  it('opens the notice composer from the design action', () => {
    renderInstructorPage(<InstructorNoticesPage />)

    expect(screen.getByLabelText('강의실 선택')).toHaveValue('')
    expect(screen.getByRole('button', { name: '새 공지' })).toBeDisabled()
  })
})
