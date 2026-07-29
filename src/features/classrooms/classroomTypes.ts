export type ClassroomStatus = 'ACTIVE' | 'COMPLETED'
export type WeekStatus = 'COMPLETED' | 'CURRENT' | 'SCHEDULED'
export type ClassroomFileType = 'PDF' | 'PPT'

export interface ClassroomMaterial {
  completed: boolean
  fileType: ClassroomFileType
  materialId: string
  pageLabel: string
  progressRate: number
  title: string
  uploadedAt?: string
}

export interface ClassroomWeek {
  /** 접힌 주차의 요약 수치 (materials를 내려받기 전 표시용) */
  completedCount?: number
  materialCount?: number
  materials: ClassroomMaterial[]
  releaseLabel?: string
  status: WeekStatus
  title: string
  weekNumber: number
}

export interface ClassroomNotice {
  authorName: string
  content: string
  createdAtLabel: string
  noticeId: string
}

export interface ClassroomSummary {
  accent: 'amber' | 'emerald' | 'indigo' | 'neutral' | 'violet'
  classroomId: string
  currentWeekLabel: string
  instructorName: string
  lastStudiedLabel: string
  name: string
  newMaterialCount?: number
  progressRate: number
  status: ClassroomStatus
}

export interface ClassroomDetail extends ClassroomSummary {
  materialCount: number
  notices: ClassroomNotice[]
  weeks: ClassroomWeek[]
}
