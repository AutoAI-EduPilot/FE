import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedRequest } from '../auth'
import { createReportsRepository } from './reportsRepository'

describe('reports repository', () => {
  it('sends the instructor report scope and fills context omitted by the 202 response', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        generationId: 'generation-1',
        pollAfterSeconds: 4,
        reportId: 'report-1',
        status: 'PENDING',
      },
    })
    const repository = createReportsRepository(request as AuthenticatedRequest)

    await expect(repository.createReport('12', '31', {
      requestId: 'request-1',
      scope: { type: 'WEEK', weekNumber: 2 },
    })).resolves.toEqual(expect.objectContaining({
      classroomId: '12',
      criterionResults: [],
      overallScore: null,
      reportId: 'report-1',
      status: 'PENDING',
      studentId: '31',
    }))

    expect(request).toHaveBeenCalledWith('/api/classrooms/12/students/31/reports', {
      body: {
        criterionIds: undefined,
        requestId: 'request-1',
        scope: { type: 'WEEK', weekNumber: 2 },
      },
      method: 'POST',
    })
  })

  it('keeps insufficient-data scores null and uses server stage and trend values', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        classroomId: 12,
        criterionResults: [{
          criterionKey: 'quiz_accuracy',
          criterionName: '퀴즈 정확도',
          evidenceIds: [],
          narrative: '평가할 문항이 충분하지 않습니다.',
          score: null,
          status: 'INSUFFICIENT_DATA',
          trend: 'STABLE',
        }],
        overallScore: null,
        reportId: 'report-2',
        stage: '보완 필요',
        status: 'COMPLETED',
        studentId: 31,
        trend: 'DECLINING',
      },
    })
    const repository = createReportsRepository(request as AuthenticatedRequest)

    const report = await repository.getReport('report-2')

    expect(report.overallScore).toBeNull()
    expect(report.criterionResults[0]?.score).toBeNull()
    expect(report.stage).toBe('보완 필요')
    expect(report.trend).toBe('DECLINING')
    expect(request).toHaveBeenCalledWith('/api/reports/report-2', { signal: undefined })
  })
})
