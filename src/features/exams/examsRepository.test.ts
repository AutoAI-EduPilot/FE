import { describe, expect, it, vi } from 'vitest'

import type { ApiSuccess } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'
import { createExamsRepository, type CreateExamInput } from './examsRepository'

const examDto = {
  allowRetake: false,
  classroomId: 30,
  examId: 10,
  questions: [{ maxScore: 20, questionId: 'q1', questionText: '표준편차란?', questionType: 'SHORT', referenceAnswer: '퍼진 정도' }],
  status: 'DRAFT',
  title: '중간 점검',
  totalScore: 20,
  weekNumber: 4,
}

const submissionDto = {
  attemptNo: 1,
  items: [{ answer: '답', maxScore: 20, questionId: 'q1', score: 20, verdict: 'CORRECT' }],
  maxScore: 20,
  score: 20,
  status: 'GRADED',
  submissionId: 300,
  submittedAt: '2026-08-03T00:00:00Z',
}

describe('exams repository', () => {
  it('connects instructor exam lifecycle endpoints and maps patch presence fields', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(success({ items: [examDto], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
      .mockResolvedValueOnce(success(examDto))
      .mockResolvedValueOnce(success(examDto))
      .mockResolvedValueOnce(success(examDto))
      .mockResolvedValueOnce(success({ ...examDto, status: 'PUBLISHED' }))
      .mockResolvedValueOnce(success({ ...examDto, status: 'CLOSED' }))
      .mockResolvedValueOnce(success(undefined))
    const repository = createExamsRepository(request as AuthenticatedRequest)
    const input: CreateExamInput = { allowRetake: false, questions: [{ points: 20, questionText: '표준편차란?', questionType: 'SHORT', referenceAnswer: '퍼진 정도' }], title: '중간 점검', weekNumber: 4 }

    await expect(repository.list('30', 'DRAFT')).resolves.toMatchObject([{ id: '10', questions: [{ id: 'q1', points: 20 }] }])
    await repository.create('30', input)
    await repository.get('10')
    await repository.update('10', { title: '수정 시험', questions: input.questions })
    await repository.publish('10')
    await repository.close('10')
    await repository.delete('10')

    expect(request).toHaveBeenNthCalledWith(1, '/api/classrooms/30/exams?page=0&size=100&status=DRAFT', { signal: undefined })
    expect(request).toHaveBeenNthCalledWith(2, '/api/classrooms/30/exams', expect.objectContaining({ method: 'POST' }))
    expect(request).toHaveBeenNthCalledWith(3, '/api/exams/10', { signal: undefined })
    expect(request).toHaveBeenNthCalledWith(4, '/api/exams/10', expect.objectContaining({ body: expect.objectContaining({ questionsPresent: true, titlePresent: true }), method: 'PATCH' }))
    expect(request).toHaveBeenNthCalledWith(5, '/api/exams/10/publish', { method: 'POST', signal: undefined })
    expect(request).toHaveBeenNthCalledWith(6, '/api/exams/10/close', { method: 'POST', signal: undefined })
    expect(request).toHaveBeenNthCalledWith(7, '/api/exams/10', { method: 'DELETE', signal: undefined })
  })

  it('connects learner submission and instructor result endpoints', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(success(submissionDto))
      .mockResolvedValueOnce(success(submissionDto))
      .mockResolvedValueOnce(success(submissionDto))
      .mockResolvedValueOnce(success({ items: [{ ...submissionDto, attemptCount: 1, userId: 7, userName: '김학습' }], page: 0, size: 100, totalElements: 1, totalPages: 1 }))
    const repository = createExamsRepository(request as AuthenticatedRequest)

    await expect(repository.submit('10', { q1: '답' }, 'request-1')).resolves.toMatchObject({ id: '300', status: 'GRADED' })
    await repository.getMySubmission('10', 1)
    await repository.getSubmission('10', '300')
    await expect(repository.listSubmissions('10')).resolves.toMatchObject([{ id: '300', userId: '7' }])

    expect(request).toHaveBeenNthCalledWith(1, '/api/exams/10/submissions', expect.objectContaining({ body: { answers: [{ answer: '답', questionId: 'q1' }], requestId: 'request-1' }, method: 'POST' }))
    expect(request).toHaveBeenNthCalledWith(2, '/api/exams/10/submissions/me?attemptNo=1', { signal: undefined })
    expect(request).toHaveBeenNthCalledWith(3, '/api/exams/10/submissions/300', { signal: undefined })
    expect(request).toHaveBeenNthCalledWith(4, '/api/exams/10/submissions?page=0&size=100', { signal: undefined })
  })
})

function success<T>(data: T): ApiSuccess<T> { return { data, message: '성공', success: true } }
