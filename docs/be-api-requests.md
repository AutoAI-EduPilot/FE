# BE 필요 API 목록 (FE -> BE)

## 기준

| 항목 | 내용 |
| --- | --- |
| 확인일 | 2026-08-02 |
| FE 기준 | `main` `955a3af` + 현재 로컬 변경사항 |
| BE 기준 | `develop` `docs/api-spec.md` 2026-08-02 |
| 실행 계약 | 배포 Swagger `/v3/api-docs` 62개 operation |

현재 Swagger에 추가된 강의실, 프로필, 환경설정, 일정 조회, 노트, 피드백 API는
FE repository에 반영했다. 아래에는 **화면은 존재하지만 여전히 공개 API가 없는
기능**만 남긴다.

## P0. 강의자 학습 현황·리포트

현재 학습 현황 화면은 지표와 표 레이아웃만 있고 실제 데이터를 조회할 수 없다.
GitHub 이슈 #34~#37의 리포트 기능도 공개 Swagger에 계약이 없다.

```http
GET  /api/classrooms/{classroomId}/analytics
GET  /api/classrooms/{classroomId}/learners
GET  /api/classrooms/{classroomId}/learners/{learnerId}/report
POST /api/classrooms/{classroomId}/reports
GET  /api/classrooms/{classroomId}/reports/{reportId}
POST /api/classrooms/{classroomId}/reminders
```

최소 응답에는 학습자 수, 평균 진도, 최근 7일 AI 질문 수, 7일 이상 미접속자,
자료별 열람 인원·진도, 질문 주제 집계가 필요하다. 리포트는 생성 상태와 버전,
평가 기준, 근거 메시지·페이지를 포함해야 한다.

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

## P1. 캘린더 개인 일정

`GET /api/users/me/schedule`은 강의실 주차·공지에서 파생된 조회만 제공한다.
캘린더의 `일정 추가`로 만든 개인 일정은 현재 브라우저 localStorage에 저장된다.

```http
POST   /api/users/me/schedule
PATCH  /api/users/me/schedule/{scheduleId}
DELETE /api/users/me/schedule/{scheduleId}
```

요청 필드는 `title`, `startsAt`, 선택적 `endsAt`, `hasTime`, `kind=PERSONAL`이
필요하다. 기간이 없는 일정은 `endsAt=null`, 종일 일정은 `hasTime=false`로
구분하고 사용자 본인 일정만 수정·삭제할 수 있어야 한다.

## P1. 강의실 수강생 관리

승인 요청 API는 처리 이력만 반환하므로 현재 FE의 수강생 관리 탭은 승인 이력을
임시로 보여준다. 탈퇴·관리자 제거 이후의 실제 재학 상태를 관리하려면 별도 계약이
필요하다.

```http
GET    /api/classrooms/{classroomId}/learners
DELETE /api/classrooms/{classroomId}/learners/{learnerId}
```

목록 응답에는 `learnerId`, 이름, 이메일, 소속, 입장일, 상태가 필요하다. 삭제는
강의자만 가능해야 하며 해당 학습자의 세션·학습 기록 보존 정책을 명시해야 한다.

강의실 수정 시 현재 계약은 `startDate`를 변경할 수 없고 `DELETE
/api/classrooms/{classroomId}`가 운영 종료 의미로 사용된다. 최종 강의실 설정 시안의
기능을 완성하려면 아래 계약도 필요하다.

```http
PATCH  /api/classrooms/{classroomId}  # startDatePresent/startDate 지원
DELETE /api/classrooms/{classroomId}/permanent
```

시작일 변경 시 기존 주차 공개일을 함께 이동할지 여부를 요청 필드로 명시해야 하며,
영구 삭제는 확인용 강의실명과 재인증 또는 별도 확인 토큰을 요구해야 한다.

## P1. 학습 대화 제어

- `대화 새로 시작`: 현재 화면 메시지만 숨기므로 서버 대화 컨텍스트 초기화 API 필요
- `현재 페이지 첨부 해제`: `USER_QUESTION.payload.includeCurrentPage` 계약 필요

```http
POST /api/sessions/{sessionId}/conversations
```

## P2. 운영 편의

```http
GET  /api/search?q={query}
POST /api/classrooms/{classroomId}/join-requests/approve-batch
```

통합 검색은 강의실·자료 결과의 `type`, `id`, `title`, 이동 경로를 반환한다.
일괄 승인은 현재 입장 요청 UI의 전체 선택 기능을 활성화할 때 필요하다.

## 계약 확인 필요

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
