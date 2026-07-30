import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServiceHealth } from './healthRepository'

describe('getServiceHealth', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('combines health and degraded readiness responses', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: { status: 'UP' },
          message: '정상',
          success: true,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            checks: { aiService: 'DOWN', db: 'UP' },
            status: 'DEGRADED',
          },
          200,
        ),
      )

    await expect(getServiceHealth()).resolves.toEqual({
      checks: { aiService: 'DOWN', db: 'UP', main: 'UP' },
      status: 'DEGRADED',
    })
  })

  it('parses a 503 readiness response as DOWN', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: { status: 'UP' },
          message: '정상',
          success: true,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            checks: { aiService: 'DOWN', db: 'DOWN' },
            status: 'DOWN',
          },
          503,
        ),
      )

    await expect(getServiceHealth()).resolves.toHaveProperty('status', 'DOWN')
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}
