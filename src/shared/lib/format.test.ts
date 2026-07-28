import { describe, expect, it } from 'vitest'

import { formatDate, formatDateTime, formatFileSize } from './format'

describe('format helpers', () => {
  it('formats ISO strings as Korean dates', () => {
    expect(formatDate('2026-07-22T00:00:00Z')).toMatch(/2026/)
    expect(formatDateTime('2026-07-22T09:30:00Z')).toMatch(/2026/)
  })

  it('returns the raw string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('formats file sizes across units', () => {
    expect(formatFileSize(undefined)).toBe('-')
    expect(formatFileSize(512)).toBe('512B')
    expect(formatFileSize(2048)).toBe('2KB')
    expect(formatFileSize(12_480_000)).toBe('11.9MB')
  })
})
