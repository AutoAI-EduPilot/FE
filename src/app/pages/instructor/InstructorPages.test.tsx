import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToastProvider } from '../../../shared/ui'
import { InstructorCalendarPage } from './InstructorCalendarPage'
import { InstructorClassroomsPage } from './InstructorClassroomsPage'

afterEach(cleanup)

describe('instructor pages', () => {
  it('opens the classroom creation dialog', () => {
    render(
      <ToastProvider>
        <InstructorClassroomsPage />
      </ToastProvider>,
    )

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

  it('switches between calendar views', () => {
    render(<InstructorCalendarPage />)

    fireEvent.click(screen.getByRole('button', { name: '목록' }))
    expect(
      screen.getByRole('heading', { name: '예정된 일정이 없습니다' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '주' }))
    expect(screen.queryByText('예정된 일정이 없습니다')).not.toBeInTheDocument()
  })
})
