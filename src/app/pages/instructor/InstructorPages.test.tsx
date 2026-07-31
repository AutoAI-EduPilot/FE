import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToastProvider } from '../../../shared/ui'
import { InstructorCalendarPage } from './InstructorCalendarPage'
import { InstructorClassroomsPage } from './InstructorClassroomsPage'
import { InstructorLearningStatusPage } from './InstructorLearningStatusPage'
import { InstructorNoticesPage } from './InstructorNoticesPage'

afterEach(cleanup)

describe('instructor pages', () => {
  it('opens the classroom creation dialog', () => {
    render(
      <ToastProvider>
        <InstructorClassroomsPage />
      </ToastProvider>,
    )

    expect(
      screen.getAllByRole('button', { name: '강의실 만들기' }),
    ).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '강의실 만들기' }))

    expect(
      screen.getByRole('dialog', { name: '강의실 만들기' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '만들기' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('강의실 이름'), {
      target: { value: '자료구조' },
    })
    expect(screen.getByRole('button', { name: '만들기' })).toBeEnabled()
  })

  it('matches the classroom search controls from the instructor design', () => {
    render(
      <ToastProvider>
        <InstructorClassroomsPage />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '강의실 검색' }))

    expect(
      screen.getByRole('dialog', { name: '강의실 검색' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '검색 닫기' })).toHaveTextContent(
      'esc',
    )
    expect(screen.getByText('⌘K로 어디서든 열기')).toBeInTheDocument()
  })

  it('switches between calendar views', () => {
    render(<InstructorCalendarPage />)

    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    expect(
      screen.getByRole('heading', { name: '예정된 일정이 없습니다' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '주' }))
    expect(screen.queryByText('예정된 일정이 없습니다')).not.toBeInTheDocument()
  })

  it('moves directly to a selected year and month', () => {
    render(<InstructorCalendarPage />)
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

  it('shows the instructor learning status header actions', () => {
    render(<InstructorLearningStatusPage />)

    expect(screen.getByLabelText('강의실 선택')).toBeDisabled()
    expect(screen.getByText('마지막 갱신 정보 없음')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '리마인더 보내기' }),
    ).toBeDisabled()
  })

  it('opens the notice composer from the design action', () => {
    render(
      <ToastProvider>
        <InstructorNoticesPage />
      </ToastProvider>,
    )

    expect(screen.getByLabelText('강의실 선택')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '새 공지' }))
    expect(screen.getByRole('dialog', { name: '새 공지' })).toBeInTheDocument()
  })
})
