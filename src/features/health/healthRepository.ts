import {
  apiRequest,
  ApiClientError,
  rawApiRequest,
} from '../../shared/api'

export type ServiceStatus = 'DEGRADED' | 'DOWN' | 'UP'
export type ServiceCheckStatus = 'DOWN' | 'UP'

export interface ServiceHealth {
  checks: {
    aiService: ServiceCheckStatus
    db: ServiceCheckStatus
    main: ServiceCheckStatus
  }
  status: ServiceStatus
}

interface ReadinessDto {
  checks: {
    aiService: ServiceCheckStatus
    db: ServiceCheckStatus
  }
  status: ServiceStatus
}

export async function getServiceHealth(
  signal?: AbortSignal,
): Promise<ServiceHealth> {
  const healthPromise = apiRequest<{ status: ServiceCheckStatus }>(
    '/api/health',
    { signal },
  )
  const readinessPromise = rawApiRequest('/api/health/ready', {
    acceptStatuses: [503],
    headers: { Accept: 'application/json' },
    signal,
  })

  const [health, readinessResponse] = await Promise.all([
    healthPromise,
    readinessPromise,
  ])
  const readiness = await parseReadiness(readinessResponse)

  return {
    checks: {
      aiService: readiness.checks.aiService,
      db: readiness.checks.db,
      main: health.data.status,
    },
    status: readiness.status,
  }
}

async function parseReadiness(response: Response): Promise<ReadinessDto> {
  const payload = (await response.json()) as unknown
  if (!isReadinessDto(payload)) {
    throw new ApiClientError({
      code: 'INVALID_READINESS_RESPONSE',
      message: '서비스 준비 상태 응답이 올바르지 않습니다.',
      status: response.status,
    })
  }
  return payload
}

function isReadinessDto(value: unknown): value is ReadinessDto {
  if (typeof value !== 'object' || value === null) return false
  const dto = value as Partial<ReadinessDto>
  return (
    isServiceStatus(dto.status) &&
    typeof dto.checks === 'object' &&
    dto.checks !== null &&
    isCheckStatus(dto.checks.db) &&
    isCheckStatus(dto.checks.aiService)
  )
}

function isServiceStatus(value: unknown): value is ServiceStatus {
  return value === 'UP' || value === 'DEGRADED' || value === 'DOWN'
}

function isCheckStatus(value: unknown): value is ServiceCheckStatus {
  return value === 'UP' || value === 'DOWN'
}
