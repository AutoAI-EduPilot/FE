import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToastProvider } from '../../shared/ui'
import { CalendarPage, NotesPage } from './PlaceholderFeaturePage'

afterEach(cleanup)

describe('design preview pages', () => {
  it('switches the calendar to the list view', () => {
    render(
      <ToastProvider>
        <CalendarPage />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('tab', { name: '목록' }))

    expect(
      screen.getByText('중간고사 공지 확인 — 범위 1~4주차'),
    ).toBeInTheDocument()
  })

  it('filters note previews by their content', () => {
    render(
      <ToastProvider>
        <NotesPage />
      </ToastProvider>,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: '노트 검색' }), {
      target: { value: '스케줄링' },
    })

    expect(screen.getByText('RR vs SJF 차이')).toBeInTheDocument()
    expect(
      screen.queryByText('이중 연결 리스트 삽입 요약'),
    ).not.toBeInTheDocument()
  })
})
