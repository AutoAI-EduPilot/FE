import type { MaterialStatus, StudyMaterial } from './materialTypes'

export const mockMaterials: StudyMaterial[] = [
  {
    activeSessionId: 'session-100',
    createdAt: '2026-07-22',
    fileSizeBytes: 12_480_000,
    id: 'material-ready',
    pageCount: 42,
    status: 'READY',
    title: '시험 대비 요약.pdf',
  },
  {
    createdAt: '2026-07-23',
    fileSizeBytes: 8_920_000,
    id: 'material-processing',
    status: 'PROCESSING',
    title: '강의 노트 5주차.pdf',
  },
  {
    createdAt: '2026-07-21',
    failureReason: '텍스트 추출 중 오류가 발생했습니다.',
    fileSizeBytes: 17_200_000,
    id: 'material-failed',
    status: 'FAILED',
    title: '스캔본 복습자료.pdf',
  },
]

export function createLocalMaterial(file: File): StudyMaterial {
  return {
    createdAt: new Date().toISOString().slice(0, 10),
    fileSizeBytes: file.size,
    id: `local-${Date.now()}`,
    status: 'PROCESSING',
    title: file.name,
  }
}

export function findMockMaterial(materialId: string | undefined): StudyMaterial | undefined {
  return mockMaterials.find((material) => material.id === materialId)
}

export function getMaterialStatusLabel(status: MaterialStatus): string {
  return statusLabels[status]
}

const statusLabels: Record<MaterialStatus, string> = {
  FAILED: 'FAILED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
}
