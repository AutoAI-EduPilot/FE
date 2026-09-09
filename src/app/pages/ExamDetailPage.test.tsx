import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../features/auth'
import { ToastProvider } from '../../shared/ui'
import { ExamDetailPage } from './ExamDetailPage'

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('ExamDetailPage AI draft', () => {
  it('loads an AI draft into the instructor editor without saving it automatically', async () => {
    let draftBody: unknown
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (method === 'GET' && url.pathname === '/api/exams/10') return success(examFixture)
      if (method === 'POST' && url.pathname === '/api/classrooms/30/exams/10/draft-questions') {
        draftBody = JSON.parse(String(init?.body))
        return success({
          examId: 10,
          questions: [{
            answerChoiceId: 'a',
            choices: [{ choiceId: 'a', text: '스택' }, { choiceId: 'b', text: '큐' }],
            explanation: 'LIFO 구조입니다.',
            points: 10,
            questionId: 'draft-1',
            questionText: '후입선출 자료구조는?',
            questionType: 'MCQ',
            sourcePageNumber: 3,
          }],
          truncated: true,
        })
      }
      return new Response(null, { status: 404 })
    })

    render(
      <MemoryRouter initialEntries={['/classrooms/30/exams/10']}>
        <AuthProvider initialUser={{ email: 'instructor@example.com', id: 7, name: '강의자', role: 'INSTRUCTOR' }}>
          <ToastProvider>
            <Routes><Route element={<ExamDetailPage />} path="/classrooms/:classroomId/exams/:examId" /></Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'AI 초안으로 시작' }))
    expect(screen.getByRole('dialog', { name: 'AI 문항 초안' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('객관식 문항 수'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('단답형 문항 수'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: '초안 생성' }))

    expect(await screen.findByDisplayValue('후입선출 자료구조는?')).toBeInTheDocument()
    expect(screen.getByText('참고 자료 3번')).toBeInTheDocument()
    expect(screen.getByText('자료가 많아 앞 30페이지만 사용되었습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '변경 저장' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(draftBody).toEqual({
      questionPlan: [{ count: 1, questionType: 'MCQ' }],
      weekNumber: 4,
    }))
  })
})

describe('ExamDetailPage learner submission', () => {
  it('restores a saved answer draft for the current learner and exam', async () => {
    sessionStorage.setItem('exam-draft:10:8', JSON.stringify({ q1: '복원된 답안' }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      if (url.pathname === '/api/exams/10') return success(learnerExamFixture)
      return new Response(null, { status: 404 })
    })

    renderLearnerExam()

    const answer = await screen.findByPlaceholderText('답안을 입력하세요')
    expect(answer).toHaveValue('복원된 답안')
    fireEvent.change(answer, { target: { value: '수정한 답안' } })
    await waitFor(() => {
      expect(JSON.parse(sessionStorage.getItem('exam-draft:10:8') ?? '{}')).toEqual({ q1: '수정한 답안' })
    })
  })

  it('replaces the answer form with an immutable completion state after async submission', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      const method = input instanceof Request ? input.method : (init?.method ?? 'GET')
      if (method === 'GET' && url.pathname === '/api/exams/10') return success(learnerExamFixture)
      if (method === 'POST' && url.pathname === '/api/exams/10/submissions') {
        return success({
          attemptNo: 1,
          items: [{ answer: '스택', maxScore: 10, questionId: 'q1', score: null, verdict: null }],
          maxScore: 10,
          normalizedScore: null,
          score: null,
          status: 'SUBMITTED',
          submissionId: 300,
          submittedAt: '2026-09-09T01:00:00Z',
        })
      }
      return new Response(null, { status: 404 })
    })

    renderLearnerExam()

    const answer = await screen.findByPlaceholderText('답안을 입력하세요')
    fireEvent.change(answer, { target: { value: '스택' } })
    await waitFor(() => expect(sessionStorage.getItem('exam-draft:10:8')).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '시험 제출' }))

    expect(await screen.findByRole('heading', { name: '시험 제출이 완료되었습니다' })).toBeInTheDocument()
    expect(screen.getByText('제출한 답안은 수정할 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('답안을 입력하세요')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '시험 제출' })).not.toBeInTheDocument()
    expect(sessionStorage.getItem('exam-draft:10:8')).toBeNull()
  })

  it('restores a completed submission and its feedback after re-entry', async () => {
    const requestedPaths: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
      requestedPaths.push(url.pathname)
      if (url.pathname === '/api/exams/10') {
        return success({
          ...learnerExamFixture,
          latestSubmission: {
            attemptNo: 1,
            maxScore: 10,
            normalizedScore: 80,
            score: 8,
            status: 'GRADED',
            submissionId: 300,
          },
          submittable: false,
        })
      }
      if (url.pathname === '/api/exams/10/submissions/me') {
        return success({
          attemptNo: 1,
          gradedAt: '2026-09-09T01:00:10Z',
          items: [{ answer: '스택', feedback: '핵심 개념을 정확히 작성했습니다.', maxScore: 10, questionId: 'q1', score: 8, verdict: 'CORRECT' }],
          maxScore: 10,
          normalizedScore: 80,
          score: 8,
          status: 'GRADED',
          submissionId: 300,
          submittedAt: '2026-09-09T01:00:00Z',
        })
      }
      return new Response(null, { status: 404 })
    })

    renderLearnerExam()

    expect(await screen.findByRole('heading', { name: '시험 제출 및 채점이 완료되었습니다' })).toBeInTheDocument()
    expect(screen.getByText(/8\/10점/)).toBeInTheDocument()
    expect(screen.getByText('핵심 개념을 정확히 작성했습니다.')).toBeInTheDocument()
    expect(requestedPaths).toContain('/api/exams/10/submissions/me')
    expect(screen.queryByPlaceholderText('답안을 입력하세요')).not.toBeInTheDocument()
  })
})

function renderLearnerExam() {
  return render(
    <MemoryRouter initialEntries={['/classrooms/30/exams/10']}>
      <AuthProvider initialUser={{ email: 'learner@example.com', id: 8, name: '학습자', role: 'LEARNER' }}>
        <ToastProvider>
          <Routes><Route element={<ExamDetailPage />} path="/classrooms/:classroomId/exams/:examId" /></Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const examFixture = {
  allowRetake: false,
  classroomId: 30,
  description: '자료구조 평가',
  examId: 10,
  questionCount: 0,
  questions: [],
  status: 'DRAFT',
  title: '중간 점검',
  totalScore: 0,
  weekNumber: 4,
}

const learnerExamFixture = {
  allowRetake: false,
  classroomId: 30,
  description: '자료구조 평가',
  examId: 10,
  latestSubmission: null,
  questions: [{ maxScore: 10, questionId: 'q1', questionText: '스택의 특징을 설명하세요.', questionType: 'SHORT' }],
  status: 'PUBLISHED',
  submittable: true,
  title: '중간 점검',
  totalScore: 10,
  weekNumber: 4,
}

function success(data: unknown): Response {
  return new Response(JSON.stringify({ data, message: '요청이 성공했습니다.', success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}
