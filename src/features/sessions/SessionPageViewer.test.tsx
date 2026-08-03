import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SessionPageViewer } from './SessionPageViewer'

afterEach(cleanup)

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
    expect(outlineButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('navigation', { name: '자료 페이지' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /형광펜/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument()

    fireEvent.click(outlineButton)

    expect(outlineButton).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('navigation', { name: '자료 페이지' }),
    ).toBeInTheDocument()
  })

  it('moves pages with arrow keys and zooms with control-wheel', () => {
    const onMovePage = vi.fn()
    render(
      <SessionPageViewer
        currentPage={2}
        file={undefined}
        materialTitle="학습 자료.pdf"
        onMovePage={onMovePage}
        totalPages={3}
      />,
    )

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(onMovePage).toHaveBeenNthCalledWith(1, 3)
    expect(onMovePage).toHaveBeenNthCalledWith(2, 1)

    fireEvent.wheel(screen.getByRole('region', { name: 'PDF 뷰어' }), {
      ctrlKey: true,
      deltaY: -100,
    })
    expect(screen.getByText('110%')).toBeInTheDocument()
  })
})
