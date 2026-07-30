import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionPageViewer } from './SessionPageViewer'

describe('SessionPageViewer', () => {
  it('toggles the outline and omits the highlighter tool', () => {
    render(
      <SessionPageViewer
        currentPage={1}
        file={undefined}
        materialTitle="학습 자료.pdf"
        onMovePage={vi.fn()}
        totalPages={3}
      />,
    )

    const outlineButton = screen.getByRole('button', { name: '목차' })
    expect(outlineButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('navigation', { name: '자료 페이지' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /형광펜/ })).not.toBeInTheDocument()

    fireEvent.click(outlineButton)

    expect(outlineButton).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByRole('navigation', { name: '자료 페이지' }),
    ).not.toBeInTheDocument()
  })
})
