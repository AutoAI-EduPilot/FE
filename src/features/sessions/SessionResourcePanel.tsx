import { ChevronDown, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { StudyMaterial } from '../materials'
import { cx } from '../../shared/lib/cx'
import type { SessionQuizSummary } from './sessionTypes'

interface SessionResourcePanelProps {
  activeMaterialId?: string
  backLabel: string
  backTo: string
  materials: StudyMaterial[]
  progressLabel?: string
  quizDetailPath: (quizId: string) => string
  quizHistory: SessionQuizSummary[]
  resourcePath: (material: StudyMaterial) => string
}

export function SessionResourcePanel({
  activeMaterialId,
  backLabel,
  backTo,
  materials,
  progressLabel,
  quizDetailPath,
  quizHistory,
  resourcePath,
}: SessionResourcePanelProps) {
  const readyMaterials = materials.filter(
    (material) => material.status === 'READY',
  )
  const otherMaterials = materials.filter(
    (material) => material.status !== 'READY',
  )

  return (
    <aside className="hidden h-full min-h-0 w-[240px] shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-stone-50/60 p-3 xl:flex">
      <Link
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 type-control text-stone-500 hover:bg-white hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        to={backTo}
      >
        <ChevronLeft aria-hidden="true" size={14} />
        <span className="truncate">{backLabel}</span>
      </Link>

      <p className="px-2 pt-3.5 pb-1.5 type-caption font-semibold tracking-[0.04em] text-stone-400">
        내 자료
      </p>
      <ul className="grid gap-0.5">
        {readyMaterials.map((material) => (
          <li key={material.id}>
            <ResourceRow
              isActive={material.id === activeMaterialId}
              progressLabel={
                material.id === activeMaterialId ? progressLabel : undefined
              }
              to={resourcePath(material)}
              title={material.title}
            />
          </li>
        ))}
        {readyMaterials.length === 0 ? (
          <li className="px-2 py-1.5 type-caption text-stone-400">
            준비된 자료가 없습니다.
          </li>
        ) : null}
      </ul>

      {otherMaterials.length > 0 ? (
        <>
          <p className="px-2 pt-3.5 pb-1.5 type-caption font-semibold tracking-[0.04em] text-stone-400">
            처리 중 · 실패
          </p>
          <ul className="grid gap-0.5">
            {otherMaterials.map((material) => (
              <li key={material.id}>
                <ResourceRow
                  isMuted
                  to={resourcePath(material)}
                  title={material.title}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {quizHistory.length > 0 ? (
        <>
          <p className="px-2 pt-3.5 pb-1.5 type-caption font-semibold tracking-[0.04em] text-stone-400">
            퀴즈 기록
          </p>
          <ul className="grid gap-0.5">
            {quizHistory.map((quiz) => (
              <li key={quiz.quizId}>
                <Link
                  className="flex min-h-9 items-center gap-2 rounded-lg px-2 type-caption text-stone-600 hover:bg-white hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  to={quizDetailPath(quiz.quizId)}
                >
                  <span className="min-w-0 flex-1 truncate">{quiz.title}</span>
                  <span className="shrink-0 type-micro text-stone-400">
                    {getQuizKindLabel(quiz.quizType)}
                  </span>
                  {quiz.score !== undefined ? (
                    <span className="shrink-0 font-semibold text-brand-700">
                      {quiz.score}점
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-auto flex items-center gap-1 px-2 pt-4 type-caption text-stone-400">
        자료 {materials.length}개
        <ChevronDown aria-hidden="true" size={13} />
      </p>
    </aside>
  )
}

function ResourceRow({
  isActive = false,
  isMuted = false,
  progressLabel,
  title,
  to,
}: {
  isActive?: boolean
  isMuted?: boolean
  progressLabel?: string
  title: string
  to: string
}) {
  return (
    <Link
      className={cx(
        'flex h-9.5 items-center gap-2 rounded-lg px-2 type-control',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        isActive
          ? 'bg-white font-semibold text-stone-900 shadow-sm'
          : isMuted
            ? 'text-stone-400 hover:bg-white'
            : 'text-stone-600 hover:bg-white hover:text-stone-900',
      )}
      to={to}
    >
      <span
        className={cx(
          'flex h-4.5 w-8 shrink-0 items-center justify-center rounded type-micro font-bold',
          getMaterialKind(title) === 'PPT'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-rose-100 text-rose-700',
        )}
      >
        {getMaterialKind(title)}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {progressLabel ? (
        <span className="shrink-0 type-micro font-semibold text-brand-600">
          {progressLabel}
        </span>
      ) : null}
    </Link>
  )
}

function getMaterialKind(title: string): 'PDF' | 'PPT' {
  return /\.pptx?$/i.test(title.trim()) ? 'PPT' : 'PDF'
}

function getQuizKindLabel(quizType: string): string {
  const labels: Record<string, string> = {
    ESSAY: '서술형',
    MCQ: '객관식',
    OX: 'OX',
    SHORT: '단답형',
  }
  return labels[quizType] ?? quizType
}
