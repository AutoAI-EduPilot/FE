export type AsyncState<TData, TError = string> =
  | {
      status: 'idle'
    }
  | {
      status: 'loading'
    }
  | {
      data: TData
      status: 'success'
    }
  | {
      error: TError
      status: 'error'
    }
  | {
      status: 'empty'
    }

export const idleState = <TData, TError = string>(): AsyncState<TData, TError> => ({
  status: 'idle',
})

export const loadingState = <TData, TError = string>(): AsyncState<TData, TError> => ({
  status: 'loading',
})

export const successState = <TData, TError = string>(
  data: TData,
): AsyncState<TData, TError> => ({
  data,
  status: 'success',
})

export const errorState = <TData, TError = string>(
  error: TError,
): AsyncState<TData, TError> => ({
  error,
  status: 'error',
})

export const emptyState = <TData, TError = string>(): AsyncState<TData, TError> => ({
  status: 'empty',
})

export function hasAsyncData<TData, TError>(
  state: AsyncState<TData, TError>,
): state is Extract<AsyncState<TData, TError>, { status: 'success' }> {
  return state.status === 'success'
}
