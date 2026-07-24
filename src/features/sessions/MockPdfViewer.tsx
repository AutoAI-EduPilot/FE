import { Button } from '../../shared/ui'

interface MockPdfViewerProps {
  currentPage: number
  onMovePage: (page: number) => void
  onZoomChange: (zoomPercent: number) => void
  totalPages: number
  zoomPercent: number
}

const zoomStep = 10
const minZoom = 80
const maxZoom = 140

export function MockPdfViewer({
  currentPage,
  onMovePage,
  onZoomChange,
  totalPages,
  zoomPercent,
}: MockPdfViewerProps) {
  function updateZoom(nextZoom: number) {
    onZoomChange(Math.min(maxZoom, Math.max(minZoom, nextZoom)))
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">PDF 뷰어</h2>
          <p className="mt-1 text-sm text-zinc-600">
            페이지 {currentPage} / {totalPages} · 확대 {zoomPercent}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={currentPage <= 1}
            onClick={() => onMovePage(currentPage - 1)}
            type="button"
            variant="secondary"
          >
            이전
          </Button>
          <Button
            disabled={currentPage >= totalPages}
            onClick={() => onMovePage(currentPage + 1)}
            type="button"
          >
            다음
          </Button>
          <Button
            aria-label="PDF 축소"
            disabled={zoomPercent <= minZoom}
            onClick={() => updateZoom(zoomPercent - zoomStep)}
            type="button"
            variant="secondary"
          >
            -
          </Button>
          <Button
            aria-label="PDF 확대"
            disabled={zoomPercent >= maxZoom}
            onClick={() => updateZoom(zoomPercent + zoomStep)}
            type="button"
            variant="secondary"
          >
            +
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_88px]">
        <div className="aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-5">
          <div
            className="flex h-full origin-top flex-col rounded-md border border-zinc-200 bg-white p-6 shadow-inner"
            style={{ transform: `scale(${zoomPercent / 100})` }}
          >
            <p className="text-xs font-semibold text-zinc-500">Mock PDF Page</p>
            <h3 className="mt-5 text-2xl font-bold text-zinc-950">Page {currentPage}</h3>
            <div className="mt-5 grid gap-3">
              <div className="h-3 rounded bg-zinc-200" />
              <div className="h-3 w-4/5 rounded bg-zinc-200" />
              <div className="h-3 w-2/3 rounded bg-zinc-200" />
            </div>
          </div>
        </div>

        <nav aria-label="PDF 페이지 썸네일" className="grid content-start gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              aria-label={`${pageNumber}쪽으로 이동`}
              className={[
                'h-12 rounded-md border text-sm font-semibold',
                pageNumber === currentPage
                  ? 'border-teal-600 bg-teal-50 text-teal-800'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
              ].join(' ')}
              key={pageNumber}
              onClick={() => onMovePage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
