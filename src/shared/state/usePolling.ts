import { useEffect } from 'react'

export function usePolling(
  enabled: boolean,
  onTick: () => void,
  intervalMs = 5000,
) {
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') onTick()
    }, intervalMs)
    return () => clearInterval(id)
  }, [enabled, intervalMs, onTick])
}
