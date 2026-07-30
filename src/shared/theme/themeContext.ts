import { createContext, useContext } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => undefined,
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
