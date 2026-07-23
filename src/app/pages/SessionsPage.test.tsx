import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyUiActionToPage,
  mockUiActions,
  UiActionsRenderer,
} from '../../features/sessions'
import { SessionDetailPage } from './SessionDetailPage'
import { SessionsPage } from './SessionsPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderSessionsPage() {
  return render(
    <MemoryRouter>
      <SessionsPage />
    </MemoryRouter>,
  )
}

function renderSessionDetail(path = '/sessions/session-100') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SessionsPage', () => {
  it('renders session list and resume entry points', () => {
    renderSessionsPage()

    expect(screen.getByRole('heading', { name: '학습 세션' })).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '학습 재개' })).toHaveAttribute(
      'href',
      '/sessions/session-100',
    )
  })
})

describe('SessionDetailPage', () => {
  it('moves pages through the mock PDF controller', () => {
    renderSessionDetail()

    expect(screen.getByText('페이지 1 / 5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByText('페이지 2 / 5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '4쪽으로 이동' }))
    expect(screen.getByText('페이지 4 / 5')).toBeInTheDocument()
  })

  it('applies MOVE_NEXT_PAGE as a page action and keeps WAIT local', () => {
    renderSessionDetail()

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지로' }))

    expect(screen.getByText('페이지 2 / 5')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('로컬 대기 0.8초')
  })

  it('renders missing session state', () => {
    renderSessionDetail('/sessions/missing-session')

    expect(screen.getByRole('alert')).toHaveTextContent('세션을 찾을 수 없습니다.')
  })
})

describe('UiActionsRenderer', () => {
  it('renders supported actions and emits page actions only for MOVE_NEXT_PAGE', () => {
    const onMoveNextPage = vi.fn()

    render(<UiActionsRenderer actions={mockUiActions} onMoveNextPage={onMoveNextPage} />)
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지로' }))

    expect(onMoveNextPage).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'MOVE_NEXT_PAGE' }),
    )
    expect(screen.getByRole('status')).toHaveTextContent('잠시 생각하기')
    expect(applyUiActionToPage(mockUiActions[1], 2, 5)).toBe(2)
  })
})
