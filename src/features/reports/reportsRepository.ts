import type { PagedResponse } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'

export type ReportGenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type ReportCriterionStatus = 'ASSESSED' | 'INSUFFICIENT_DATA'
export type ReportScope =
  | { type: 'FULL' }
  | { type: 'WEEK'; weekNumber: number }

export interface ReportStudent {
  affiliation?: string
  email: string
  id: string
  name: string
}

export interface ReportEvidence {
  evidenceId: string
  fact: string
  label: string
  occurredAt: string
  sourceType: string
}

export interface ReportCriterionResult {
  criterionKey: string
  criterionName: string
  evidenceIds: string[]
  narrative: string
  score: number | null
  status: ReportCriterionStatus
  trend?: string | null
}

export interface StudentReport {
  classroomId: string
  createdAt?: string
  criterionResults: ReportCriterionResult[]
  evidence: ReportEvidence[]
  failureMessage?: string
  generationId?: string
  improvements: ReportStatement[]
  misconceptionCandidates: ReportStatement[]
  overallScore: number | null
  overview?: string
  pollAfterSeconds?: number
  recommendedActions: ReportStatement[]
  reportId: string
  sourceDataAsOf?: string
  stage?: string | null
  stale?: boolean
  status: ReportGenerationStatus
  strengths: ReportStatement[]
  studentId: string
  studentName?: string
  trend?: string | null
  version?: number
}

export interface ReportStatement {
  content: string
  evidenceIds: string[]
}

export interface ReportCriterion {
  active: boolean
  description: string
  id: string
  key: string
  minimumEvidence: number
  name: string
  rubric: string
  sourceTypes: string[]
  version: number
  weight: number
}

export interface CreateReportInput {
  criterionIds?: string[]
  requestId: string
  scope: ReportScope
}

export interface SaveReportCriterionInput {
  active?: boolean
  description: string
  minimumEvidence: number
  name: string
  rubric: string
  sourceTypes: string[]
  weight: number
}

interface ReportStudentDto {
  affiliation?: string
  email: string
  name: string
  studentId: number | string
}

interface ReportDto extends Omit<Partial<StudentReport>, 'classroomId' | 'reportId' | 'status' | 'studentId'> {
  classroomId?: number | string
  criterionResults?: ReportCriterionResult[]
  evidence?: ReportEvidence[]
  reportId: string
  status: ReportGenerationStatus
  studentId?: number | string
  summary?: {
    improvements?: ReportStatement[]
    misconceptionCandidates?: ReportStatement[]
    overview?: string
    recommendedActions?: ReportStatement[]
    strengths?: ReportStatement[]
  }
}

interface ReportCriterionDto extends Omit<ReportCriterion, 'id'> {
  criterionId: number | string
}

export function createReportsRepository(request: AuthenticatedRequest) {
  return {
    async listStudents(classroomId: string, signal?: AbortSignal) {
      const { data } = await request<PagedResponse<ReportStudentDto>>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/students?page=0&size=100`,
        { signal },
      )
      return data.items.map(mapStudent)
    },
    async createReport(classroomId: string, studentId: string, input: CreateReportInput) {
      const { data } = await request<ReportDto>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/students/${encodeURIComponent(studentId)}/reports`,
        { body: { criterionIds: input.criterionIds, requestId: input.requestId, scope: input.scope }, method: 'POST' },
      )
      return mapReport(data, { classroomId, studentId })
    },
    async listReports(classroomId: string, studentId: string, signal?: AbortSignal) {
      const { data } = await request<PagedResponse<ReportDto>>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/students/${encodeURIComponent(studentId)}/reports?page=0&size=50`,
        { signal },
      )
      return data.items.map((item) => mapReport(item, { classroomId, studentId }))
    },
    async getReport(reportId: string, signal?: AbortSignal) {
      const { data } = await request<ReportDto>(`/api/reports/${encodeURIComponent(reportId)}`, { signal })
      return mapReport(data)
    },
    async listCriteria(classroomId: string, signal?: AbortSignal) {
      const { data } = await request<PagedResponse<ReportCriterionDto>>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/report-criteria?page=0&size=100`,
        { signal },
      )
      return data.items.map(mapCriterion)
    },
    async createCriterion(classroomId: string, input: SaveReportCriterionInput) {
      const { data } = await request<ReportCriterionDto>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/report-criteria`,
        { body: { ...input }, method: 'POST' },
      )
      return mapCriterion(data)
    },
    async updateCriterion(classroomId: string, criterionId: string, input: Partial<SaveReportCriterionInput>) {
      const { data } = await request<ReportCriterionDto>(
        `/api/classrooms/${encodeURIComponent(classroomId)}/report-criteria/${encodeURIComponent(criterionId)}`,
        { body: input, method: 'PATCH' },
      )
      return mapCriterion(data)
    },
  }
}

function mapStudent(value: ReportStudentDto): ReportStudent {
  return { ...value, id: String(value.studentId) }
}

function mapReport(
  value: ReportDto,
  fallback: { classroomId?: string; studentId?: string } = {},
): StudentReport {
  const summary = value.summary
  return {
    ...value,
    classroomId: value.classroomId === undefined ? fallback.classroomId ?? '' : String(value.classroomId),
    criterionResults: value.criterionResults ?? [],
    evidence: value.evidence ?? [],
    improvements: value.improvements ?? summary?.improvements ?? [],
    misconceptionCandidates: value.misconceptionCandidates ?? summary?.misconceptionCandidates ?? [],
    overallScore: value.overallScore ?? null,
    overview: value.overview ?? summary?.overview,
    recommendedActions: value.recommendedActions ?? summary?.recommendedActions ?? [],
    reportId: String(value.reportId),
    strengths: value.strengths ?? summary?.strengths ?? [],
    studentId: value.studentId === undefined ? fallback.studentId ?? '' : String(value.studentId),
  }
}

function mapCriterion(value: ReportCriterionDto): ReportCriterion {
  return { ...value, id: String(value.criterionId) }
}
