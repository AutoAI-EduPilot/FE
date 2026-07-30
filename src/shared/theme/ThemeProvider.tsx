import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { ThemeContext, type ThemeMode } from './themeContext'

const THEME_STORAGE_KEY = 'edupilot.theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setStoredMode] = useState<ThemeMode>(readThemeMode)

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
    const apply = () => applyTheme(mode, mediaQuery.matches)

    apply()
    if (mode === 'system') mediaQuery.addEventListener('change', apply)

    return () => {
      mediaQuery.removeEventListener('change', apply)
      document.documentElement.classList.remove('dark')
      document.documentElement.removeAttribute('data-theme')
    }
  }, [mode])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setStoredMode(nextMode)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode)
  }, [])

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function readThemeMode(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'light' || stored === 'system'
    ? stored
    : 'light'
}

function applyTheme(mode: ThemeMode, systemPrefersDark: boolean) {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
}
