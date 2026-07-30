import { createContext, useContext } from 'react'

export type ToastTone = 'danger' | 'info' | 'success'

export interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
