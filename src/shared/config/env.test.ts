import { describe, expect, it } from 'vitest'

import { normalizeApiBaseUrl } from './env'

describe('normalizeApiBaseUrl', () => {
  it('requires the environment value', () => {
    expect(() => normalizeApiBaseUrl(undefined)).toThrow('VITE_API_BASE_URL')
  })

  it('rejects an invalid URL', () => {
    expect(() => normalizeApiBaseUrl('localhost:8080')).toThrow('절대 URL')
  })

  it('rejects unsupported protocols', () => {
    expect(() => normalizeApiBaseUrl('ftp://localhost:8080')).toThrow(
      'http 또는 https',
    )
  })

  it('removes trailing slashes', () => {
    expect(normalizeApiBaseUrl('http://localhost:8080///')).toBe(
      'http://localhost:8080',
    )
  })
})
