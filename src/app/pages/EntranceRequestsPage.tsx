import { Copy, Inbox, Info, UserCheck } from 'lucide-react'
import { useState } from 'react'

import { usePageTitle } from '../../shared/lib/usePageTitle'
import { cx } from '../../shared/lib/cx'
import { Button, PageContainer, PageHeader } from '../../shared/ui'

type RequestTab = 'pending' | 'processed'

export function EntranceRequestsPage() {
  usePageTitle('입장 요청')
  const [tab, setTab] = useState<RequestTab>('pending')

  return (
    <PageContainer>
      <PageHeader
        actions={
          <>
            <Button disabled variant="secondary">
              초대 코드 미발급
              <Copy aria-hidden="true" size={14} />
            </Button>
            <Button disabled>
              <UserCheck aria-hidden="true" size={15} />
              대기 전체 승인
            </Button>
          </>
        }
        title="입장 요청"
        titleAccessory={
          <label>
            <span className="sr-only">강의실 선택</span>
            <select
              className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500"
              disabled
            >
              <option>전체 강의실</option>
            </select>
          </label>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="hidden grid-cols-[40px_1fr_1.2fr_1fr_1fr_120px_120px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-semibold text-stone-400 lg:grid">
          <span>
            <input aria-label="전체 요청 선택" disabled type="checkbox" />
          </span>
          <span>학생</span>
          <span>이메일</span>
          <span>학교</span>
          <span>요청 강의실</span>
          <span>요청 시각</span>
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

      <p className="flex w-fit items-start gap-2 rounded-lg bg-stone-50 px-3.5 py-2.5 text-xs leading-5 text-stone-500">
        <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
        초대 코드로 참여를 요청한 학습자는 강의자 승인 후 강의실에 입장합니다.
        승인 시 학습자에게 알림이 전송됩니다.
      </p>
    </PageContainer>
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
