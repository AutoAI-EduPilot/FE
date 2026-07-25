import type { UiAction } from './sessionTypes'

interface UiActionsRendererProps {
  actions: UiAction[]
  onMoveNextPage: (action: Extract<UiAction, { kind: 'MOVE_NEXT_PAGE' }>) => void
}

export function UiActionsRenderer({ actions, onMoveNextPage }: UiActionsRendererProps) {
  return (
    <div className="grid gap-3">
      {actions.map((action) => {
        if (action.kind === 'MOVE_NEXT_PAGE') {
          return (
            <button
              className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-left text-sm font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              key={`${action.kind}-${action.label}`}
              onClick={() => onMoveNextPage(action)}
              type="button"
            >
              {action.label}
            </button>
          )
        }

        return (
          <div
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
            key={`${action.kind}-${action.label}`}
            role="status"
          >
            {action.label} · 로컬 대기 {action.durationMs / 1000}초
          </div>
        )
      })}
    </div>
  )
}
