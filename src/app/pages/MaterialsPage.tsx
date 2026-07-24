import { Badge, Button, EmptyState, PageHeader } from '../../shared/ui'

export function MaterialsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Materials"
        title="자료"
        description="PDF 업로드, 목록, 처리 상태 UI가 연결될 기본 화면입니다."
        actions={<Badge tone="warning">BE#48 연동 예정</Badge>}
      />

      <EmptyState
        title="등록된 자료가 없습니다."
        description="자료 API가 연결되면 업로드한 PDF와 처리 상태가 이 영역에 표시됩니다."
        action={
          <Button type="button" disabled>
            업로드 준비 중
          </Button>
        }
      />
    </div>
  )
}
