import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedRequest } from '../auth'
import { createClassroomsRepository } from './classroomsRepository'

describe('classrooms repository', () => {
  it('maps classroom lists and sends the documented create body', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ data: { items: [classroomDto], page: 0, size: 20, totalElements: 1, totalPages: 1 } })
      .mockResolvedValueOnce({ data: classroomDto })
    const repository = createClassroomsRepository(request as AuthenticatedRequest)

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({ id: '12', name: '자료구조', weekCount: 15 }),
    ])
    await repository.create({ color: 'BLUE', endDate: '2026-11-15', name: '자료구조', startDate: '2026-08-03' })

    expect(request).toHaveBeenNthCalledWith(1, '/api/classrooms?page=0&size=100&sort=RECENT', expect.any(Object))
    expect(request).toHaveBeenNthCalledWith(2, '/api/classrooms', expect.objectContaining({
      body: expect.objectContaining({ color: 'BLUE', endDate: '2026-11-15', startDate: '2026-08-03' }),
      method: 'POST',
    }))
  })

  it('uses explicit partial-update presence flags', async () => {
    const request = vi.fn().mockResolvedValue({ data: classroomDto })
    const repository = createClassroomsRepository(request as AuthenticatedRequest)
    await repository.update('12', { description: '', name: '새 이름' })
    expect(request).toHaveBeenCalledWith('/api/classrooms/12', {
      body: { description: '', descriptionPresent: true, name: '새 이름', namePresent: true },
      method: 'PATCH',
    })
  })
})

const classroomDto = {
  classroomId: 12,
  color: 'BLUE',
  endDate: '2026-11-15',
  instructorName: '박교수',
  learnerCount: 42,
  name: '자료구조',
  pendingRequestCount: 3,
  progressRate: 62,
  startDate: '2026-08-03',
  status: 'ACTIVE',
  weekCount: 15,
}
