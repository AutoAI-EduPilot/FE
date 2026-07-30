import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TestAuthProvider } from '../../test/TestAuthProvider'
import { installApiFixtureServer } from '../../test/apiFixtureServer'
import { QuizPage } from './QuizPage'

beforeEach(() => {
  installApiFixtureServer()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function renderQuizPage() {
  return render(
    <TestAuthProvider>
      <MemoryRouter initialEntries={['/quizzes/50']}>
        <Routes>
          <Route path="/quizzes/:quizId" element={<QuizPage />} />
        </Routes>
      </MemoryRouter>
    </TestAuthProvider>,
  )
}

async function answerAllQuestions() {
  await screen.findByLabelText('개념의 정의를 먼저 확인한다.')
  fireEvent.click(screen.getByLabelText('개념의 정의를 먼저 확인한다.'))
  fireEvent.click(screen.getByRole('tab', { name: 'OX' }))
  fireEvent.click(screen.getByLabelText('O'))
  fireEvent.click(screen.getByRole('tab', { name: '단답형' }))
  fireEvent.change(
    screen.getByLabelText(
      '현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.',
    ),
    { target: { value: '메타인지' } },
  )
  fireEvent.click(screen.getByRole('tab', { name: '서술형' }))
  fireEvent.change(
    screen.getByLabelText(
      '오늘 학습한 내용을 자신의 말로 설명해 보세요.',
    ),
    {
      target: {
        value: '핵심 개념을 먼저 정의하고 예시로 이해했습니다.',
      },
    },
  )
}

describe('QuizPage', () => {
  it('validates an empty answer from an API quiz', async () => {
    renderQuizPage()
    await screen.findByText('문항 1 / 4 · 답변 0 / 4')

    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('alert')).toHaveTextContent('답안을 입력하세요.')
  })

  it('locks duplicate submit after the submit API succeeds', async () => {
    renderQuizPage()

    await answerAllQuestions()
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(
      await screen.findByRole('button', { name: '제출 완료' }),
    ).toBeDisabled()
    expect(screen.getByRole('heading', { name: '결과' })).toBeInTheDocument()
  })

  it('shows progress across API questions', async () => {
    renderQuizPage()

    expect(
      await screen.findByText('문항 1 / 4 · 답변 0 / 4'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 문항' }))

    expect(screen.getByText('문항 2 / 4 · 답변 0 / 4')).toBeInTheDocument()
  })

  it('renders the diagnosis action returned by quiz submission', async () => {
    renderQuizPage()

    await answerAllQuestions()
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(await screen.findByText('점수 48')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '진단으로 이어가기' }),
    ).toHaveAttribute('href', '/sessions/100/diagnosis/42')
    expect(
      screen.queryByText(/정답|루브릭|private answer/i),
    ).not.toBeInTheDocument()
  })
})
