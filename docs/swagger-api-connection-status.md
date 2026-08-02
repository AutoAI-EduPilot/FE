# Swagger API 연결 상태

## 기준

- 확인일: 2026-08-02
- Swagger UI: <https://edu-pilot.duckdns.org/swagger-ui/index.html>
- OpenAPI JSON: <https://edu-pilot.duckdns.org/v3/api-docs>
- BE 문서: `AutoAI-EduPilot/BE` `develop`의 `docs/api-spec.md`
- Swagger operation: 62개

`화면 연결`은 실제 페이지나 hook에서 사용자가 호출할 수 있는 상태를 뜻한다.
`repository 준비`는 계약과 mapper가 구현됐지만 현재 화면에 직접 조작 UI가 없는
상태를 뜻한다. 테스트 fixture나 주석은 연결로 계산하지 않는다.

## 이번 반영 (강의자 시안 5c·8c 조작 UI)

- 공지 관리: 공지별 `수정`·`내리기` (PATCH/DELETE notices)
- 자료 관리: 주차 자료 `삭제`(주차에서 제거, DELETE week-material),
  공개 예정 주차 `지금 공개`(PATCH week releaseAt)

## 이전 반영

- 회원가입 부가정보: 소속, 학습 이메일 수신 동의, 약관·개인정보 버전 전송
- 사용자: 프로필 수정, 아바타 조회·업로드·삭제, 환경설정 조회·저장
- 강의실: 역할별 목록·상세·생성, 참여 요청, 초대 코드, 주차 조회·생성,
  주차별 PDF 업로드
- 운영: 참여 요청 조회·승인·거절, 공지 조회·등록
- 캘린더: 주차 공개·공지 게시 파생 일정 조회
- 학습: 세션 노트 조회·생성·삭제
- 공통: 피드백 접수

## 화면 연결

### 인증·사용자

`POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`,
`POST /api/auth/logout`, `GET /api/auth/email-availability`,
`GET/PATCH/DELETE /api/users/me`, `GET/POST/DELETE /api/users/me/avatar`,
`GET/PATCH /api/users/me/preferences`, `GET /api/users/me/schedule`

### 강의실

`GET/POST /api/classrooms`, `GET /api/classrooms/{id}`,
`GET /api/classrooms/{id}/invite-code`, `POST /api/classroom-join-requests`,
`GET /api/classrooms/{id}/join-requests`, 개별 `approve`·`reject`,
`GET/POST /api/classrooms/{id}/weeks`,
`GET/POST/PATCH/DELETE /api/classrooms/{id}/notices/...`,
`DELETE /api/classrooms/{id}/weeks/{weekNumber}/materials/{materialId}`

### 자료·학습

기존 자료, 세션, 턴/SSE, 퀴즈, 메모리 API 전체와 함께
`GET/POST /api/sessions/{sessionId}/notes`, `DELETE /api/notes/{noteId}`를
화면에서 사용한다. 강의실 자료 업로드는 `POST /api/materials`의
`classroomId`, `weekNumber` multipart 필드를 전송한다.

### 운영

`GET /api/health`, `GET /api/health/ready`, `POST /api/feedback`

## Repository 준비

아래 API는 typed repository까지 구현했으며 해당 편집 UI가 추가될 때 바로 사용할
수 있다.

- `PATCH/DELETE /api/classrooms/{id}`
- `POST /api/classrooms/{id}/invite-code/regenerate`
- `GET /api/classroom-join-requests/me`
- `PATCH /api/classrooms/{id}/weeks/{weekNumber}` (주차 편집은 연결, 삭제는 대기)
- `POST /api/classrooms/{id}/weeks/{weekNumber}/materials/{materialId}` (기존 자료
  재연결 UI 없음 — 업로드 경로만 사용)
- `GET /api/materials/{materialId}/notes`
- `PATCH /api/notes/{noteId}`

## 계약 메모

- 배포 Swagger와 BE `develop` 명세는 사용자·강의실·노트·피드백 범위에서
  일치한다.
- 배포 자료 업로드 summary는 PDF 전용이다. FE 강의실 업로드도 PDF만 허용한다.
- `GET /api/users/me/schedule`은 주차 공개와 공지 게시에서 파생된 읽기 전용
  일정이다. 사용자가 추가한 개인 일정은 별도 쓰기 API가 없어 로컬에만 저장된다.
- BE 문서의 내부 AI endpoint와 페이지 텍스트 endpoint는 브라우저 공개 계약이
  아니므로 FE에서 직접 호출하지 않는다.
