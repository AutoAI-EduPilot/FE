import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SessionsRepository } from '../sessions'
import { ChatPanel } from './ChatPanel'
import { useSessionChat } from './useSessionChat'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function ChatHarness({
  repository,
  sessionId = '100',
}: {
  repository: SessionsRepository
  sessionId?: string
}) {
  const chat = useSessionChat(repository, sessionId)
  return <ChatPanel chat={chat} sessionId={sessionId} />
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
        payload: { message: '이 페이지의 핵심은 무엇인가요?' },
      }),
    )
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
    movePage: vi.fn(),
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
