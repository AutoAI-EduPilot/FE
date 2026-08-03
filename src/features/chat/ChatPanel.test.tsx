import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SessionsRepository } from '../sessions'
import { ChatPanel } from './ChatPanel'
import { useSessionChat } from './useSessionChat'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function ChatHarness({
  currentPage,
  repository,
  sessionId = '100',
}: {
  currentPage?: number
  repository: SessionsRepository
  sessionId?: string
}) {
  const chat = useSessionChat(repository, sessionId)
  return <ChatPanel chat={chat} currentPage={currentPage} sessionId={sessionId} />
}

describe('ChatPanel', () => {
  it('validates empty questions before sending a turn', async () => {
    render(<ChatHarness repository={createRepository()} />)
    await screen.findByText('보고 있는 페이지를 함께 읽고 답변해요')

    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('질문을 입력하세요.')
  })

  it('loads server history and renders the completed turn response', async () => {
    const repository = createRepository({
      listMessages: vi.fn().mockResolvedValue([
        {
          content: '이전 답변',
          createdAt: '2026-07-27T00:00:00Z',
          id: '500',
          senderType: 'AI',
        },
      ]),
    })
    render(<ChatHarness repository={repository} />)

    expect(await screen.findByText('이전 답변')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '이 페이지의 핵심은 무엇인가요?' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(
      await screen.findByText('서버에서 반환한 답변입니다.'),
    ).toBeInTheDocument()
    expect(repository.submitTurn).toHaveBeenCalledWith(
      '100',
      expect.objectContaining({
        eventType: 'USER_QUESTION',
        payload: {
          includeCurrentPage: true,
          message: '이 페이지의 핵심은 무엇인가요?',
        },
      }),
    )
  })

  it('attaches page context without rendering an attachment status chip', async () => {
    const repository = createRepository()
    render(<ChatHarness currentPage={3} repository={repository} />)
    await screen.findByText('보고 있는 페이지를 함께 읽고 답변해요')

    expect(screen.queryByText('현재 페이지 첨부됨 · 3쪽')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '일반적인 개념만 설명해 주세요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    await waitFor(() => expect(repository.submitTurn).toHaveBeenCalledWith(
      '100',
      expect.objectContaining({
        eventType: 'USER_QUESTION',
        payload: {
          includeCurrentPage: true,
          message: '일반적인 개념만 설명해 주세요.',
        },
      }),
    ))
  })

  it('locks input while the learning turn request is pending', async () => {
    let resolveTurn: ((value: Awaited<
      ReturnType<SessionsRepository['submitTurn']>
    >) => void) | undefined
    const repository = createRepository({
      submitTurn: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTurn = resolve
          }),
      ),
    })
    render(<ChatHarness repository={repository} />)
    await screen.findByText('보고 있는 페이지를 함께 읽고 답변해요')

    fireEvent.change(screen.getByLabelText('질문'), {
      target: { value: '핵심 개념을 알려 주세요.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(screen.getByLabelText('질문')).toBeDisabled()
    expect(screen.getByRole('button', { name: '응답 대기 중' })).toBeDisabled()

    resolveTurn?.({ messages: [], uiActions: [] })
  })

  it('starts a server-side conversation before clearing the visible chat', async () => {
    const repository = createRepository({
      listMessages: vi.fn().mockResolvedValue([{ content: '이전 답변', createdAt: '2026-08-03T00:00:00Z', id: '1', senderType: 'AI' }]),
    })
    render(<ChatHarness repository={repository} />)
    expect(await screen.findByText('이전 답변')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '대화 새로 시작' }))

    await waitFor(() => expect(repository.startNewConversation).toHaveBeenCalledWith('100'))
    expect(screen.queryByText('이전 답변')).not.toBeInTheDocument()
  })

  it('renders assistant messages as markdown but keeps user text literal', async () => {
    const repository = createRepository({
      listMessages: vi.fn().mockResolvedValue([
        {
          content: '**핵심** 개념은 다음과 같습니다.\n\n- 첫째\n- 둘째',
          createdAt: '2026-07-27T00:00:00Z',
          id: '500',
          senderType: 'AI',
        },
        {
          content: '*별표*는 그대로 보여야 합니다.',
          createdAt: '2026-07-27T00:01:00Z',
          id: '501',
          senderType: 'USER',
        },
      ]),
    })
    render(<ChatHarness repository={repository} />)

    const strong = await screen.findByText('핵심')
    expect(strong.tagName).toBe('STRONG')
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('*별표*는 그대로 보여야 합니다.')).toBeInTheDocument()
  })

  it('renders GFM tables and preserves markdown when an answer is saved as a note', async () => {
    const repository = createRepository({
      listMessages: vi.fn().mockResolvedValue([
        {
          content: '# 워터마킹\n\n| 유형 | 목적 |\n| --- | --- |\n| zero-bit | 존재 여부 확인 |',
          createdAt: '2026-07-27T00:00:00Z',
          id: '500',
          senderType: 'AI',
        },
      ]),
    })
    render(<ChatHarness repository={repository} />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI 답변 복사' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI 답변 공유' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'AI 답변 노트에 저장' }))

    expect(await screen.findByRole('heading', { name: '워터마킹' })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows message actions on user chat bubbles', async () => {
    const repository = createRepository({
      listMessages: vi.fn().mockResolvedValue([
        {
          content: '이 질문을 정리해 주세요.',
          createdAt: '2026-07-27T00:00:00Z',
          id: '501',
          senderType: 'USER',
        },
      ]),
    })
    render(<ChatHarness repository={repository} />)

    expect(await screen.findByRole('button', { name: '내 질문 복사' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '내 질문 공유' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '내 질문 노트에 저장' })).toBeInTheDocument()
  })
})

function createRepository(
  overrides: Partial<SessionsRepository> = {},
): SessionsRepository {
  return {
    complete: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    listMessages: vi.fn().mockResolvedValue([]),
    listQuizzes: vi.fn(),
    startNewConversation: vi.fn().mockResolvedValue({
      conversationId: '1',
      startedAt: '2026-08-03T00:00:00Z',
    }),
    movePage: vi.fn(),
    stream: vi.fn().mockResolvedValue(undefined),
    submitTurn: vi.fn().mockResolvedValue({
      messages: [
        {
          content: '서버에서 반환한 답변입니다.',
          createdAt: '2026-07-27T00:00:00Z',
          id: '501',
          senderType: 'AI',
        },
      ],
      uiActions: [],
    }),
    ...overrides,
  }
}
