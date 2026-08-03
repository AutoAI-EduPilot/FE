import type { PagedResponse } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'

export type ClassroomColor = 'BLUE' | 'GREEN' | 'PURPLE' | 'ORANGE' | 'RED' | 'GRAY'
export type ClassroomStatus = 'ACTIVE' | 'COMPLETED'
export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const JOIN_REQUESTS_CHANGED_EVENT = 'edupilot:join-requests-changed'

export interface Classroom {
  color: ClassroomColor
  currentWeek?: number
  description?: string
  endDate: string
  id: string
  instructorName: string
  inviteCode?: string
  learnerCount: number
  materialCount?: number
  name: string
  pendingRequestCount: number
  progressRate: number
  startDate: string
  status: ClassroomStatus
  weekCount: number
}

export interface CreateClassroomInput {
  color: ClassroomColor
  description?: string
  endDate: string
  name: string
  startDate: string
}

export interface ClassroomMaterial {
  id: string
  pageCount?: number
  status: 'PROCESSING' | 'READY' | 'FAILED'
  title: string
  uploadedAt: string
  viewerCount?: number
  viewRate?: number
}

export interface ClassroomWeek {
  materials: ClassroomMaterial[]
  releaseAt?: string
  status: 'SCHEDULED' | 'PUBLISHED'
  title: string
  weekNumber: number
}

export interface ClassroomNotice {
  classroomId: string
  content: string
  createdAt: string
  id: string
  publishedAt: string
  title: string
  updatedAt: string
}

export interface JoinRequest {
  classroomId?: string
  classroomName?: string
  learner?: { affiliation?: string; email: string; id: string; name: string }
  processedAt?: string
  requestedAt: string
  requestId: string
  status: JoinRequestStatus
}

interface ClassroomDto {
  classroomId: number
  color: ClassroomColor
  currentWeek?: number
  description?: string
  endDate: string
  instructorName: string
  inviteCode?: string
  learnerCount?: number
  name: string
  pendingRequestCount?: number
  progressRate?: number
  startDate: string
  status: ClassroomStatus
  weekCount: number
}

interface WeekDto {
  materials: Array<{ materialId: number; pageCount?: number; processingStatus: ClassroomMaterial['status']; title: string; uploadedAt: string; viewerCount?: number; viewRate?: number }>
  releaseAt?: string
  status: ClassroomWeek['status']
  title: string
  weekNumber: number
}

interface NoticeDto {
  classroomId: number
  content: string
  createdAt: string
  noticeId: number
  publishedAt: string
  title: string
  updatedAt: string
}

interface JoinRequestDto {
  classroomId?: number
  classroomName?: string
  learner?: { affiliation?: string; email: string; name: string; userId: number }
  processedAt?: string
  requestedAt: string
  requestId: number
  status: JoinRequestStatus
}

export function createClassroomsRepository(request: AuthenticatedRequest) {
  return {
    async list(query = '', signal?: AbortSignal) {
      const params = new URLSearchParams({ page: '0', size: '100', sort: 'RECENT' })
      if (query.trim()) params.set('q', query.trim())
      const { data } = await request<PagedResponse<ClassroomDto>>(`/api/classrooms?${params}`, { signal })
      return data.items.map(mapClassroom)
    },
    async get(id: string, signal?: AbortSignal) {
      const { data } = await request<ClassroomDto>(`/api/classrooms/${encodeURIComponent(id)}`, { signal })
      return mapClassroom(data)
    },
    async create(input: CreateClassroomInput) {
      const { data } = await request<ClassroomDto>('/api/classrooms', {
        body: {
          color: input.color,
          description: input.description,
          endDate: input.endDate,
          name: input.name,
          startDate: input.startDate,
        },
        method: 'POST',
      })
      return mapClassroom(data)
    },
    async update(id: string, input: Partial<Omit<CreateClassroomInput, 'startDate'>>) {
      const body: Record<string, unknown> = {}
      if (input.name !== undefined) { body.namePresent = true; body.name = input.name }
      if (input.endDate !== undefined) { body.endDatePresent = true; body.endDate = input.endDate }
      if (input.color !== undefined) { body.colorPresent = true; body.color = input.color }
      if (input.description !== undefined) { body.descriptionPresent = true; body.description = input.description }
      const { data } = await request<ClassroomDto>(`/api/classrooms/${encodeURIComponent(id)}`, { body, method: 'PATCH' })
      return mapClassroom(data)
    },
    async complete(id: string) { await request(`/api/classrooms/${encodeURIComponent(id)}`, { method: 'DELETE' }) },
    async join(inviteCode: string) {
      const { data } = await request<JoinRequestDto>('/api/classroom-join-requests', {
        body: { inviteCode: inviteCode.trim() }, method: 'POST',
      })
      return mapJoinRequest(data)
    },
    async listMyJoinRequests(signal?: AbortSignal) {
      const { data } = await request<PagedResponse<JoinRequestDto>>('/api/classroom-join-requests/me?page=0&size=100', { signal })
      return data.items.map(mapJoinRequest)
    },
    async listWeeks(id: string, signal?: AbortSignal) {
      const { data } = await request<{ items: WeekDto[] }>(`/api/classrooms/${encodeURIComponent(id)}/weeks`, { signal })
      return data.items.map(mapWeek)
    },
    async createWeek(id: string, input: { releaseAt?: string; title: string; weekNumber?: number }) {
      const { data } = await request<WeekDto>(`/api/classrooms/${encodeURIComponent(id)}/weeks`, { body: input, method: 'POST' })
      return mapWeek(data)
    },
    async getInviteCode(id: string) {
      const { data } = await request<{ inviteCode: string }>(`/api/classrooms/${encodeURIComponent(id)}/invite-code`)
      return data.inviteCode
    },
    async regenerateInviteCode(id: string) {
      const { data } = await request<{ inviteCode: string }>(`/api/classrooms/${encodeURIComponent(id)}/invite-code/regenerate`, { method: 'POST' })
      return data.inviteCode
    },
    async updateWeek(id: string, weekNumber: number, input: { releaseAt?: string; title?: string }) {
      const body: Record<string, unknown> = {}
      if (input.title !== undefined) { body.titlePresent = true; body.title = input.title }
      if (input.releaseAt !== undefined) { body.releaseAtPresent = true; body.releaseAt = input.releaseAt }
      const { data } = await request<WeekDto>(`/api/classrooms/${encodeURIComponent(id)}/weeks/${weekNumber}`, { body, method: 'PATCH' })
      return mapWeek(data)
    },
    async deleteWeek(id: string, weekNumber: number) { await request(`/api/classrooms/${encodeURIComponent(id)}/weeks/${weekNumber}`, { method: 'DELETE' }) },
    async attachMaterial(id: string, weekNumber: number, materialId: string) { await request(`/api/classrooms/${encodeURIComponent(id)}/weeks/${weekNumber}/materials/${encodeURIComponent(materialId)}`, { method: 'POST' }) },
    async detachMaterial(id: string, weekNumber: number, materialId: string) { await request(`/api/classrooms/${encodeURIComponent(id)}/weeks/${weekNumber}/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' }) },
    async listNotices(id: string, signal?: AbortSignal) {
      const { data } = await request<PagedResponse<NoticeDto>>(`/api/classrooms/${encodeURIComponent(id)}/notices?page=0&size=100`, { signal })
      return data.items.map(mapNotice)
    },
    async createNotice(id: string, input: { content: string; title: string }) {
      const { data } = await request<NoticeDto>(`/api/classrooms/${encodeURIComponent(id)}/notices`, { body: input, method: 'POST' })
      return mapNotice(data)
    },
    async updateNotice(id: string, noticeId: string, input: { content?: string; title?: string }) {
      const body: Record<string, unknown> = {}
      if (input.title !== undefined) { body.titlePresent = true; body.title = input.title }
      if (input.content !== undefined) { body.contentPresent = true; body.content = input.content }
      const { data } = await request<NoticeDto>(`/api/classrooms/${encodeURIComponent(id)}/notices/${encodeURIComponent(noticeId)}`, { body, method: 'PATCH' })
      return mapNotice(data)
    },
    async deleteNotice(id: string, noticeId: string) { await request(`/api/classrooms/${encodeURIComponent(id)}/notices/${encodeURIComponent(noticeId)}`, { method: 'DELETE' }) },
    async listJoinRequests(id: string, status: JoinRequestStatus, signal?: AbortSignal) {
      const { data } = await request<PagedResponse<JoinRequestDto>>(`/api/classrooms/${encodeURIComponent(id)}/join-requests?status=${status}&page=0&size=100`, { signal })
      return data.items.map(mapJoinRequest)
    },
    async processJoinRequest(id: string, requestId: string, decision: 'approve' | 'reject') {
      await request(`/api/classrooms/${encodeURIComponent(id)}/join-requests/${encodeURIComponent(requestId)}/${decision}`, { method: 'POST' })
    },
  }
}

function mapClassroom(value: ClassroomDto): Classroom {
  return { ...value, id: String(value.classroomId), learnerCount: value.learnerCount ?? 0, pendingRequestCount: value.pendingRequestCount ?? 0, progressRate: value.progressRate ?? 0 }
}

function mapWeek(value: WeekDto): ClassroomWeek {
  return { ...value, materials: value.materials.map((item) => ({ id: String(item.materialId), pageCount: item.pageCount, status: item.processingStatus, title: item.title, uploadedAt: item.uploadedAt, viewerCount: item.viewerCount, viewRate: item.viewRate })) }
}

function mapNotice(value: NoticeDto): ClassroomNotice {
  return { ...value, classroomId: String(value.classroomId), id: String(value.noticeId) }
}

function mapJoinRequest(value: JoinRequestDto): JoinRequest {
  return {
    ...value,
    classroomId: value.classroomId === undefined ? undefined : String(value.classroomId),
    learner: value.learner ? { ...value.learner, id: String(value.learner.userId) } : undefined,
    requestId: String(value.requestId),
  }
}
