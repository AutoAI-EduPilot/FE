import { ChevronDown, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { StudyMaterial } from '../materials'
import { cx } from '../../shared/lib/cx'

interface SessionResourcePanelProps {
  activeMaterialId?: string
  backLabel: string
  backTo: string
  materialDetailPath: (materialId: string) => string
  materials: StudyMaterial[]
  progressLabel?: string
}

/**
 * 시안 4d의 좌측 리소스 패널.
 * 시안은 강의실 주차별 리소스를 나열하지만 해당 도메인이 없어 내 자료 목록으로 채운다.
 * (요청 스펙: docs/be-api-requests.md §2-2)
 */
export function SessionResourcePanel({
  activeMaterialId,
  backLabel,
  backTo,
  materialDetailPath,
  materials,
  progressLabel,
}: SessionResourcePanelProps) {
  const readyMaterials = materials.filter(
    (material) => material.status === 'READY',
  )
  const otherMaterials = materials.filter(
    (material) => material.status !== 'READY',
  )

  return (
    <aside className="hidden min-h-0 w-[250px] shrink-0 flex-col overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/60 p-3 xl:flex">
      <Link
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-stone-500 hover:bg-white hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        to={backTo}
      >
        <ChevronLeft aria-hidden="true" size={14} />
        <span className="truncate">{backLabel}</span>
      </Link>

      <p className="px-2 pt-3.5 pb-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-stone-400">
        학습 가능한 자료
      </p>
      <ul className="grid gap-0.5">
        {readyMaterials.map((material) => (
          <li key={material.id}>
            <ResourceRow
              isActive={material.id === activeMaterialId}
              progressLabel={
                material.id === activeMaterialId ? progressLabel : undefined
              }
              to={materialDetailPath(material.id)}
              title={material.title}
            />
          </li>
        ))}
        {readyMaterials.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-stone-400">
            준비된 자료가 없습니다.
          </li>
        ) : null}
      </ul>

      {otherMaterials.length > 0 ? (
        <>
          <p className="px-2 pt-3.5 pb-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-stone-400">
            처리 중 · 실패
          </p>
          <ul className="grid gap-0.5">
            {otherMaterials.map((material) => (
              <li key={material.id}>
                <ResourceRow
                  isMuted
                  to={materialDetailPath(material.id)}
                  title={material.title}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-auto flex items-center gap-1 px-2 pt-4 text-xs text-stone-400">
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
        'flex h-9.5 items-center gap-2 rounded-lg px-2 text-[13px]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        isActive
          ? 'bg-white font-semibold text-stone-900 shadow-sm'
          : isMuted
            ? 'text-stone-400 hover:bg-white'
            : 'text-stone-600 hover:bg-white hover:text-stone-900',
      )}
      to={to}
    >
      <span className="flex h-4.5 w-8 shrink-0 items-center justify-center rounded bg-rose-100 text-[10px] font-bold text-rose-700">
        PDF
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {progressLabel ? (
        <span className="shrink-0 text-[11px] font-semibold text-brand-600">
          {progressLabel}
        </span>
      ) : null}
    </Link>
  )
}
