import { Inbox, UserCheck } from 'lucide-react'
import { useState } from 'react'

import { usePageTitle } from '../../shared/lib/usePageTitle'
import { cx } from '../../shared/lib/cx'
import { Button, PageHeader } from '../../shared/ui'

type RequestTab = 'pending' | 'processed'

export function EntranceRequestsPage() {
  usePageTitle('입장 요청')
  const [tab, setTab] = useState<RequestTab>('pending')

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <PageHeader
        actions={
          <Button disabled>
            <UserCheck aria-hidden="true" size={15} />
            대기 전체 승인
          </Button>
        }
        title="입장 요청"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label>
          <span className="sr-only">강의실 선택</span>
          <select
            className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500"
            disabled
          >
            <option>전체 강의실</option>
          </select>
        </label>
        <div
          aria-label="입장 요청 상태"
          className="inline-flex rounded-lg border border-stone-200 bg-white p-1"
          role="tablist"
        >
          <TabButton
            active={tab === 'pending'}
            label="대기 중 0"
            onClick={() => setTab('pending')}
          />
          <TabButton
            active={tab === 'processed'}
            label="처리 내역 0"
            onClick={() => setTab('processed')}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="hidden grid-cols-[40px_1fr_1.2fr_1fr_1fr_120px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-semibold text-stone-400 md:grid">
          <span />
          <span>학생</span>
          <span>이메일</span>
          <span>소속</span>
          <span>요청 강의실</span>
          <span className="text-right">처리</span>
        </div>
        <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
            <Inbox aria-hidden="true" size={19} />
          </span>
          <h2 className="mt-4 text-base font-bold text-stone-900">
            {tab === 'pending'
              ? '대기 중인 입장 요청이 없습니다'
              : '처리한 입장 요청이 없습니다'}
          </h2>
          <p className="mt-1.5 text-sm text-stone-500">
            입장 요청이 접수되면 학생 정보와 요청 강의실을 확인할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-selected={active}
      className={cx(
        'h-8 rounded-md px-3 text-xs font-semibold',
        active
          ? 'bg-stone-900 text-white'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
    </button>
  )
}
