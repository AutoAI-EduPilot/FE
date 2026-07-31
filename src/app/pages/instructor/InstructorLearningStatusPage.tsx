import { ArrowRight, BarChart3, HelpCircle, Users } from 'lucide-react'

import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { PageHeader } from '../../../shared/ui'

const SUMMARY_ITEMS = [
  { label: '학습자', suffix: '명', value: 0 },
  { label: '평균 진도', suffix: '%', value: 0 },
  { label: 'AI 질문 수 (7일)', suffix: '건', value: 0 },
  { label: '7일 이상 미접속', suffix: '명', value: 0 },
]

export function InstructorLearningStatusPage() {
  usePageTitle('학습 현황')

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <PageHeader
        actions={
          <p className="text-xs font-medium text-stone-400">
            마지막 갱신 정보 없음
          </p>
        }
        title="학습 현황"
        titleAccessory={
          <label>
            <span className="sr-only">강의실 선택</span>
            <select
              className="h-9 min-w-40 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500"
              disabled
            >
              <option>강의실 없음</option>
            </select>
          </label>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_ITEMS.map((item) => (
          <article
            className="min-h-28 rounded-lg border border-stone-200 bg-white px-5 py-4"
            key={item.label}
          >
            <p className="text-xs font-medium text-stone-400">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-stone-950">
              {item.value}
              <span className="ml-0.5 text-base">{item.suffix}</span>
            </p>
            {item.label === '7일 이상 미접속' ? (
              <button
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 disabled:cursor-not-allowed disabled:text-stone-300"
                disabled
                type="button"
              >
                리마인더 보내기
                <ArrowRight aria-hidden="true" size={13} />
              </button>
            ) : null}
          </article>
        ))}
      </section>

      <section className="grid min-h-[520px] gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <EmptyAnalyticsPanel
          description="강의실을 선택하면 자료별 열람 인원이 표시됩니다."
          icon={BarChart3}
          title="자료별 열람 현황"
        />
        <EmptyAnalyticsPanel
          description="학습자가 질문한 주제를 집계해 표시합니다."
          icon={HelpCircle}
          title="AI 질문 많은 주제"
        />
      </section>
    </div>
  )
}

function EmptyAnalyticsPanel({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: typeof Users
  title: string
}) {
  return (
    <article className="flex min-h-72 flex-col rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="text-sm font-bold text-stone-900">{title}</h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
          <Icon aria-hidden="true" size={19} />
        </span>
        <p className="mt-3 text-sm font-semibold text-stone-800">
          표시할 학습 데이터가 없습니다
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-400">{description}</p>
      </div>
    </article>
  )
}
