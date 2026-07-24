import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatPanel } from './ChatPanel'
import {
  cancelStreamingReply,
  createRequestId,
  createStreamingReply,
  isMockStreamAborted,
  resetMockStreamingState,
} from './mockStreaming'

afterEach(() => {
  cleanup()
  resetMockStreamingState()
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

describe('mock streaming controller', () => {
  it('aborts mock streams through AbortController when cancelled', () => {
    const message = createStreamingReply('req-abort')

    expect(isMockStreamAborted('req-abort')).toBe(false)
    cancelStreamingReply(message)

    expect(isMockStreamAborted('req-abort')).toBe(true)
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

  it('locks new input while a mock stream is active', () => {
    render(<ChatPanel sessionId="session-100" />)

    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '핵심 개념을 알려 주세요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(screen.getByLabelText('질문')).toBeDisabled()
    expect(screen.getByRole('button', { name: '응답 대기 중' })).toBeDisabled()
  })

  it('advances mock streaming progress into a completed message', () => {
    render(<ChatPanel sessionId="session-100" />)

    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '예시와 함께 설명해 주세요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))
    fireEvent.click(screen.getByRole('button', { name: '응답 진행' }))

    expect(screen.getByRole('progressbar', { name: '응답 진행률 70%' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '응답 진행' }))

    expect(
      screen.getByText('현재 페이지의 핵심 개념을 예시와 함께 정리했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '질문 보내기' })).toBeEnabled()
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
