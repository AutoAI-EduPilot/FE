import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cx } from '../../shared/lib/cx'
import {
  getServiceHealth,
  type ServiceHealth,
  type ServiceStatus,
} from './healthRepository'

export function ServiceStatusIndicator() {
  const [health, setHealth] = useState<ServiceHealth | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    await Promise.resolve()
    if (signal?.aborted) return

    setIsChecking(true)
    try {
      setHealth(await getServiceHealth(signal))
    } catch {
      if (!signal?.aborted) {
        setHealth({
          checks: { aiService: 'DOWN', db: 'DOWN', main: 'DOWN' },
          status: 'DOWN',
        })
      }
    } finally {
      if (!signal?.aborted) setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const initialCheckId = window.setTimeout(
      () => void refresh(controller.signal),
      0,
    )
    const intervalId = window.setInterval(() => void refresh(), 60_000)
    return () => {
      controller.abort()
      window.clearTimeout(initialCheckId)
      window.clearInterval(intervalId)
    }
  }, [refresh])

  const status = health?.status ?? 'DOWN'
  const label = isChecking && !health ? '확인 중' : statusLabels[status]
  const detail = health
    ? `Main ${health.checks.main} · DB ${health.checks.db} · AI ${health.checks.aiService}`
    : '서비스 상태를 확인하는 중입니다.'

  return (
    <button
      aria-label={`서비스 상태: ${label}`}
      className={cx(
        'flex h-8 items-center justify-center gap-2 rounded-lg px-2 type-caption text-stone-500 hover:bg-stone-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
      onClick={() => void refresh()}
      title={`${label} · ${detail}`}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-2 shrink-0 rounded-full',
          isChecking ? 'animate-pulse bg-stone-400' : statusDotClasses[status],
        )}
      />
      <span>서비스 {label}</span>
      <RefreshCw
        aria-hidden="true"
        className={cx(
          'shrink-0 text-stone-400',
          isChecking && 'animate-spin',
        )}
        size={12}
      />
    </button>
  )
}

const statusLabels: Record<ServiceStatus, string> = {
  DEGRADED: '일부 지연',
  DOWN: '점검 필요',
  UP: '정상',
}

const statusDotClasses: Record<ServiceStatus, string> = {
  DEGRADED: 'bg-amber-500',
  DOWN: 'bg-rose-600',
  UP: 'bg-emerald-600',
}
