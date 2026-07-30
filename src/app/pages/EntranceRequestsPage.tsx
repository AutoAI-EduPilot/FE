import {
  Check,
  Copy,
  Info,
  UserCheck,
  UserRoundX,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { isInstructorRole, useAuth } from '../../features/auth'
import { cx } from '../../shared/lib/cx'
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  useToast,
} from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

interface EntranceRequest {
  classroom: string
  classroomTone: 'amber' | 'indigo'
  email: string
  id: string
  name: string
  requestedAt: string
  school: string
}

const INITIAL_REQUESTS: EntranceRequest[] = [
  {
    classroom: '자료구조',
    classroomTone: 'indigo',
    email: 'seoyeon.lee@snu.ac.kr',
    id: 'request-1',
    name: '이서연',
    requestedAt: '오늘 10:24',
    school: '서울대학교',
  },
  {
    classroom: '자료구조',
    classroomTone: 'indigo',
    email: 'minho.j@snu.ac.kr',
    id: 'request-2',
    name: '정민호',
    requestedAt: '오늘 09:51',
    school: '서울대학교',
  },
  {
    classroom: '운영체제',
    classroomTone: 'amber',
    email: 'daeun.choi@snu.ac.kr',
    id: 'request-3',
    name: '최다은',
    requestedAt: '어제 22:13',
    school: '서울대학교',
  },
]

type RequestTab = 'history' | 'pending'

export function EntranceRequestsPage() {
  usePageTitle('입장 요청')
  const { user } = useAuth()
  const { show: showToast } = useToast()
  const [tab, setTab] = useState<RequestTab>('pending')
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [historyCount, setHistoryCount] = useState(12)
  const pendingCount = requests.length
  const rows = useMemo(
    () => (tab === 'pending' ? requests : []),
    [requests, tab],
  )

  if (!isInstructorRole(user?.role)) {
    return (
      <EmptyState
        title="강의자 전용 화면입니다."
        description="입장 요청 관리는 강의자 계정에서만 사용할 수 있습니다."
        action={
          <ButtonLink to={routes.classrooms} variant="secondary">
            내 강의실로
          </ButtonLink>
        }
      />
    )
  }

  function resolveRequest(requestId: string, action: 'approve' | 'reject') {
    setRequests((current) =>
      current.filter((request) => request.id !== requestId),
    )
    setHistoryCount((count) => count + 1)
    showToast(
      action === 'approve'
        ? '입장 요청을 승인했습니다.'
        : '입장 요청을 거절했습니다.',
      action === 'approve' ? 'success' : 'info',
    )
  }

  function approveAll() {
    if (requests.length === 0) return
    setHistoryCount((count) => count + requests.length)
    setRequests([])
    showToast('대기 중인 입장 요청을 모두 승인했습니다.', 'success')
  }

  async function copyInviteCode() {
    await navigator.clipboard?.writeText('KX4-2PB')
    showToast('초대코드를 복사했습니다.', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Classroom access"
        title="입장 요청"
        description="초대코드로 참여를 요청한 학습자를 확인하고 승인합니다."
        actions={<Badge tone="warning">미연동 미리보기</Badge>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" type="button" variant="secondary">
          전체 강의실
        </Button>
        <Button
          className="sm:ml-auto"
          onClick={() => void copyInviteCode()}
          size="sm"
          type="button"
          variant="secondary"
        >
          초대코드 <strong className="tracking-[0.08em]">KX4-2PB</strong>
          <Copy aria-hidden="true" size={14} />
        </Button>
        <Button
          disabled={pendingCount === 0}
          onClick={approveAll}
          size="sm"
          type="button"
        >
          <UserCheck aria-hidden="true" size={14} />
          대기 전체 승인
        </Button>
      </div>

      <div
        aria-label="입장 요청 보기"
        className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5"
        role="tablist"
      >
        <RequestTabButton
          active={tab === 'pending'}
          count={pendingCount}
          label="대기 중"
          onClick={() => setTab('pending')}
        />
        <RequestTabButton
          active={tab === 'history'}
          count={historyCount}
          label="처리 내역"
          onClick={() => setTab('history')}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            tab === 'pending'
              ? '대기 중인 입장 요청이 없습니다.'
              : '표시할 처리 내역이 없습니다.'
          }
          description={
            tab === 'pending'
              ? '새 요청이 들어오면 이 화면에서 확인할 수 있습니다.'
              : '처리 내역 API가 연결되면 승인과 거절 기록이 표시됩니다.'
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-500">
                <tr>
                  <th className="w-10 px-5 py-3">
                    <span className="sr-only">선택</span>
                  </th>
                  <th className="px-3 py-3">학생</th>
                  <th className="px-3 py-3">이메일</th>
                  <th className="px-3 py-3">학교</th>
                  <th className="px-3 py-3">요청 강의실</th>
                  <th className="px-3 py-3">요청 시각</th>
                  <th className="px-5 py-3 text-right">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-3.5">
                      <input
                        aria-label={`${request.name} 요청 선택`}
                        className="size-4 rounded border-stone-300 accent-brand-600"
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                          {request.name.slice(0, 1)}
                        </span>
                        <strong className="text-sm text-stone-900">
                          {request.name}
                        </strong>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-stone-600">
                      {request.email}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-stone-600">
                      {request.school}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-2 text-sm text-stone-800">
                        <span
                          aria-hidden="true"
                          className={cx(
                            'size-2 rounded-sm',
                            request.classroomTone === 'indigo'
                              ? 'bg-brand-600'
                              : 'bg-amber-500',
                          )}
                        />
                        {request.classroom}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-stone-500">
                      {request.requestedAt}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`${request.name} 입장 요청 거절`}
                          onClick={() => resolveRequest(request.id, 'reject')}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          <UserRoundX aria-hidden="true" size={14} />
                          거절
                        </Button>
                        <Button
                          aria-label={`${request.name} 입장 요청 승인`}
                          onClick={() => resolveRequest(request.id, 'approve')}
                          size="sm"
                          type="button"
                        >
                          <Check aria-hidden="true" size={14} />
                          승인
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="inline-flex items-start gap-2 rounded-lg bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">
        <Info aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
        승인 시 학습자가 강의실에 입장하고 알림을 받습니다. 이 화면은 입장
        요청 API가 연결되기 전까지 예시 데이터로 동작합니다.
      </p>
    </div>
  )
}

function RequestTabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-selected={active}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold',
        active
          ? 'bg-stone-900 text-white dark:text-[#1b1c20]'
          : 'text-stone-500 hover:text-stone-800',
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
      <span
        className={cx(
          'rounded-full px-1.5 py-0.5 text-[10px]',
          active
            ? 'bg-white/20 text-white dark:bg-stone-700 dark:text-white'
            : 'bg-stone-100 text-stone-500',
        )}
      >
        {count}
      </span>
    </button>
  )
}
