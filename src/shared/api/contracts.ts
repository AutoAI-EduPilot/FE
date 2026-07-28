export interface ApiSuccess<T> {
  success: true
  data: T
  message: string
}

export interface ApiErrorPayload {
  code: string
  message: string
  details: unknown[]
}

export interface ApiFailure {
  success: false
  error: ApiErrorPayload
  traceId?: string
  timestamp?: string
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

export interface PagedResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  if (!isRecord(value) || value.success !== true) {
    return false
  }

  return 'data' in value && typeof value.message === 'string'
}

export function isApiFailure(value: unknown): value is ApiFailure {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) {
    return false
  }

  return (
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string' &&
    Array.isArray(value.error.details) &&
    (value.traceId === undefined || typeof value.traceId === 'string') &&
    (value.timestamp === undefined || typeof value.timestamp === 'string')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
