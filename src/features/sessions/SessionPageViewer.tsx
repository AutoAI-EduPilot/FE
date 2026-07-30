import {
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  List,
  Minus,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { cx } from '../../shared/lib/cx'

interface SessionPageViewerProps {
  currentPage: number
  isPending?: boolean
  materialTitle?: string
  onAskAboutSelection?: (text: string) => void
  onMovePage: (page: number) => void
  onSaveSelectionNote?: (text: string) => void
  totalPages: number
}

/** 시안의 "드래그한 문장" 자리 — 실제 PDF 텍스트 레이어가 붙기 전까지의 대체 문장. */
const SELECTABLE_SENTENCE = '드래그한 문장'

export function SessionPageViewer({
  currentPage,
  isPending = false,
  materialTitle,
  onAskAboutSelection,
  onMovePage,
  onSaveSelectionNote,
  totalPages,
}: SessionPageViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

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
          {/* TODO(BE): 목차·형광펜·다운로드는 PDF 파일/하이라이트 API 대기.
              docs/be-api-requests.md §0-2, §1-2 */}
          <ToolbarButton icon={List} label="목차" />
          <ToolbarButton icon={Highlighter} label="형광펜" />
          <ToolbarButton icon={Download} label="원본 내려받기" />
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

        <div className="relative flex min-h-0 items-center justify-center bg-stone-100 p-6">
          <div
            className="relative flex aspect-[64/74] max-h-full min-h-0 w-full max-w-md items-center justify-center overflow-hidden rounded-sm bg-white shadow-[0_2px_14px_rgba(0,0,0,0.08)] transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <PageCanvas currentPage={currentPage} />

            {/* 시안의 "드래그한 문장" — 실제 PDF 텍스트 레이어가 붙기 전까지의 선택 대상 */}
            <button
              aria-pressed={isSelectionOpen}
              className={cx(
                'absolute top-[43%] left-1/2 w-[62%] -translate-x-1/2 rounded-sm px-2 py-1 font-mono text-[11px] text-brand-700',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                isSelectionOpen
                  ? 'bg-brand-100 ring-1 ring-brand-600'
                  : 'bg-brand-100/80 hover:bg-brand-100',
              )}
              onClick={() => setIsSelectionOpen((open) => !open)}
              type="button"
            >
              {SELECTABLE_SENTENCE}
            </button>

            {isSelectionOpen ? (
              <div className="absolute top-[33%] left-1/2 z-10 flex h-8.5 -translate-x-1/2 items-center gap-2.5 rounded-[9px] bg-stone-900 px-3 text-[12.5px] whitespace-nowrap text-white shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
                <button
                  className="flex items-center gap-1.5 rounded hover:text-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  onClick={() => {
                    setIsSelectionOpen(false)
                    onAskAboutSelection?.(SELECTABLE_SENTENCE)
                  }}
                  type="button"
                >
                  <Sparkles aria-hidden="true" size={12} />
                  AI에게 질문
                </button>
                <span aria-hidden="true" className="text-stone-500">
                  |
                </span>
                <button
                  className="cursor-not-allowed text-stone-400"
                  disabled
                  title="백엔드 연동 대기 중입니다."
                  type="button"
                >
                  형광펜
                </button>
                <span aria-hidden="true" className="text-stone-500">
                  |
                </span>
                <button
                  className="rounded hover:text-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  onClick={() => {
                    setIsSelectionOpen(false)
                    onSaveSelectionNote?.(SELECTABLE_SENTENCE)
                  }}
                  type="button"
                >
                  노트에 저장
                </button>
              </div>
            ) : null}
          </div>

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

/** 시안의 페이지 캔버스(사선 패턴 + 선택 문장). 실제 PDF가 오면 이 자리를 교체한다. */
function PageCanvas({ currentPage }: { currentPage: number }) {
  return (
    <svg
      className="size-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 640 740"
    >
      <defs>
        <pattern
          height="10"
          id="page-hatch"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
          width="10"
        >
          <rect fill="#ffffff" height="10" width="10" />
          <rect fill="#f2f1ec" height="10" width="5" />
        </pattern>
      </defs>
      <rect fill="url(#page-hatch)" height="740" width="640" />

      <text
        fill="#9b9a95"
        fontFamily="monospace"
        fontSize="14"
        textAnchor="middle"
        x="320"
        y="386"
      >
        pdf page {currentPage}
      </text>
      <text
        fill="#c0bfba"
        fontFamily="monospace"
        fontSize="12"
        textAnchor="middle"
        x="320"
        y="407"
      >
        강의 자료가 여기에 렌더링됩니다
      </text>
    </svg>
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

/** 백엔드 연동 대기 중인 뷰어 도구 — 시안 유지를 위해 노출하되 비활성 상태로 둔다. */
function ToolbarButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      aria-label={`${label} (백엔드 연동 대기)`}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 text-[12.5px] font-medium text-stone-400 disabled:cursor-not-allowed"
      disabled
      title="백엔드 연동 대기 중입니다."
      type="button"
    >
      <Icon aria-hidden="true" size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
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
