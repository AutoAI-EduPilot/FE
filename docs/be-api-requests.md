# BE API 요청 목록 (FE → Main/AI)

| 항목 | 내용 |
| --- | --- |
| 작성 | FE (이감) |
| 기준 | 디자인 정본 `강의실 레이아웃 시안.dc.html` (4a~4e) |
| 상태 | 요청 초안 — 우선순위·형태 협의 필요 |

FE는 시안 전체를 UI로 구현했습니다. 아래 항목은 **화면은 있으나 API가 없어 placeholder(로컬 상태·고정 데이터)로 동작**하는 부분입니다. 각 항목의 "현재 FE 동작"을 보면 어디까지 임시인지 알 수 있습니다.

기존 계약(`docs/api-spec.md`)에 이미 있는 22개 외부 API는 FE 연동이 끝났으므로 여기 포함하지 않았습니다.

---

## P0 — 이미 합의됐지만 미배포/미확정

### 0-1. SSE 스트림 (BE#26)

```
GET /api/sessions/{sessionId}/stream
```

계약(`api-spec.md` §9)은 확정. 엔드포인트 미배포 상태입니다. FE는 `useSessionChat.appendMessages`를 연결 지점으로 준비해 두었고 현재는 동기 턴 응답으로 동작합니다. **ai-service 배포와 함께 우선 처리 요청.**

### 0-2. PDF 원본 다운로드 (DEC-005 초안 → 확정 요청)

```
GET /api/materials/{materialId}/file
→ application/pdf (인증 필요, Range 지원 권장)
```

- **현재 FE 동작**: 뷰어 자리에 "원본 PDF를 표시할 수 없습니다" placeholder 카드. 페이지 이동·썸네일·줌 UI는 모두 구현돼 있고 **파일만 오면 즉시 렌더**됩니다(react-pdf 도입 예정).
- 요청: 배포 여부 확인 + 응답 형식(직접 스트리밍 / presigned URL) 확정.
- Range 요청을 지원하면 대용량 자료의 페이지 단위 로딩이 가능합니다.

---

## P1 — 시안 4d(학습 화면) 보조 기능

### 1-1. 학습 노트

시안의 우측 패널은 `AI 채팅` / `내 노트` 2개 탭입니다.

```
GET    /api/sessions/{sessionId}/notes            → { items: [Note] }
POST   /api/sessions/{sessionId}/notes            { content, pageNumber, sourceMessageId? }
PATCH  /api/notes/{noteId}                        { content }
DELETE /api/notes/{noteId}

Note = { noteId, content, pageNumber, sourceMessageId?, createdAt, updatedAt }
```

- **현재 FE 동작**: 노트 탭은 있으나 **브라우저 메모리에만 저장**되어 새로고침 시 사라집니다. AI 답변의 "노트에 저장" 버튼도 로컬 저장입니다.
- `sourceMessageId`가 있으면 "이 답변에서 저장한 노트"로 역참조가 가능합니다.
- 자료 단위(`/materials/{id}/notes`)가 더 적합하다면 그쪽도 좋습니다 — 세션이 여러 개일 때 노트가 흩어지지 않는 편을 선호합니다.

### 1-2. 형광펜(하이라이트)

```
GET    /api/materials/{materialId}/highlights?page={n}
POST   /api/materials/{materialId}/highlights     { pageNumber, text, rects[], color }
DELETE /api/highlights/{highlightId}

rects = [{ x, y, width, height }]  // 페이지 크기 대비 0~1 비율 좌표 권장
```

- **현재 FE 동작**: 툴바에 형광펜 버튼이 있으나 비활성(`백엔드 연동 대기` 툴팁). PDF 렌더링(0-2)이 선행돼야 실제 선택 영역을 잡을 수 있습니다.
- 좌표는 뷰어 줌 배율과 무관하도록 **비율 좌표**를 권장합니다.

### 1-3. 대화 새로 시작

```
POST /api/sessions/{sessionId}/conversations   → { conversationId }
```

- **현재 FE 동작**: "대화 새로 시작" 버튼이 화면의 메시지 목록만 비웁니다(서버 이력은 그대로).
- 기존 `qaThread`의 `START_NEW` 모드로 충분하다면 별도 API 없이 **턴 payload로 처리하는 방법**을 알려주세요. 그 경우 FE가 `USER_QUESTION`에 스레드 리셋 플래그를 실어 보내겠습니다.

---

## P2 — 시안 4b·4c(강의실·주차) 도메인

시안의 첫 두 화면은 **강의실(Classroom) → 주차(Week) → 자료(Material)** 3단 구조입니다. 현재 백엔드에는 자료만 있고 상위 두 계층이 없습니다.

> **현재 FE 동작**: `/classrooms`, `/classrooms/:id` 화면을 시안대로 구현했고 **고정 placeholder 데이터**로 렌더합니다. 화면 상단에 `미연동 미리보기` 배지를 노출해 실데이터가 아님을 명시했습니다. 아래 API가 생기면 placeholder 모듈만 교체하면 됩니다.

### 2-1. 강의실 목록·상세

```
GET  /api/classrooms                       → { items: [ClassroomSummary], page, totalPages }
GET  /api/classrooms/{classroomId}         → ClassroomDetail
POST /api/classrooms/join                  { inviteCode } → ClassroomSummary

ClassroomSummary = {
  classroomId, name, instructorName, currentWeek,
  progressRate,            // 0~100
  newMaterialCount,        // "새 자료 2" 배지
  status,                  // ACTIVE | COMPLETED
  lastStudied: { materialId, title, pageNumber } | null   // "이어서: 연결 리스트.pdf · 12쪽"
}
ClassroomDetail = ClassroomSummary + { materialCount, weeks: [Week] }
```

### 2-2. 주차 구성

```
GET /api/classrooms/{classroomId}/weeks    → { items: [Week] }

Week = {
  weekNumber, title,                       // "3주차 — 연결 리스트"
  status,                                  // CURRENT | COMPLETED | SCHEDULED
  releaseAt,                               // SCHEDULED일 때 "8월 3일 공개"
  materials: [{ materialId, title, fileType, pageCount, uploadedAt, progressRate, completed }]
}
```

- `fileType`: 시안은 PDF/PPT 배지를 구분합니다. 현재 업로드는 PDF만 허용하는데 **PPT 지원 계획이 있는지** 알려주세요. 없으면 배지는 PDF 고정으로 두겠습니다.

### 2-3. 강의자 공지

```
GET /api/classrooms/{classroomId}/notices  → { items: [Notice] }
Notice = { noticeId, authorName, content, createdAt }
```

### 2-4. 기존 자료 API 확장 요청

강의실이 생기면 `GET /api/materials` 응답에 아래 필드가 필요합니다.

```
+ classroomId, weekNumber
+ lastReadPage        // "12쪽까지 봤어요"
+ progressRate        // 자료별 진도 바
```

**강의실 도입 전에도 `lastReadPage`·`progressRate`는 단독으로 유용합니다**(자료 목록에서 이어보기 표시). 우선 이 두 필드만이라도 추가를 요청드립니다.

### 2-5. 이어서 학습

```
GET /api/users/me/continue → { sessionId, materialId, materialTitle, pageNumber, updatedAt } | null
```

- 시안 4b 상단의 "이어서 학습하기 — 연결 리스트.pdf · 어제 12쪽까지 봤어요" 배너용입니다.
- `GET /api/sessions?size=1&sort=updatedAt`으로 대체 가능하면 그렇게 쓰겠습니다 — **정렬·필터 지원 여부**만 알려주세요.

---

## P3 — 시안 4e(설정) 및 공통

### 3-1. 프로필 수정

```
PATCH  /api/users/me            { name?, affiliation? } → User
POST   /api/users/me/avatar     multipart(file)         → { avatarUrl }
DELETE /api/users/me/avatar
```

- **현재 FE 동작**: 이름·소속 입력 필드와 사진 변경/삭제 버튼이 있으나 저장 시 "백엔드 연동 대기" 안내만 표시합니다.
- `affiliation`(학교·기관)은 시안에만 있는 신규 필드입니다. 불필요하면 빼겠습니다.

### 3-2. 사용자 환경설정

```
GET   /api/users/me/preferences  → Preferences
PATCH /api/users/me/preferences  { newMaterialNotification?, studyReminder?, aiAnswerStyle? }

Preferences = {
  newMaterialNotification: boolean,   // "새 자료 알림"
  studyReminder: boolean,             // "3일 이상 미접속 시 이메일"
  aiAnswerStyle: 'CONCISE' | 'NORMAL' | 'DETAILED'   // "AI 답변 스타일"
}
```

- `aiAnswerStyle`은 턴 요청의 `detailLevel`과 연결됩니다. **현재 FE는 `EXPLAIN_CURRENT_PAGE` payload에 `detailLevel: 'NORMAL'`을 하드코딩**하고 있는데, 사용자 설정값을 싣는 게 맞다면 이 API가 필요합니다.
- 알림 2종은 발송 주체가 BE이므로 저장만으로는 동작하지 않습니다 — 실제 발송 계획도 함께 알려주세요.

### 3-3. 통합 검색 (⌘K)

```
GET /api/search?q={query}&type={material|session|classroom}
→ { items: [{ type, id, title, subtitle, url }] }
```

- **현재 FE 동작**: 시안의 `⌘K` 검색 박스를 렌더하지만 클릭 시 비활성 안내를 표시합니다.
- 우선순위 낮음. 자료 목록 내 클라이언트 필터로 대체 가능하면 그렇게 하겠습니다.

### 3-4. 캘린더

```
GET /api/users/me/schedule?from={date}&to={date}
→ { items: [{ date, type, title, classroomId? }] }
```

- 시안 사이드바의 "캘린더" 메뉴용. **도메인 정의 자체가 없어 가장 후순위**입니다. 제외해도 무방하면 메뉴에서 빼겠습니다.

### 3-5. 비밀번호 재설정

```
POST /api/auth/password-reset/request    { email }
POST /api/auth/password-reset/confirm    { token, newPassword }
```

- **현재 FE 동작**: `/forgot-password`에서 이메일 형식 검증과 전송 완료 화면까지 구현했지만 실제 메일은 발송하지 않습니다.
- 요청 API는 계정 존재 여부를 노출하지 않도록 등록 여부와 무관하게 같은 성공 응답을 반환해야 합니다.
- 재설정 토큰은 일회용, 10분 만료를 권장하며 새 비밀번호는 회원가입과 같은 정책을 사용합니다.

---

## 회신이 필요한 결정 사항

1. **강의실 도메인(P2)을 MVP에 넣을지** — 넣지 않으면 FE는 `/classrooms` 화면을 시안 보관용으로만 두고 내비에서 감춥니다.
2. **노트를 세션 단위 vs 자료 단위** 중 어느 쪽으로 둘지.
3. **PPT 지원 여부** (파일 타입 배지·업로드 검증에 영향).
4. **`lastReadPage`·`progressRate`** — 강의실과 무관하게 먼저 추가 가능한지.
5. **대화 새로 시작**을 전용 API로 둘지, 턴 payload 플래그로 둘지.
6. `GET /api/materials/{id}/file` **배포 상태** (프로브로는 401만 확인돼 존재 여부 판별 불가).
