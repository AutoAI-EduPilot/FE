import type { MaterialStatus } from './materialTypes'

const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  FAILED: '처리 실패',
  PROCESSING: '처리 중',
  READY: '준비 완료',
}

export function getMaterialStatusLabel(status: MaterialStatus): string {
  return MATERIAL_STATUS_LABELS[status] ?? status
}
