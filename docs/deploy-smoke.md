# FE Deploy Smoke Runbook

실제 dev 배포는 BE/infra 준비 후 진행합니다. 이 문서는 배포가 가능해진 뒤 FE에서 확인할 smoke 항목입니다.

## 사전 조건

- Related to AutoAI-EduPilot/BE#46
- Related to AutoAI-EduPilot/BE#8
- Spring API base URL이 `VITE_API_BASE_URL`로 확정되어 있습니다.
- FE 배포 도메인이 BE CORS allowlist에 포함되어 있습니다.
- FastAPI 내부 endpoint는 FE 환경 변수나 브라우저 호출 대상에 포함하지 않습니다.

## 환경별 변수

| 환경 | `VITE_API_BASE_URL` | 확인 |
| --- | --- | --- |
| preview | BE dev/stage Spring URL | PR preview에서 수동 smoke |
| production | 운영 Spring URL | 운영 배포 승인 후 smoke |

민감정보, 인증키, token, `.env.local`은 커밋하지 않습니다.

## 배포 전 로컬 확인

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

`dist/`와 `dist/assets/` 생성 여부만 확인하고 산출물은 커밋하지 않습니다.

## 라우트 smoke

정적 호스팅 fallback이 `/index.html`로 연결된 뒤 아래 route를 직접 진입과 새로고침으로 확인합니다.

- `/login`
- `/signup`
- `/materials`
- `/materials/material-ready`
- `/sessions`
- `/sessions/session-100`
- `/quizzes/quiz-100`
- `/sessions/session-100/diagnosis/diagnosis-low-score`
- `/missing-page`

## 브라우저 smoke 흐름

1. `/login`에서 mock login이 아닌 실제 인증 계약이 연결된 경우 로그인합니다.
2. `/materials`에서 목록/상세 route가 새로고침 후에도 유지되는지 확인합니다.
3. `/sessions/session-100` 계열 route에서 PDF 영역과 학습 패널이 겹치지 않는지 확인합니다.
4. chat/quiz/diagnosis는 BE 계약 연결 전까지 mock UI만 확인합니다.
5. 404 route는 client 화면으로 렌더링되고 asset 요청은 fallback되지 않아야 합니다.

## Cache/Fallback 확인

- HTML은 최신 배포가 빠르게 반영되도록 짧은 cache 또는 no-cache 정책을 사용합니다.
- hashed JS/CSS assets는 장기 cache를 사용할 수 있습니다.
- `/assets/*` 요청은 SPA fallback 대상에서 제외합니다.
- API 요청 path는 정적 fallback 대상에서 제외하고 Spring API로 향하게 합니다.
