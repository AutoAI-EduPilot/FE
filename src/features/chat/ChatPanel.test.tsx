import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatPanel } from './ChatPanel'
import { createRequestId } from './mockStreaming'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('createRequestId', () => {
  it('creates unique request IDs', () => {
    const first = createRequestId(1000)
    const second = createRequestId(1000)

    expect(first).toMatch(/^req-1000-/)
    expect(second).toMatch(/^req-1000-/)
    expect(first).not.toBe(second)
  })
})

describe('ChatPanel', () => {
  it('validates empty questions before starting a stream', () => {
    render(<ChatPanel sessionId="session-100" />)

    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('질문을 입력하세요.')
  })

  it('renders submitted questions with a streaming assistant message', () => {
    render(<ChatPanel sessionId="session-100" />)

    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '이 페이지의 핵심은 무엇인가요?' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(screen.getByText('이 페이지의 핵심은 무엇인가요?')).toBeInTheDocument()
    expect(screen.getByText('답변을 생성하는 중입니다.')).toBeInTheDocument()
    expect(screen.getByText(/requestId req-/)).toBeInTheDocument()
  })

  it('supports stream cancel and retry states', () => {
    render(<ChatPanel sessionId="session-100" />)

    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '예시를 들어 주세요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))
    fireEvent.click(screen.getByRole('button', { name: '응답 취소' }))

    expect(screen.getByText('응답이 취소되었습니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(screen.getByText('답변을 다시 생성하는 중입니다.')).toBeInTheDocument()
  })
})
