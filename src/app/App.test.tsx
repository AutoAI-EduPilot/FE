import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('renders the Epic1 foundation status', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: '학습 경험을 위한 프론트엔드 기반이 준비되었습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Spring 전용 공통 API client')).toBeInTheDocument()
  })
})
