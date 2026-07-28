import { ChevronLeft, ChevronRight, FileWarning } from 'lucide-react'

import { Button } from '../../shared/ui'

interface SessionPageViewerProps {
  currentPage: number
  onMovePage: (page: number) => void
  totalPages: number
}

export function SessionPageViewer({
  currentPage,
  onMovePage,
  totalPages,
}: SessionPageViewerProps) {
  return (
    <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-stone-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-950">페이지 탐색</h2>
          <p className="mt-1 text-xs text-stone-500">
            페이지 {currentPage} / {totalPages}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            disabled={currentPage <= 1}
            onClick={() => onMovePage(currentPage - 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" size={15} />
            이전
          </Button>
          <Button
            disabled={currentPage >= totalPages}
            onClick={() => onMovePage(currentPage + 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            다음
            <ChevronRight aria-hidden="true" size={15} />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[80px_minmax(0,1fr)]">
        <nav
          aria-label="자료 페이지"
          className="grid content-start gap-2 overflow-y-auto border-r border-stone-200 bg-stone-50 p-2"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                aria-label={`${pageNumber}쪽으로 이동`}
                className={[
                  'aspect-[3/4] w-full rounded border text-xs font-semibold',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                  pageNumber === currentPage
                    ? 'border-brand-700 bg-brand-50 text-brand-800'
                    : 'border-stone-300 bg-white text-stone-500 hover:border-stone-400',
                ].join(' ')}
                key={pageNumber}
                onClick={() => onMovePage(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ),
          )}
        </nav>

        <div className="flex min-h-0 items-center justify-center bg-stone-100 p-6">
          <div className="max-w-sm text-center">
            <FileWarning
              aria-hidden="true"
              className="mx-auto text-stone-400"
              size={28}
            />
            <h3 className="mt-3 text-sm font-bold text-stone-900">
              원본 PDF를 표시할 수 없습니다.
            </h3>
            <p className="mt-2 text-sm text-stone-500">{currentPage}쪽</p>
          </div>
        </div>
      </div>
    </section>
  )
}
