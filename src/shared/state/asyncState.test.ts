import { describe, expect, it } from 'vitest'

import {
  emptyState,
  errorState,
  hasAsyncData,
  idleState,
  loadingState,
  successState,
} from './asyncState'

describe('AsyncState helpers', () => {
  it('creates stable async state variants', () => {
    expect(idleState()).toEqual({ status: 'idle' })
    expect(loadingState()).toEqual({ status: 'loading' })
    expect(emptyState()).toEqual({ status: 'empty' })
    expect(errorState('Failed')).toEqual({ error: 'Failed', status: 'error' })
    expect(successState(['ready'])).toEqual({ data: ['ready'], status: 'success' })
  })

  it('narrows success states with data', () => {
    const state = successState({ id: 'material-ready' })

    expect(hasAsyncData(state)).toBe(true)
    expect(hasAsyncData(errorState('Missing'))).toBe(false)
  })
})
