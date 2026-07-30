import { EmptyState, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function CalendarPage() {
  usePageTitle('캘린더')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="캘린더"
        description="강의 자료 공개 일정과 공지를 한눈에 확인합니다."
      />
      <EmptyState
        title="표시할 일정이 없습니다."
        description="캘린더 API가 연결되면 실제 강의 일정과 공지가 이곳에 표시됩니다."
      />
    </div>
  )
}

export function NotesPage() {
  usePageTitle('내 노트')

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Notes"
        title="내 노트"
        description="AI 답변과 학습 중 작성한 메모를 자료별로 모아 봅니다."
      />
      <EmptyState
        title="저장된 노트가 없습니다."
        description="노트 API가 연결되면 실제 학습 노트가 이곳에 표시됩니다."
      />
    </div>
  )
}
