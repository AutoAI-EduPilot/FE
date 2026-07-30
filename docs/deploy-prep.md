# FE Static Deploy Prep

이 문서는 EduPilot FE를 정적 호스팅에 올리기 전 확인할 항목을 정리합니다. 실제 dev 배포는 BE/infra 환경 준비가 끝난 뒤 진행합니다.

## 환경 변수

| 이름 | 필수 | 예시 | 설명 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 예 | `https://api.example.com` | Spring Main Service base URL |

- 브라우저의 모든 서버 호출은 Spring Main Service를 향합니다.
- FastAPI 내부 endpoint URL을 FE 환경 변수로 추가하지 않습니다.
- `.env`, `.env.local`, 인증키, 로그 파일은 커밋하거나 업로드하지 않습니다.

## Build 산출물 확인

```bash
npm run build
Get-ChildItem dist
Get-ChildItem dist\assets
```

확인 항목:

- `dist/index.html`이 생성되어 있습니다.
- `dist/assets/` 아래에 CSS/JS asset이 생성되어 있습니다.
- `dist/`는 `.gitignore` 대상이며 커밋하지 않습니다.
- build 전 `npm run lint`, `npm run typecheck`, `npm run test:run`을 통과합니다.

## SPA Fallback 체크리스트

정적 호스팅 설정에서 HTML5 history route가 `/index.html`로 fallback되어야 합니다.

- `/`
- `/login`
- `/signup`
- `/materials`
- `/materials/sample`
- `/sessions`
- `/sessions/sample`
- `/quizzes/sample`
- `/sessions/sample/diagnosis/sample`
- 존재하지 않는 route

확인 항목:

- 새로고침 또는 직접 진입 시 404 대신 앱이 로드됩니다.
- 정적 asset 요청은 fallback 대상이 아니며 정상 asset으로 응답합니다.
- 앱 내부 404 화면은 client route에서만 렌더링됩니다.

## Preview/Production 환경 기준

| 환경 | 목적 | 필수 확인 |
| --- | --- | --- |
| preview | PR 단위 FE 확인 | SPA fallback, env 주입, 주요 route 직접 진입 |
| production | 운영 배포 | BE CORS allowlist, Spring API URL, health/CORS smoke |

자세한 smoke 절차는 `docs/deploy-smoke.md`를 따릅니다.

## 배포 전 보류 사항

- Related to AutoAI-EduPilot/BE#46
- Spring API base URL, CORS, cookie credential 정책이 dev 환경에서 확정되어야 합니다.
- FE 배포 도메인이 BE CORS allowlist에 포함되어야 합니다.
- health/CORS smoke는 BE#8 완료 후 수행합니다.
