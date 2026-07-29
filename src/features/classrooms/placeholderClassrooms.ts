/**
 * 강의실(Classroom) 도메인은 아직 백엔드에 없다.
 * 디자인 정본(강의실 레이아웃 시안 4b·4c)을 화면으로 유지하기 위한 고정 데이터이며,
 * API가 생기면 이 모듈만 저장소 호출로 교체한다.
 *
 * 요청 스펙: docs/be-api-requests.md §2 (GET /api/classrooms, /weeks, /notices)
 */
import type { ClassroomDetail, ClassroomSummary } from './classroomTypes'

export const PLACEHOLDER_NOTICE =
  '강의실은 백엔드 연동 대기 중인 미리보기 화면입니다. 표시된 값은 예시입니다.'

export const placeholderClassrooms: ClassroomSummary[] = [
  {
    accent: 'indigo',
    classroomId: 'data-structure',
    currentWeekLabel: '3주차',
    instructorName: '박교수',
    lastStudiedLabel: '이어서: 연결 리스트.pdf · 12쪽',
    name: '자료구조',
    newMaterialCount: 2,
    progressRate: 42,
    status: 'ACTIVE',
  },
  {
    accent: 'amber',
    classroomId: 'operating-system',
    currentWeekLabel: '4주차',
    instructorName: '이교수',
    lastStudiedLabel: '이어서: 프로세스 스케줄링.pptx',
    name: '운영체제',
    progressRate: 61,
    status: 'ACTIVE',
  },
  {
    accent: 'emerald',
    classroomId: 'database',
    currentWeekLabel: '3주차',
    instructorName: '최교수',
    lastStudiedLabel: '이어서: 관계 대수.pdf · 5쪽',
    name: '데이터베이스',
    newMaterialCount: 1,
    progressRate: 28,
    status: 'ACTIVE',
  },
  {
    accent: 'violet',
    classroomId: 'algorithm',
    currentWeekLabel: '2주차',
    instructorName: '정교수',
    lastStudiedLabel: '이어서: 점근 표기법.pdf · 2쪽',
    name: '알고리즘',
    progressRate: 15,
    status: 'ACTIVE',
  },
  {
    accent: 'neutral',
    classroomId: 'technical-writing',
    currentWeekLabel: '완료',
    instructorName: '한교수',
    lastStudiedLabel: '모든 자료를 학습했어요',
    name: '공학 글쓰기',
    progressRate: 100,
    status: 'COMPLETED',
  },
]

export const placeholderContinue = {
  materialTitle: '연결 리스트.pdf',
  pageNumber: 12,
  progressRate: 32,
  subtitle: '자료구조 · 3주차 · 어제 12쪽까지 봤어요',
}

const dataStructureDetail: ClassroomDetail = {
  ...placeholderClassrooms[0],
  materialCount: 21,
  notices: [
    {
      authorName: '박교수',
      content:
        '중간고사 범위는 1~4주차 자료입니다. 4주차 자료는 8월 3일에 공개돼요.',
      createdAtLabel: '7월 26일',
      noticeId: 'notice-1',
    },
  ],
  weeks: [
    {
      materials: [
        {
          completed: false,
          fileType: 'PDF',
          materialId: 'linked-list',
          pageLabel: '38쪽',
          progressRate: 32,
          title: '연결 리스트',
          uploadedAt: '7월 24일 업로드',
        },
        {
          completed: false,
          fileType: 'PPT',
          materialId: 'linked-list-lab',
          pageLabel: '24슬라이드',
          progressRate: 0,
          title: '연결 리스트 실습',
          uploadedAt: '7월 24일 업로드',
        },
        {
          completed: true,
          fileType: 'PDF',
          materialId: 'array-vs-list',
          pageLabel: '12쪽',
          progressRate: 100,
          title: '배열 vs 리스트 비교',
        },
      ],
      status: 'CURRENT',
      title: '연결 리스트',
      weekNumber: 3,
    },
    {
      completedCount: 4,
      materialCount: 4,
      materials: [],
      status: 'COMPLETED',
      title: '단일 연결 리스트',
      weekNumber: 2,
    },
    {
      completedCount: 3,
      materialCount: 3,
      materials: [],
      status: 'COMPLETED',
      title: '배열 복습',
      weekNumber: 1,
    },
    {
      materialCount: 5,
      materials: [],
      releaseLabel: '8월 3일 공개',
      status: 'SCHEDULED',
      title: '스택과 큐',
      weekNumber: 4,
    },
  ],
}

export function findPlaceholderClassroom(
  classroomId: string,
): ClassroomDetail | null {
  if (classroomId === dataStructureDetail.classroomId) return dataStructureDetail

  const summary = placeholderClassrooms.find(
    (classroom) => classroom.classroomId === classroomId,
  )
  if (!summary) return null

  return { ...summary, materialCount: 0, notices: [], weeks: [] }
}
