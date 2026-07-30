import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ToastProvider } from '../../shared/ui'
import { CalendarPage, NotesPage } from './PlaceholderFeaturePage'

afterEach(cleanup)

describe('unconnected feature pages', () => {
  it('shows an empty calendar without demo events', () => {
    render(
      <ToastProvider>
        <CalendarPage />
      </ToastProvider>,
    )

    expect(screen.getByText('표시할 일정이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('자료구조')).not.toBeInTheDocument()
  })

  it('shows an empty notes page without demo notes', () => {
    render(
      <ToastProvider>
        <NotesPage />
      </ToastProvider>,
    )

    expect(screen.getByText('저장된 노트가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('RR vs SJF 차이')).not.toBeInTheDocument()
  })
})
