import { useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  applyUiActionToPage,
  findMockSession,
  MockPdfViewer,
  mockUiActions,
  movePage,
  restoreLastPage,
  saveLastPage,
  UiActionsRenderer,
  type UiAction,
} from '../../features/sessions'
import { Badge, ButtonLink, ErrorState, PageHeader } from '../../shared/ui'
import { routes } from '../routes'

export function SessionDetailPage() {
  const { sessionId } = useParams()
  const session = findMockSession(sessionId)
  const [currentPage, setCurrentPage] = useState(session ? restoreLastPage(session) : 1)
  const [zoomPercent, setZoomPercent] = useState(100)

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
    const nextSafePage = movePage(nextPage, activeSession.totalPages)
    saveLastPage(activeSession.id, nextSafePage)
    setCurrentPage(nextSafePage)
  }

  function handleUiAction(action: Extract<UiAction, { kind: 'MOVE_NEXT_PAGE' }>) {
    setCurrentPage((page) => {
      const nextSafePage = applyUiActionToPage(action, page, activeSession.totalPages)
      saveLastPage(activeSession.id, nextSafePage)
      return nextSafePage
    })
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
        <MockPdfViewer
          currentPage={currentPage}
          onMovePage={handlePageMove}
          onZoomChange={setZoomPercent}
          totalPages={activeSession.totalPages}
          zoomPercent={zoomPercent}
        />

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
