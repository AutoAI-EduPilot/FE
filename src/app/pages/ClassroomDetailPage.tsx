import { Copy, FileUp, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { usePageTitle } from '../../shared/lib/usePageTitle'
import { Button, PageHeader, useToast } from '../../shared/ui'

export function ClassroomDetailPage() {
  usePageTitle('강의실 자료 관리')
  const { classroomId } = useParams()
  const { show: showToast } = useToast()

  function showUnavailable() {
    showToast('현재 강의실 관리 기능을 사용할 수 없습니다.', 'info')
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <p className="text-xs font-medium text-stone-400">
        내 강의실 / 강의실 {classroomId}
      </p>
      <PageHeader
        actions={
          <>
            <Button disabled variant="secondary">
              초대 코드 미발급
              <Copy aria-hidden="true" size={14} />
            </Button>
            <Button onClick={showUnavailable} variant="secondary">
              <Plus aria-hidden="true" size={14} />
              주차 추가
            </Button>
            <Button onClick={showUnavailable}>
              <FileUp aria-hidden="true" size={15} />
              자료 업로드
            </Button>
          </>
        }
        title={`강의실 ${classroomId} — 자료 관리`}
      />

      <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-stone-200 bg-white px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
          <FileUp aria-hidden="true" size={19} />
        </span>
        <h2 className="mt-4 text-base font-bold text-stone-900">
          등록된 주차와 자료가 없습니다
        </h2>
        <p className="mt-1.5 text-sm text-stone-500">
          강의실에 주차를 추가하면 자료 공개 상태를 관리할 수 있습니다.
        </p>
      </section>
    </div>
  )
}
