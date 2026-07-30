import {
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  List,
  Minus,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { cx } from '../../shared/lib/cx'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface SessionPageViewerProps {
  currentPage: number
  file?: Blob | null
  fileError?: string | null
  isPending?: boolean
  materialTitle?: string
  onMovePage: (page: number) => void
  totalPages: number
}

export function SessionPageViewer({
  currentPage,
  file,
  fileError,
  isPending = false,
  materialTitle,
  onMovePage,
  totalPages,
}: SessionPageViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [pageWidth, setPageWidth] = useState(560)
  const pageContainerRef = useRef<HTMLDivElement | null>(null)
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  useEffect(() => {
    const container = pageContainerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const updatePageWidth = () => {
      setPageWidth(Math.max(240, Math.min(720, container.clientWidth - 48)))
    }
    updatePageWidth()
    const observer = new ResizeObserver(updatePageWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  function downloadOriginal() {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = getDownloadFileName(materialTitle)
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-stone-200 px-4">
        <h2 className="min-w-0 truncate text-[14.5px] font-semibold text-stone-950">
          {materialTitle ?? '학습 자료'}
        </h2>
        <span className="shrink-0 text-xs text-stone-400">
          {currentPage} / {totalPages}쪽
        </span>
        <div
          aria-label={`학습 진행률 ${currentPage} / ${totalPages}쪽`}
          className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-stone-200"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-1.5">
            <ToolbarIconButton
              icon={Minus}
              label="축소"
              onClick={() => setZoom((value) => Math.max(50, value - 10))}
            />
            <span className="min-w-10 text-center text-[12.5px] font-medium text-stone-600">
              {zoom}%
            </span>
            <ToolbarIconButton
              icon={Plus}
              label="확대"
              onClick={() => setZoom((value) => Math.min(200, value + 10))}
            />
          </div>
          <ToolbarButton disabled icon={List} label="목차" />
          <ToolbarButton disabled icon={Highlighter} label="형광펜" />
          <ToolbarButton
            disabled={!file}
            icon={Download}
            label="원본 내려받기"
            onClick={downloadOriginal}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[56px_minmax(0,1fr)] sm:grid-cols-[68px_minmax(0,1fr)]">
        <nav
          aria-label="자료 페이지"
          className="grid content-start gap-1.5 overflow-y-auto border-r border-stone-200 bg-stone-50 p-2"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                aria-label={`${pageNumber}쪽으로 이동`}
                className={cx(
                  'aspect-[3/4] w-full rounded-md border text-[11px] font-semibold transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  pageNumber === currentPage
                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                    : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300 hover:text-stone-600',
                )}
                disabled={isPending}
                key={pageNumber}
                onClick={() => onMovePage(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ),
          )}
        </nav>

        <div
          className="relative flex min-h-0 items-start justify-center overflow-auto bg-stone-100 p-6 pb-16"
          ref={pageContainerRef}
        >
          {file === undefined ? (
            <ViewerState message="PDF 원본을 불러오는 중입니다." />
          ) : file === null ? (
            <ViewerState
              isError
              message={fileError ?? 'PDF 원본을 표시할 수 없습니다.'}
            />
          ) : (
            <Document
              error={<ViewerState isError message="PDF 문서를 열지 못했습니다." />}
              file={file}
              loading={<ViewerState message="PDF 문서를 준비하는 중입니다." />}
            >
              <Page
                className="overflow-hidden rounded-sm bg-white shadow-[0_2px_14px_rgba(0,0,0,0.08)]"
                pageNumber={currentPage}
                renderAnnotationLayer
                renderTextLayer
                width={pageWidth * (zoom / 100)}
              />
            </Document>
          )}

          <div className="absolute bottom-4 left-1/2 flex h-9 -translate-x-1/2 items-center gap-2.5 rounded-[10px] border border-stone-200 bg-white px-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <PageStepButton
              disabled={isPending || currentPage <= 1}
              label="이전"
              onClick={() => onMovePage(currentPage - 1)}
            />
            <span className="min-w-14 text-center text-xs font-semibold text-stone-900">
              {currentPage} / {totalPages}
            </span>
            <PageStepButton
              disabled={isPending || currentPage >= totalPages}
              label="다음"
              onClick={() => onMovePage(currentPage + 1)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ViewerState({
  isError = false,
  message,
}: {
  isError?: boolean
  message: string
}) {
  return (
    <div
      className={cx(
        'flex min-h-80 w-full max-w-md items-center justify-center rounded-sm border bg-white px-6 text-center text-sm shadow-sm',
        isError
          ? 'border-rose-200 text-rose-700'
          : 'border-stone-200 text-stone-500',
      )}
      role={isError ? 'alert' : 'status'}
    >
      {message}
    </div>
  )
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="flex size-5.5 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={13} />
    </button>
  )
}

function ToolbarButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label={disabled ? `${label} (사용 불가)` : label}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-[12.5px] font-medium text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400 disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function getDownloadFileName(materialTitle: string | undefined): string {
  const title = materialTitle?.trim() || 'material.pdf'
  return title.toLowerCase().endsWith('.pdf') ? title : `${title}.pdf`
}

function PageStepButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean
  label: '다음' | '이전'
  onClick: () => void
}) {
  const Icon = label === '이전' ? ChevronLeft : ChevronRight

  return (
    <button
      aria-label={label}
      className="flex size-6 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={15} />
    </button>
  )
}
