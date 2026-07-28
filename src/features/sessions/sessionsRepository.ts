import { ApiClientError, type PagedResponse } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'
import type {
  LearningSession,
  LearningSessionStatus,
  PendingDiagnosisReference,
  SessionMessage,
  SessionQuizSummary,
  SessionTurnResult,
  UiAction,
  UiActionEvent,
} from './sessionTypes'

interface UiActionDto {
  content?: string
  diagnosisId?: number | string
  durationMs?: number
  label?: string
  noEvent?: string
  type: string
  yesEvent?: string
}

interface PendingDiagnosisDto {
  diagnosisId: number | string
  prompt?: string
  quizScore?: number
  sourceQuestion?: string
}

interface SessionSummaryDto {
  currentPage: number
  materialId: number | string
  materialTitle?: string
  sessionId: number | string
  status: LearningSessionStatus
  updatedAt?: string
}

interface SessionDetailDto extends SessionSummaryDto {
  activeQuizId?: number | string | null
  pageStatus?: string
  pendingDiagnosis?: PendingDiagnosisDto | null
  uiActions?: UiActionDto[]
}

interface SessionMessageDto {
  content: string
  createdAt: string
  messageId: number | string
  messageType?: string
  pageNumber?: number
  senderType: 'AI' | 'USER'
}

interface SessionTurnDto {
  messages?: SessionMessageDto[]
  state?: {
    activeQuizId?: number | string | null
    pendingDiagnosis?: PendingDiagnosisDto | null
  }
  uiActions?: UiActionDto[]
}

interface SessionQuizDto {
  quizId: number | string
  quizType: string
  score?: number
  status?: string
  title: string
}

export interface SessionTurnRequest {
  eventType:
    | 'DIAGNOSIS_ANSWER_SUBMITTED'
    | 'EXPLAIN_CURRENT_PAGE'
    | 'QUIZ_TYPE_SELECTED'
    | 'USER_QUESTION'
  payload: Record<string, unknown>
  requestId: string
}

export interface SessionsRepository {
  complete: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<LearningSession>
  create: (
    materialId: string,
    signal?: AbortSignal,
  ) => Promise<LearningSession>
  delete: (sessionId: string, signal?: AbortSignal) => Promise<void>
  getById: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<LearningSession | null>
  list: (signal?: AbortSignal) => Promise<LearningSession[]>
  listMessages: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<SessionMessage[]>
  listQuizzes: (
    sessionId: string,
    signal?: AbortSignal,
  ) => Promise<SessionQuizSummary[]>
  movePage: (
    sessionId: string,
    pageNumber: number,
    signal?: AbortSignal,
  ) => Promise<{ currentPage: number; uiActions: UiAction[] }>
  submitTurn: (
    sessionId: string,
    turn: SessionTurnRequest,
    signal?: AbortSignal,
  ) => Promise<SessionTurnResult>
}

export function createSessionsRepository(
  request: AuthenticatedRequest,
): SessionsRepository {
  return {
    async complete(sessionId, signal) {
      const { data } = await request<SessionDetailDto>(
        `/api/sessions/${encodeURIComponent(sessionId)}/complete`,
        { method: 'POST', signal },
      )
      return mapSession(data)
    },
    async create(materialId, signal) {
      const { data } = await request<SessionDetailDto>('/api/sessions', {
        body: { materialId: toApiId(materialId) },
        method: 'POST',
        signal,
      })
      return mapSession(data)
    },
    async delete(sessionId, signal) {
      await request<unknown>(
        `/api/sessions/${encodeURIComponent(sessionId)}`,
        { method: 'DELETE', signal },
      )
    },
    async getById(sessionId, signal) {
      try {
        const { data } = await request<SessionDetailDto>(
          `/api/sessions/${encodeURIComponent(sessionId)}`,
          { signal },
        )
        return mapSession(data)
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return null
        }
        throw error
      }
    },
    async list(signal) {
      const { data } = await request<PagedResponse<SessionSummaryDto>>(
        '/api/sessions?page=0&size=20',
        { signal },
      )
      return data.items.map(mapSession)
    },
    async listMessages(sessionId, signal) {
      const { data } = await request<PagedResponse<SessionMessageDto>>(
        `/api/sessions/${encodeURIComponent(sessionId)}/messages?page=0&size=50`,
        { signal },
      )
      return data.items.map(mapMessage)
    },
    async listQuizzes(sessionId, signal) {
      const { data } = await request<PagedResponse<SessionQuizDto>>(
        `/api/sessions/${encodeURIComponent(sessionId)}/quizzes?page=0&size=20`,
        { signal },
      )
      return data.items.map((quiz) => ({
        ...quiz,
        quizId: String(quiz.quizId),
      }))
    },
    async movePage(sessionId, pageNumber, signal) {
      const { data } = await request<{
        currentPage: number
        uiActions?: UiActionDto[]
      }>(`/api/sessions/${encodeURIComponent(sessionId)}/page`, {
        body: { pageNumber },
        method: 'PATCH',
        signal,
      })
      return {
        currentPage: data.currentPage,
        uiActions: mapUiActions(data.uiActions),
      }
    },
    async submitTurn(sessionId, turn, signal) {
      const { data } = await request<SessionTurnDto>(
        `/api/sessions/${encodeURIComponent(sessionId)}/turns`,
        {
          body: {
            eventType: turn.eventType,
            payload: turn.payload,
            requestId: turn.requestId,
          },
          method: 'POST',
          signal,
        },
      )
      return {
        activeQuizId: toOptionalString(data.state?.activeQuizId),
        messages: (data.messages ?? []).map(mapMessage),
        pendingDiagnosis: mapPendingDiagnosis(data.state?.pendingDiagnosis),
        uiActions: mapUiActions(data.uiActions),
      }
    },
  }
}

function mapSession(
  session: SessionSummaryDto | SessionDetailDto,
): LearningSession {
  const detail = session as SessionDetailDto
  return {
    activeQuizId: toOptionalString(detail.activeQuizId),
    currentPage: session.currentPage,
    id: String(session.sessionId),
    lastActivityAt: session.updatedAt ?? new Date().toISOString(),
    materialId: String(session.materialId),
    materialTitle: session.materialTitle ?? '학습 자료',
    pageStatus: detail.pageStatus,
    pendingDiagnosis: mapPendingDiagnosis(detail.pendingDiagnosis),
    status: session.status,
    uiActions: mapUiActions(detail.uiActions),
  }
}

function mapMessage(message: SessionMessageDto): SessionMessage {
  return {
    ...message,
    id: String(message.messageId),
  }
}

const UI_ACTION_EVENTS = [
  'COMPLETE_SESSION',
  'EXPLAIN_CURRENT_PAGE',
  'MOVE_NEXT_PAGE',
  'SHOW_QUIZ_TYPE_SELECT',
  'WAIT',
] as const

function toUiActionEvent(value: string | undefined): UiActionEvent | undefined {
  return UI_ACTION_EVENTS.find((event) => event === value)
}

function mapUiActions(actions: UiActionDto[] | undefined): UiAction[] {
  if (!actions) return []

  return actions.flatMap((action): UiAction[] => {
    if (action.type === 'BINARY_DECISION') {
      const yesEvent = toUiActionEvent(action.yesEvent)
      const noEvent = toUiActionEvent(action.noEvent)
      if (!yesEvent || !noEvent) return []
      return [
        {
          kind: 'BINARY_DECISION',
          label: action.content ?? action.label ?? '계속 진행할까요?',
          noEvent,
          yesEvent,
        },
      ]
    }

    if (action.type === 'DIAGNOSIS_QUESTION') {
      if (action.diagnosisId === undefined || action.diagnosisId === null) {
        return []
      }
      return [
        {
          diagnosisId: String(action.diagnosisId),
          kind: 'DIAGNOSIS_QUESTION',
          label: action.content ?? action.label ?? '진단 질문에 답해 주세요.',
        },
      ]
    }

    if (action.type === 'MOVE_NEXT_PAGE') {
      return [
        {
          kind: 'MOVE_NEXT_PAGE',
          label: action.content ?? action.label ?? '다음 페이지로',
          step: 1,
        },
      ]
    }

    if (action.type === 'WAIT') {
      return [
        {
          durationMs: action.durationMs ?? 0,
          kind: 'WAIT',
          label: action.content ?? action.label ?? '현재 페이지에서 계속 학습',
        },
      ]
    }

    return []
  })
}

function mapPendingDiagnosis(
  diagnosis: PendingDiagnosisDto | null | undefined,
): PendingDiagnosisReference | undefined {
  if (!diagnosis) return undefined
  return {
    ...diagnosis,
    diagnosisId: String(diagnosis.diagnosisId),
  }
}

function toOptionalString(
  value: number | string | null | undefined,
): string | undefined {
  return value === null || value === undefined ? undefined : String(value)
}

function toApiId(value: string): number | string {
  const numericValue = Number(value)
  return Number.isSafeInteger(numericValue) ? numericValue : value
}
