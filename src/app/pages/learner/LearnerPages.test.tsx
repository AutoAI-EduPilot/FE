import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { TestAuthProvider } from '../../../test/TestAuthProvider'
import { LearnerNotesPage } from './LearnerNotesPage'
import { LearnerReviewQuizzesPage } from './LearnerReviewQuizzesPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderPage(page: ReactNode) {
  return render(
    <MemoryRouter>
      <TestAuthProvider>{page}</TestAuthProvider>
    </MemoryRouter>,
  )
}

describe('learner collection pages', () => {
  it('keeps the notes page usable when older sessions have no notes endpoint', async () => {
    mockLearnerCollectionApi({ notesUnavailable: true })
    renderPage(<LearnerNotesPage />)

    expect(
      await screen.findByRole('heading', { name: '저장한 노트가 없습니다' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('collects quizzes from learning sessions', async () => {
    mockLearnerCollectionApi()
    renderPage(<LearnerReviewQuizzesPage />)

    expect(await screen.findByText('학습 확인 퀴즈')).toBeInTheDocument()
    expect(screen.getByText('복습 필요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /결과 보기/ })).toHaveAttribute(
      'href',
      '/quizzes/50',
    )
  })
})

function mockLearnerCollectionApi(
  options: { notesUnavailable?: boolean } = {},
) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      'http://localhost',
    )

    if (url.pathname === '/api/sessions') {
      return success({
        items: [
          {
            currentPage: 3,
            materialId: 10,
            materialTitle: '시험 대비 요약.pdf',
            sessionId: 100,
            status: 'ACTIVE',
            updatedAt: '2026-08-01T06:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      })
    }

    if (url.pathname === '/api/sessions/100/notes') {
      if (options.notesUnavailable) return new Response(null, { status: 404 })
      return success({
        items: [],
        page: 0,
        size: 100,
        totalElements: 0,
        totalPages: 0,
      })
    }

    if (url.pathname === '/api/sessions/100/quizzes') {
      return success({
        items: [
          {
            createdAt: '2026-08-01T07:00:00Z',
            maxScore: 5,
            passed: false,
            quizId: 50,
            quizType: 'MULTIPLE_CHOICE',
            score: 2,
            submitted: true,
            title: '학습 확인 퀴즈',
          },
        ],
      })
    }

    return new Response(null, { status: 404 })
  })
}

function success(data: unknown): Response {
  return new Response(
    JSON.stringify({ data, message: '요청이 성공했습니다.', success: true }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}
