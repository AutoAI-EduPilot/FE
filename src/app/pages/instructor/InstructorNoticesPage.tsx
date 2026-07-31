import { BellRing, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { usePageTitle } from '../../../shared/lib/usePageTitle'
import { Button, PageContainer, PageHeader, useToast } from '../../../shared/ui'

export function InstructorNoticesPage() {
  usePageTitle('공지 관리')
  const { show: showToast } = useToast()
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  return (
    <PageContainer>
      <PageHeader
        actions={
          <Button onClick={() => setIsComposerOpen(true)}>
            <Plus aria-hidden="true" size={15} />
            새 공지
          </Button>
        }
        title="공지 관리"
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

      <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-stone-200 bg-white px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
          <BellRing aria-hidden="true" size={19} />
        </span>
        <h2 className="mt-4 text-base font-bold text-stone-900">
          등록된 공지가 없습니다
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          강의실 공지를 게시하면 예약 및 게시 상태별로 표시됩니다.
        </p>
      </section>

      {isComposerOpen ? (
        <NoticeComposer
          onClose={() => setIsComposerOpen(false)}
          onSubmit={() =>
            showToast('현재 공지 등록 기능을 사용할 수 없습니다.', 'info')
          }
        />
      ) : null}
    </PageContainer>
  )
}

function NoticeComposer({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [title, setTitle] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    onSubmit()
  }

  return (
    <div
      aria-labelledby="notice-composer-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-2xl"
        onSubmit={submit}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-950" id="notice-composer-title">
            새 공지
          </h2>
          <button
            aria-label="공지 작성 닫기"
            className="flex size-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <label className="mt-5 block text-[13px] font-semibold text-stone-800">
          제목
          <input
            autoFocus
            className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="mt-4 block text-[13px] font-semibold text-stone-800">
          내용
          <textarea className="mt-1 min-h-36 w-full resize-none rounded-lg border border-stone-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            취소
          </Button>
          <Button disabled={!title.trim()} type="submit">
            등록
          </Button>
        </div>
      </form>
    </div>
  )
}
