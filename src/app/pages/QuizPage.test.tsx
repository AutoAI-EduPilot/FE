import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { publicQuizQuestions, publicQuizResult } from '../../features/quiz'
import { QuizPage } from './QuizPage'

afterEach(() => {
  cleanup()
})

function renderQuizPage() {
  return render(
    <MemoryRouter>
      <QuizPage />
    </MemoryRouter>,
  )
}

function answerAllQuestions() {
  fireEvent.click(screen.getByLabelText('개념의 정의를 먼저 확인한다.'))
  fireEvent.click(screen.getByRole('tab', { name: 'OX' }))
  fireEvent.click(screen.getByLabelText('O'))
  fireEvent.click(screen.getByRole('tab', { name: 'SHORT' }))
  fireEvent.change(screen.getByLabelText('현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.'), {
    target: { value: '메타인지' },
  })
  fireEvent.click(screen.getByRole('tab', { name: 'ESSAY' }))
  fireEvent.change(screen.getByLabelText('오늘 학습한 내용을 자신의 말로 설명해 보세요.'), {
    target: { value: '핵심 개념을 먼저 정의하고 예시로 이해했습니다.' },
  })
}

describe('QuizPage', () => {
  it('validates an empty answer', () => {
    renderQuizPage()

    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('alert')).toHaveTextContent('답안을 입력하세요.')
  })

  it('locks duplicate submit after a valid answer', () => {
    renderQuizPage()

    answerAllQuestions()
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('button', { name: '제출 완료' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: '결과' })).toBeInTheDocument()
  })

  it('shows progress across multiple quiz questions', () => {
    renderQuizPage()

    expect(screen.getByText('문항 1 / 4 · 답변 0 / 4')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 문항' }))

    expect(screen.getByText('문항 2 / 4 · 답변 0 / 4')).toBeInTheDocument()
  })

  it('renders short answer input by selected type', () => {
    renderQuizPage()

    fireEvent.click(screen.getByRole('tab', { name: 'SHORT' }))
    fireEvent.change(
      screen.getByLabelText('현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.'),
      { target: { value: '메타인지' } },
    )

    expect(screen.getByText('문항 3 / 4 · 답변 1 / 4')).toBeInTheDocument()
  })

  it('renders low score diagnosis entry without exposing private data', () => {
    renderQuizPage()

    answerAllQuestions()
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByText('점수 48')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '진단으로 이어가기' })).toHaveAttribute(
      'href',
      '/sessions/session-100/diagnosis/diagnosis-low-score',
    )
  })

  it('does not expose private answer data in fixtures or result UI', () => {
    renderQuizPage()

    answerAllQuestions()
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    const publicFixture = JSON.stringify({ publicQuizQuestions, publicQuizResult })
    expect(publicFixture).not.toMatch(/correctAnswer|rubric|privateAnswer/i)
    expect(screen.queryByText(/정답|루브릭|private answer/i)).not.toBeInTheDocument()
  })
})
