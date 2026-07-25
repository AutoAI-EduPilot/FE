# EduPilot Frontend

EduPilot의 React 프론트엔드입니다. 브라우저에서 호출하는 서버는 Spring Main Service 하나이며 FastAPI AI Service를 직접 호출하지 않습니다.

## 기술 스택

- React 19.1.1
- TypeScript 5.6
- Vite 7.3.6
- React Router DOM 7.18.1
- Tailwind CSS 4.1.13
- Vitest + React Testing Library
- Node.js 22.12 이상 (CI: Node.js 24)
- npm

## 시작하기

```bash
npm install
copy .env.example .env.local
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

## 환경 변수

| 이름 | 예시 | 설명 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Spring Main Service의 base URL |

저장소에는 가짜 값만 포함된 `.env.example`을 커밋합니다. 토큰과 비밀값이 있는 로컬 환경 파일은 커밋하지 않습니다.

## 프로젝트 구조

```text
src/
├─ app/             # 앱 진입, 라우팅, 레이아웃, route placeholder 화면
├─ shared/
│  ├─ api/          # 공통 응답 계약, 오류, Spring API client
│  ├─ config/       # 환경 변수 검증
│  └─ ui/           # 공통 UI 컴포넌트
└─ test/            # 테스트 공통 설정
```

기능별 `features/` 구조는 실제 기능 Epic에서 필요한 시점에 추가합니다.

## 앱 셸과 라우팅

FE#1 범위에서는 후속 기능 이슈가 연결할 기본 route와 화면 골격만 제공합니다.

| Route | 목적 |
| --- | --- |
| `/` | `/materials`로 이동 |
| `/login` | 로그인 화면 골격 |
| `/signup` | 회원가입 화면 골격 |
| `/materials` | 자료 목록·업로드 진입 placeholder |
| `/materials/:materialId` | 자료 상세 placeholder |
| `/sessions` | 세션 목록·재진입 placeholder |
| `/sessions/:sessionId` | PDF 뷰어·학습 채팅 placeholder |
| `/quizzes/:quizId` | 퀴즈 풀이·결과 placeholder |
| `/sessions/:sessionId/diagnosis/:diagnosisId` | 진단·교정 placeholder |

공통 UI는 Tailwind 기반 자체 컴포넌트(`Button`, `TextInput`, `Badge`, `PageHeader`, `EmptyState`, `LoadingState`, `ErrorState`)만 사용합니다. 실제 인증·자료·세션·퀴즈·진단 API 호출은 각 기능 Epic에서 연결합니다.

## API 호출 원칙

- 모든 브라우저 요청은 `VITE_API_BASE_URL`에 설정한 Spring Main Service로 보냅니다.
- `apiRequest`는 `/api/...` 형태의 상대 경로만 허용합니다. 절대 URL이나 FastAPI URL을 직접 전달할 수 없습니다.
- 요청에는 기본적으로 `credentials: include`를 적용합니다.
- access token이 필요한 기능은 `accessToken` 옵션을 명시적으로 전달합니다. 저장과 갱신은 인증 Epic의 책임입니다.
- 성공 응답은 `ApiSuccess<T>`로 반환하고 실패 응답은 `ApiClientError`로 정규화합니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

GitHub Actions의 `frontend-ci`가 `main`·`develop` 대상 PR과 `develop` push에서 동일한 검증을 실행합니다.

## 정적 배포 준비

정적 배포 전 점검 절차는 [docs/deploy-prep.md](docs/deploy-prep.md)에 정리합니다. 배포 후 smoke 절차는 [docs/deploy-smoke.md](docs/deploy-smoke.md)를 따릅니다.

- `npm run build`로 `dist/` 산출물을 생성하고 `dist/index.html`, `dist/assets/*`가 있는지 확인합니다.
- `dist/`는 배포 산출물이며 저장소에 커밋하지 않습니다.
- 운영/개발 배포 환경에는 `VITE_API_BASE_URL`만 주입하고 `.env`, 인증키, 로그 파일은 업로드하지 않습니다.
- SPA fallback은 `/materials`, `/sessions/:sessionId`, `/quizzes/:quizId` 같은 client route가 새로고침에서 `/index.html`로 복구되는지 확인합니다.
- 실제 dev 배포는 BE #46과 infra 환경 준비 후 진행합니다.

## Health/CORS 연동 확인

[BE #8](https://github.com/AutoAI-EduPilot/BE/issues/8)에서 health endpoint와 CORS 설정이 구현된 후 다음을 확인합니다.

1. Spring local 프로파일을 `http://localhost:8080`에서 실행합니다.
2. 허용 origin에 `http://localhost:5173`이 포함됐는지 확인합니다.
3. FE 개발 서버에서 확정된 health endpoint를 호출합니다.
4. 성공 envelope와 credential 포함 CORS 요청이 브라우저에서 정상 처리되는지 확인합니다.

BE #8이 완료되기 전에는 실제 health/CORS 연동이 확인됐다고 표시하지 않습니다.

## 현재 범위에서 제외

- 인증 화면과 access/refresh token 수명주기
- 학습 기능 화면
- SSE 스트리밍
- FastAPI 직접 호출
