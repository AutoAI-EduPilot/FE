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

describe('QuizPage', () => {
  it('validates an empty answer', () => {
    renderQuizPage()

    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('alert')).toHaveTextContent('답안을 입력하세요.')
  })

  it('locks duplicate submit after a valid answer', () => {
    renderQuizPage()

    fireEvent.click(screen.getByLabelText('개념의 정의를 먼저 확인한다.'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('button', { name: '제출 완료' })).toBeDisabled()
    expect(screen.getByRole('heading', { name: '결과' })).toBeInTheDocument()
  })

  it('renders short answer input by selected type', () => {
    renderQuizPage()

    fireEvent.click(screen.getByRole('tab', { name: 'SHORT' }))
    fireEvent.change(
      screen.getByLabelText('현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.'),
      { target: { value: '메타인지' } },
    )
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('button', { name: '제출 완료' })).toBeDisabled()
  })

  it('does not expose private answer data in fixtures or result UI', () => {
    renderQuizPage()

    fireEvent.click(screen.getByLabelText('개념의 정의를 먼저 확인한다.'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    const publicFixture = JSON.stringify({ publicQuizQuestions, publicQuizResult })
    expect(publicFixture).not.toMatch(/correctAnswer|rubric|privateAnswer/i)
    expect(screen.queryByText(/정답|루브릭|private answer/i)).not.toBeInTheDocument()
  })
})
