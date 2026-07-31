# Swagger API 연결 상태

## 기준

- 확인일: 2026-07-31
- Swagger UI: <https://edu-pilot.duckdns.org/swagger-ui/index.html>
- OpenAPI JSON: <https://edu-pilot.duckdns.org/v3/api-docs>
- OpenAPI 버전: `3.1.0`
- 서비스 API 버전: `0.1.0`

FE의 production source에 API 경로가 구현되어 있고 실제 페이지 또는 hook에서
repository 메서드를 호출할 때만 `연결됨`으로 판단한다. 테스트 fixture와 주석만
있는 경우는 연결로 보지 않는다.

## 요약

| 구분 | 개수 |
| --- | ---: |
| Swagger 전체 API | 27 |
| FE 연결 확인 | 27 |
| FE 미연결 | 0 |

## 이번에 연결한 API

| Method | Path | FE 기능 |
| --- | --- | --- |
| `GET` | `/api/sessions/{sessionId}/quizzes` | 비페이지형 `{ quizzes }` 응답으로 퀴즈 기록 표시 |
| `GET` | `/api/quizzes/{quizId}` | `questionText`, `options[{optionId,text}]` 공개 문항을 FE 모델로 변환 |

## 연결 확인된 API

- 인증·사용자: `POST /api/auth/signup`, `POST /api/auth/login`,
  `POST /api/auth/refresh`, `POST /api/auth/logout`,
  `GET /api/auth/email-availability`, `GET /api/users/me`, `DELETE /api/users/me`
- 자료: `GET /api/materials`, `POST /api/materials`,
  `GET /api/materials/{materialId}`, `DELETE /api/materials/{materialId}`,
  `GET /api/materials/{materialId}/file`
- 세션: `GET /api/sessions`, `POST /api/sessions`,
  `GET /api/sessions/{sessionId}`, `DELETE /api/sessions/{sessionId}`,
  `POST /api/sessions/{sessionId}/complete`,
  `GET /api/sessions/{sessionId}/messages`,
  `PATCH /api/sessions/{sessionId}/page`,
  `GET /api/sessions/{sessionId}/quizzes`,
  `POST /api/sessions/{sessionId}/turns`,
  `GET /api/sessions/{sessionId}/stream`
- 퀴즈: `GET /api/quizzes/{quizId}`,
  `POST /api/quizzes/{quizId}/submit`
- 학습자 메모리: `GET /api/users/me/memory`
- 운영 상태: `GET /api/health`, `GET /api/health/ready`

## 별도 계약 불일치

- 비밀번호 재설정, 프로필 수정, 환경설정 등 Swagger에 존재하지 않는 요청 API는
  이 문서의 27개 대조 대상에 포함하지 않았다. 해당 요청은
  [be-api-requests.md](be-api-requests.md)에서 관리한다.
- GitHub `docs/api-spec.md`는 `/api/auth/email-availability`를 누락하고
  `/api/materials/{materialId}/file`을 초안으로 표기한다. 실행 가능한 계약인
  배포 Swagger를 FE 구현 기준으로 사용했으며 BE 문서 동기화가 필요하다.
