import type { PagedResponse } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type ExamQuestionType = 'MCQ' | 'OX' | 'SHORT' | 'ESSAY'
export type ExamSubmissionStatus = 'SUBMITTED' | 'GRADED' | 'GRADING_FAILED'

export interface ExamOption {
  id: string
  text: string
}

export interface ExamQuestionInput {
  answerChoiceId?: string
  answerValue?: boolean
  explanation?: string
  modelAnswer?: string
  options?: ExamOption[]
  points: number
  questionText: string
  questionType: ExamQuestionType
  referenceAnswer?: string
  rubric?: Array<{ criterion: string; weight: number }>
}

export interface ExamQuestion extends ExamQuestionInput {
  id: string
  maxScore: number
}

export interface Exam {
  allowRetake: boolean
  classroomId: string
  closedAt?: string
  createdAt?: string
  description?: string
  id: string
  mySubmission?: Pick<ExamSubmission, 'attemptNo' | 'normalizedScore' | 'status' | 'submittedAt'>
  publishedAt?: string
  questionCount: number
  questions: ExamQuestion[]
  status: ExamStatus
  submissionCount?: number
  submittable?: boolean
  title: string
  totalScore: number
  updatedAt?: string
  weekNumber?: number
}

export interface CreateExamInput {
  allowRetake: boolean
  description?: string
  questions: ExamQuestionInput[]
  title: string
  weekNumber?: number
}

export interface ExamSubmission {
  attemptNo: number
  gradedAt?: string
  id: string
  items: Array<{
    answer?: string
    feedback?: string
    maxScore: number
    questionId: string
    score?: number
    verdict?: 'CORRECT' | 'PARTIAL' | 'WRONG'
  }>
  maxScore?: number
  normalizedScore?: number
  score?: number
  status: ExamSubmissionStatus
  submittedAt: string
}

export interface InstructorSubmissionSummary {
  attemptCount: number
  attemptNo: number
  gradedAt?: string
  id: string
  maxScore?: number
  normalizedScore?: number
  score?: number
  status: ExamSubmissionStatus
  submittedAt: string
  userId: string
  userName: string
}

export interface ExamsRepository {
  close: (examId: string, signal?: AbortSignal) => Promise<Exam>
  create: (classroomId: string, input: CreateExamInput, signal?: AbortSignal) => Promise<Exam>
  delete: (examId: string, signal?: AbortSignal) => Promise<void>
  get: (examId: string, signal?: AbortSignal) => Promise<Exam>
  getMySubmission: (examId: string, attemptNo?: number, signal?: AbortSignal) => Promise<ExamSubmission>
  getSubmission: (examId: string, submissionId: string, signal?: AbortSignal) => Promise<ExamSubmission>
  list: (classroomId: string, status?: ExamStatus, signal?: AbortSignal) => Promise<Exam[]>
  listSubmissions: (examId: string, signal?: AbortSignal) => Promise<InstructorSubmissionSummary[]>
  publish: (examId: string, signal?: AbortSignal) => Promise<Exam>
  submit: (examId: string, answers: Record<string, string>, requestId: string, signal?: AbortSignal) => Promise<ExamSubmission>
  update: (examId: string, input: Partial<CreateExamInput>, signal?: AbortSignal) => Promise<Exam>
}

interface ExamOptionDto { optionId: string; text: string }
interface ExamQuestionDto {
  answerChoiceId?: string
  answerValue?: boolean
  explanation?: string
  maxScore: number
  modelAnswer?: string
  options?: ExamOptionDto[]
  questionId: string
  questionText: string
  questionType: ExamQuestionType
  referenceAnswer?: string
  rubric?: Array<{ criterion: string; weight: number }>
}
interface ExamDto {
  allowRetake?: boolean
  classroomId: number | string
  closedAt?: string | null
  createdAt?: string
  description?: string | null
  examId: number | string
  mySubmission?: ExamSubmissionDto | null
  publishedAt?: string | null
  questionCount?: number
  questions?: ExamQuestionDto[]
  status: ExamStatus
  submissionCount?: number
  submittable?: boolean
  title: string
  totalScore?: number
  updatedAt?: string
  weekNumber?: number | null
}
interface ExamSubmissionDto {
  attemptNo: number
  gradedAt?: string | null
  items?: Array<{ answer?: string | null; feedback?: string | null; maxScore: number; questionId: string; score?: number | null; verdict?: 'CORRECT' | 'PARTIAL' | 'WRONG' | null }>
  maxScore?: number | null
  normalizedScore?: number | null
  score?: number | null
  status: ExamSubmissionStatus
  submissionId: number | string
  submittedAt: string
}
interface SubmissionSummaryDto {
  attemptCount: number
  attemptNo: number
  gradedAt?: string | null
  maxScore?: number | null
  normalizedScore?: number | null
  score?: number | null
  status: ExamSubmissionStatus
  submissionId: number | string
  submittedAt: string
  userId: number | string
  userName: string
}

export function createExamsRepository(request: AuthenticatedRequest): ExamsRepository {
  return {
    async close(examId, signal) {
      const { data } = await request<ExamDto>(`/api/exams/${encodeURIComponent(examId)}/close`, { method: 'POST', signal })
      return mapExam(data)
    },
    async create(classroomId, input, signal) {
      const { data } = await request<ExamDto>(`/api/classrooms/${encodeURIComponent(classroomId)}/exams`, {
        body: mapExamInput(input), method: 'POST', signal,
      })
      return mapExam(data)
    },
    async delete(examId, signal) {
      await request(`/api/exams/${encodeURIComponent(examId)}`, { method: 'DELETE', signal })
    },
    async get(examId, signal) {
      const { data } = await request<ExamDto>(`/api/exams/${encodeURIComponent(examId)}`, { signal })
      return mapExam(data)
    },
    async getMySubmission(examId, attemptNo, signal) {
      const params = attemptNo ? `?attemptNo=${attemptNo}` : ''
      const { data } = await request<ExamSubmissionDto>(`/api/exams/${encodeURIComponent(examId)}/submissions/me${params}`, { signal })
      return mapSubmission(data)
    },
    async getSubmission(examId, submissionId, signal) {
      const { data } = await request<ExamSubmissionDto>(`/api/exams/${encodeURIComponent(examId)}/submissions/${encodeURIComponent(submissionId)}`, { signal })
      return mapSubmission(data)
    },
    async list(classroomId, status, signal) {
      const params = new URLSearchParams({ page: '0', size: '100' })
      if (status) params.set('status', status)
      const { data } = await request<PagedResponse<ExamDto>>(`/api/classrooms/${encodeURIComponent(classroomId)}/exams?${params}`, { signal })
      return data.items.map(mapExam)
    },
    async listSubmissions(examId, signal) {
      const { data } = await request<PagedResponse<SubmissionSummaryDto>>(`/api/exams/${encodeURIComponent(examId)}/submissions?page=0&size=100`, { signal })
      return data.items.map(mapSubmissionSummary)
    },
    async publish(examId, signal) {
      const { data } = await request<ExamDto>(`/api/exams/${encodeURIComponent(examId)}/publish`, { method: 'POST', signal })
      return mapExam(data)
    },
    async submit(examId, answers, requestId, signal) {
      const { data } = await request<ExamSubmissionDto>(`/api/exams/${encodeURIComponent(examId)}/submissions`, {
        body: { answers: Object.entries(answers).map(([questionId, answer]) => ({ answer, questionId })), requestId },
        method: 'POST', signal,
      })
      return mapSubmission(data)
    },
    async update(examId, input, signal) {
      const body: Record<string, unknown> = {}
      for (const key of ['title', 'description', 'weekNumber', 'allowRetake', 'questions'] as const) {
        if (input[key] !== undefined) {
          body[`${key}Present`] = true
          body[key] = key === 'questions' ? input.questions?.map(mapQuestionInput) : input[key]
        }
      }
      const { data } = await request<ExamDto>(`/api/exams/${encodeURIComponent(examId)}`, { body, method: 'PATCH', signal })
      return mapExam(data)
    },
  }
}

function mapExamInput(input: CreateExamInput) {
  return { ...input, description: input.description || undefined, questions: input.questions.map(mapQuestionInput), weekNumber: input.weekNumber || undefined }
}

function mapQuestionInput(question: ExamQuestionInput) {
  return { ...question, options: question.options?.map((option) => ({ optionId: option.id, text: option.text })) }
}

function mapExam(value: ExamDto): Exam {
  const questions = (value.questions ?? []).map((question) => ({
    ...question,
    id: String(question.questionId),
    options: question.options?.map((option) => ({ id: option.optionId, text: option.text })),
    points: question.maxScore,
  }))
  return {
    ...value,
    allowRetake: value.allowRetake ?? false,
    classroomId: String(value.classroomId),
    closedAt: value.closedAt ?? undefined,
    description: value.description ?? undefined,
    id: String(value.examId),
    mySubmission: value.mySubmission ? mapSubmission(value.mySubmission) : undefined,
    publishedAt: value.publishedAt ?? undefined,
    questionCount: value.questionCount ?? questions.length,
    questions,
    totalScore: value.totalScore ?? questions.reduce((sum, question) => sum + question.maxScore, 0),
    weekNumber: value.weekNumber ?? undefined,
  }
}

function mapSubmission(value: ExamSubmissionDto): ExamSubmission {
  return {
    attemptNo: value.attemptNo,
    gradedAt: value.gradedAt ?? undefined,
    id: String(value.submissionId),
    items: (value.items ?? []).map((item) => ({ ...item, answer: item.answer ?? undefined, feedback: item.feedback ?? undefined, score: item.score ?? undefined, verdict: item.verdict ?? undefined })),
    maxScore: value.maxScore ?? undefined,
    normalizedScore: value.normalizedScore ?? undefined,
    score: value.score ?? undefined,
    status: value.status,
    submittedAt: value.submittedAt,
  }
}

function mapSubmissionSummary(value: SubmissionSummaryDto): InstructorSubmissionSummary {
  return {
    attemptCount: value.attemptCount,
    attemptNo: value.attemptNo,
    gradedAt: value.gradedAt ?? undefined,
    id: String(value.submissionId),
    maxScore: value.maxScore ?? undefined,
    normalizedScore: value.normalizedScore ?? undefined,
    score: value.score ?? undefined,
    status: value.status,
    submittedAt: value.submittedAt,
    userId: String(value.userId),
    userName: value.userName,
  }
}
