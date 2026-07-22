interface ApiClientErrorOptions {
  code: string
  message: string
  status?: number | null
  details?: unknown[]
  traceId?: string
  timestamp?: string
  cause?: unknown
}

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number | null
  readonly details: readonly unknown[]
  readonly traceId?: string
  readonly timestamp?: string

  constructor({
    code,
    message,
    status = null,
    details = [],
    traceId,
    timestamp,
    cause,
  }: ApiClientErrorOptions) {
    super(message, { cause })
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = details
    this.traceId = traceId
    this.timestamp = timestamp
  }
}
