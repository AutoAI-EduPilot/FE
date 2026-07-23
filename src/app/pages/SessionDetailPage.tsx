import { useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  applyUiActionToPage,
  findMockSession,
  mockUiActions,
  movePage,
  UiActionsRenderer,
  type UiAction,
} from '../../features/sessions'
import { Badge, Button, ButtonLink, ErrorState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function SessionDetailPage() {
  const { sessionId } = useParams()
  const session = findMockSession(sessionId)
  const [currentPage, setCurrentPage] = useState(session?.currentPage ?? 1)

  if (!session) {
    return (
      <ErrorState
        title="세션을 찾을 수 없습니다."
        description="세션 목록에서 다시 선택하세요."
        action={<ButtonLink to={routes.sessions}>세션 목록으로</ButtonLink>}
      />
    )
  }

  const activeSession = session

  function handlePageMove(nextPage: number) {
    setCurrentPage(() => movePage(nextPage, activeSession.totalPages))
  }

  function handleUiAction(action: Extract<UiAction, { kind: 'MOVE_NEXT_PAGE' }>) {
    setCurrentPage((page) => applyUiActionToPage(action, page, activeSession.totalPages))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning Session"
        title="학습 공간"
        description={`${activeSession.materialTitle} 학습 화면입니다.`}
        actions={<Badge tone="info">BE#20 · BE#28</Badge>}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">PDF 뷰어</h2>
              <p className="mt-1 text-sm text-zinc-600">
                페이지 {currentPage} / {activeSession.totalPages}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={currentPage <= 1}
                onClick={() => handlePageMove(currentPage - 1)}
                type="button"
                variant="secondary"
              >
                이전
              </Button>
              <Button
                disabled={currentPage >= activeSession.totalPages}
                onClick={() => handlePageMove(currentPage + 1)}
                type="button"
              >
                다음
              </Button>
            </div>
          </div>

          <div className="mt-5 aspect-[3/4] rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex h-full flex-col rounded-md border border-zinc-200 bg-white p-6 shadow-inner">
              <p className="text-xs font-semibold text-zinc-500">Mock PDF Page</p>
              <h3 className="mt-5 text-2xl font-bold text-zinc-950">Page {currentPage}</h3>
              <div className="mt-5 grid gap-3">
                <div className="h-3 rounded bg-zinc-200" />
                <div className="h-3 w-4/5 rounded bg-zinc-200" />
                <div className="h-3 w-2/3 rounded bg-zinc-200" />
              </div>
              <div className="mt-auto grid grid-cols-5 gap-2">
                {Array.from({ length: activeSession.totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      aria-label={`${pageNumber}쪽으로 이동`}
                      className={[
                        'h-9 rounded-md border text-sm font-semibold',
                        pageNumber === currentPage
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
                      ].join(' ')}
                      key={pageNumber}
                      onClick={() => handlePageMove(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950">학습 안내</h2>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">현재 페이지 핵심 질문</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              이 페이지에서 가장 중요한 개념을 한 문장으로 정리해 보세요.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-bold text-zinc-950">UI Actions</h3>
            <div className="mt-3">
              <UiActionsRenderer actions={mockUiActions} onMoveNextPage={handleUiAction} />
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
