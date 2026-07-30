import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider, useTheme } from '.'

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

function ThemeControl() {
  const { mode, setMode } = useTheme()

  return (
    <button onClick={() => setMode('dark')} type="button">
      {mode}
    </button>
  )
}

describe('ThemeProvider', () => {
  it('uses the light theme when no preference is stored', () => {
    render(
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: 'light' })).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('stores and applies the selected dark theme', () => {
    render(
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'light' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('edupilot.theme')).toBe('dark')
  })
})
