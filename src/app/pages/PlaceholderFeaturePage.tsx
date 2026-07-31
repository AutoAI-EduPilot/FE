import { EmptyState, PageContainer, PageHeader } from '../../shared/ui'
import { usePageTitle } from '../../shared/lib/usePageTitle'

export function CalendarPage() {
  usePageTitle('캘린더')

  return (
    <PageContainer>
      <PageHeader
        title="캘린더"
      />
      <EmptyState
        title="표시할 일정이 없습니다."
        description="캘린더 API가 연결되면 실제 강의 일정과 공지가 이곳에 표시됩니다."
      />
    </PageContainer>
  )
}

export function NotesPage() {
  usePageTitle('내 노트')

  return (
    <PageContainer>
      <PageHeader
        title="내 노트"
      />
      <EmptyState
        title="저장된 노트가 없습니다."
        description="노트 API가 연결되면 실제 학습 노트가 이곳에 표시됩니다."
      />
    </PageContainer>
  )
}
