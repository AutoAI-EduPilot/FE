import { PageShell } from '../shared/ui/PageShell'

const foundations = [
  'React · TypeScript · Vite 실행 기반',
  'Spring 전용 공통 API client',
  'Lint · Typecheck · Test · Build CI',
]

export function FoundationPage() {
  return (
    <PageShell>
      <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600 uppercase">
        EduPilot
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        학습 경험을 위한 프론트엔드 기반이 준비되었습니다.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        이 화면은 Epic1 프로젝트 기반 구성 확인용입니다. 인증과 실제 학습 기능은
        후속 Epic에서 연결합니다.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="구성 완료 항목">
        {foundations.map((foundation) => (
          <li
            key={foundation}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm font-medium text-slate-700 shadow-sm"
          >
            {foundation}
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
