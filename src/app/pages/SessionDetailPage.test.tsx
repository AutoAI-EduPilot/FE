import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TestAuthProvider } from '../../test/TestAuthProvider'
import { installApiFixtureServer } from '../../test/apiFixtureServer'
import { SessionDetailPage } from './SessionDetailPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function renderSessionDetail(path = '/sessions/100') {
  return render(
    <TestAuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/quizzes/:quizId" element={<p>퀴즈 화면</p>} />
          <Route
            path="/sessions/:sessionId/diagnosis/:diagnosisId"
            element={<p>진단 화면</p>}
          />
        </Routes>
      </MemoryRouter>
    </TestAuthProvider>,
  )
}

describe('SessionDetailPage', () => {
  it('updates pages only after the page API succeeds', async () => {
    renderSessionDetail()

    expect(
      await screen.findByRole(
        'progressbar',
        { name: '학습 진행률 1 / 5쪽' },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    await waitFor(() =>
      expect(
        screen.getByRole('progressbar', { name: '학습 진행률 2 / 5쪽' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: '4쪽으로 이동' }))
    await waitFor(() =>
      expect(
        screen.getByRole('progressbar', { name: '학습 진행률 4 / 5쪽' }),
      ).toBeInTheDocument(),
    )
  })

  it('renders a session 404 state', async () => {
    renderSessionDetail('/sessions/999')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '세션을 찾을 수 없습니다.',
    )
  })

  it('runs an explain turn from the restored widget and shows the AI message', async () => {
    renderSessionDetail()

    expect(
      await screen.findByText('현재 페이지를 설명할까요?'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '네' }))

    expect(
      await screen.findByText('이 페이지는 핵심 개념의 정의를 다룹니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('퀴즈를 진행할까요?')).toBeInTheDocument()
  })

  it('opens the quiz-type selector and navigates to the created quiz', async () => {
    renderSessionDetail()

    fireEvent.click(await screen.findByRole('button', { name: '네' }))
    await screen.findByText('퀴즈를 진행할까요?')

    fireEvent.click(screen.getByRole('button', { name: '네' }))
    expect(
      await screen.findByText('어떤 유형의 퀴즈를 풀까요?'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '객관식' }))
    expect(await screen.findByText('퀴즈 화면')).toBeInTheDocument()
  })

  it('renders the submitted quiz history with score badges', async () => {
    renderSessionDetail()

    expect(await screen.findByText('퀴즈 기록')).toBeInTheDocument()
    expect(screen.getByText('학습 확인 퀴즈')).toBeInTheDocument()
    expect(screen.getByText('객관식')).toBeInTheDocument()
    expect(screen.getByText('48점')).toBeInTheDocument()
  })

  it('dismisses the widget when the no/WAIT branch is chosen', async () => {
    renderSessionDetail()

    fireEvent.click(await screen.findByRole('button', { name: '아니요' }))

    await waitFor(() =>
      expect(
        screen.queryByText('현재 페이지를 설명할까요?'),
      ).not.toBeInTheDocument(),
    )
  })
})
