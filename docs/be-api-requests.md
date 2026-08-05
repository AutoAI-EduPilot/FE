# BE 필요 API 목록 (FE -> BE)

## 기준

| 항목 | 내용 |
| --- | --- |
| 확인일 | 2026-08-05 |
| FE 기준 | `fix/notion-0804-site-feedback` 현재 로컬 변경사항 |
| BE 기준 | `develop` `docs/api-spec.md` 2026-08-05 |
| 실행 계약 | 배포 Swagger `/v3/api-docs` 88개 operation |

현재 Swagger에 추가된 강의실, 프로필, 환경설정, 일정 조회, 노트, 피드백 API는
FE repository에 반영했다. 아래에는 **화면은 존재하지만 여전히 공개 API가 없는
기능**만 남긴다.

## 연결 완료: 강의자 학습 현황·리포트

2026-08-05 배포 Swagger에 아래 endpoint가 공개됐고 FE repository와 강의자 화면에
연결했다. 배포 빌드는 `VITE_API_CAPABILITIES=reports`로 활성화한다.

```http
GET  /api/classrooms/{classroomId}/analytics
GET  /api/classrooms/{classroomId}/students
GET  /api/classrooms/{classroomId}/report-criteria
POST /api/classrooms/{classroomId}/report-criteria
PATCH /api/classrooms/{classroomId}/report-criteria/{criterionId}
POST /api/classrooms/{classroomId}/students/{studentId}/reports
GET  /api/classrooms/{classroomId}/students/{studentId}/reports
GET  /api/reports/{reportId}
```

리포트 생성은 `scope: FULL | WEEK`와 선택적 `weekNumber`를 전송하고, 응답의
`status=PENDING|PROCESSING|COMPLETED|FAILED`와 `pollAfterSeconds`로 polling한다.
완료 목록의 `activeGeneration`, 상세의 `overallStage`, `criteria`, nullable score와
`publicLabel` 근거도 최신 계약에 맞춰 변환한다.

다음 기능은 현재 P0 범위에서 제외한다.

- `POST /api/reports/{reportId}/questions`: DEC-033과 BE #119·#120에 따라 Phase 3.
  FE 리포트 상세 화면에서도 질문 UI와 repository 메서드를 노출하지 않는다.
- AI 질문의 주제별 분류: 조회 시 LLM을 호출하지 않고 페이지별 질문 수로 대체한다.
  주제 클러스터링은 배치 인프라가 마련된 뒤 P2 backlog에서 검토한다.
- `POST /api/classrooms/{classroomId}/reminders`: 전달 수단과 알림 인프라가 정해질
  때까지 보류한다. 이메일을 채택하면 비밀번호 재설정 이메일과 함께 구축한다.

## P1. 인증 보조 기능

비밀번호 찾기와 Google 로그인 UI는 있지만 실제 요청을 보낼 API가 없다.

```http
POST /api/auth/password-reset/request
POST /api/auth/password-reset/confirm
GET  /api/auth/oauth/google/authorize
GET  /api/auth/oauth/google/callback
```

비밀번호 재설정 요청은 계정 존재 여부를 노출하지 않는 동일 응답을 반환하고,
OAuth 콜백은 현재 refresh HttpOnly cookie 정책을 유지해야 한다.

## 연결 완료: 캘린더 개인 일정

개인 일정은 localStorage를 사용하지 않고 아래 API로 조회·생성·수정·삭제한다.

```http
POST   /api/users/me/schedule
PATCH  /api/users/me/schedule/{scheduleId}
DELETE /api/users/me/schedule/{scheduleId}
```

요청은 `title`, `startsAt`, `endsAt`, `hasTime`을 사용하며 서버 응답의
`kind=PERSONAL`로 수정·삭제 가능 일정을 구분한다.

## 연결 완료: 강의실 수강생 관리

수강생 관리 탭은 승인 이력이 아니라 현재 멤버 목록과 제외 API를 사용한다.

```http
GET    /api/classrooms/{classroomId}/students
DELETE /api/classrooms/{classroomId}/students/{studentId}
```

강의실 수정의 `startDate`, `endDate`, `shiftWeekReleaseDates`도 공개 PATCH 계약에
연결했다. 영구 삭제만 여전히 공개 API가 없다.

```http
DELETE /api/classrooms/{classroomId}/permanent
```

영구 삭제는 확인용 강의실명과 재인증 또는 별도 확인 토큰을 요구해야 한다.

## 연결 완료: 주차 순서와 운영 상태

주차 드래그 순서와 `PRIVATE`, `SCHEDULED`, `PUBLISHED`, `BREAK` 상태를 아래 API로
저장한다.

```http
PATCH /api/classrooms/{classroomId}/weeks/reorder
PATCH /api/classrooms/{classroomId}/weeks/{weekNumber}/status
```

## 연결 완료: 학습 대화 제어

- `USER_QUESTION.payload.includeCurrentPage`: BE PR #152가 `develop`에 병합되어
  현재 페이지 첨부·해제 상태를 FE 요청 payload에 연결했다.
- `대화 새로 시작`: `POST /api/sessions/{sessionId}/conversations`에 연결했다.

## P2. 운영 편의

```http
GET  /api/search?q={query}
POST /api/classrooms/{classroomId}/join-requests/approve-batch
```

통합 검색은 강의실·자료 결과의 `type`, `id`, `title`, 이동 경로를 반환한다.
일괄 승인은 현재 입장 요청 UI의 전체 선택 기능을 활성화할 때 필요하다.

## 계약 확인 필요

- 주차별 공지를 주차 카드 상단에 안정적으로 표시하려면 공지 생성·수정·목록 계약에
  선택 `weekNumber`가 필요하다. `weekNumber=null`은 전체 공지, 값이 있으면 해당
  주차 공지로 정의하고, 목록 응답에도 같은 값을 반환해야 한다. 현재 FE는 데이터
  손실을 피하기 위해 기존 계약으로 생성 가능한 전체 공지만 제공한다.
- 공지 API는 현재 즉시 게시만 가능하다. 예약 게시가 범위라면 `publishAt` 필드 또는
  별도 예약 endpoint가 필요하다.
- 자료 업로드는 Swagger상 PDF 전용이다. PPT/PPTX 지원 계획이 있다면 허용 MIME,
  변환 상태, 변환 실패 사유를 계약에 추가해야 한다.
- 업로드 요청이 `200`이어도 비동기 처리 후 `FAILED`가 될 수 있으므로 목록·상세
  응답에서 `failureReason`을 일관되게 제공하고 운영 로그의 추적 ID를 반환해야 한다.
- 강의실 목록 정렬은 `RECENT`, `NAME`만 지원한다. 학습자 UI의 진도 낮은 순과 새
  자료 우선 정렬을 서버에서 지원하려면 enum 확장이 필요하다.
- 강의자 강의실 카드의 자료 수를 표시하기 위해 현재는 각 강의실의 주차 목록을
  추가 조회한다. `ClassroomSummaryResponse.materialCount`를 제공하면 목록의 N+1
  요청을 제거할 수 있다.
