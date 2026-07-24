import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from './AppRoutes'

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('redirects the root route to materials', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { name: '자료' })).toBeInTheDocument()
    expect(screen.getByText('BE#48 연동 예정')).toBeInTheDocument()
  })

  it('renders the session detail placeholder route', () => {
    renderRoute('/sessions/session-100')

    expect(screen.getByRole('heading', { name: '학습 공간' })).toBeInTheDocument()
    expect(screen.getByText('시험 대비 요약.pdf 학습 화면입니다.')).toBeInTheDocument()
  })

  it('renders the not found route for unknown paths', () => {
    renderRoute('/missing-page')

    expect(
      screen.getByRole('heading', {
        name: '페이지를 찾을 수 없습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '자료 화면으로' })).toHaveAttribute(
      'href',
      '/materials',
    )
  })
})
