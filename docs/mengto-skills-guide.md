# MengTo/Skills 적용 가이드

이 문서는 [MengTo/Skills](https://github.com/MengTo/Skills)의 agent skill 중 EduPilot FE 작업에 맞는 것만 선별해 사용하는 기준을 정리합니다.

- 기준 원본: `MengTo/Skills` clone의 `21b278c`
- 적용 방식: 원본 skill 폴더를 복사하지 않고, 작업 전에 필요한 원본 `SKILL.md`를 읽어 프로젝트 규칙으로 해석합니다.
- 기본 디자인 방향: 운영형 SaaS 학습 도구입니다. 반복 사용, 명확한 상태, 빠른 스캔, 낮은 시각 피로를 우선합니다.

## 기본 사용 규칙

- 한 작업에는 기본 1-3개 skill만 고릅니다.
- 원본 skill 내용은 그대로 붙여 넣지 않습니다. 출처와 추천 경로만 기록합니다.
- 구현 전에는 이 문서 요약만 보지 말고 해당 원본 `SKILL.md`를 직접 읽습니다.
- 강한 장식, 과한 WebGL, 마케팅식 hero 구성은 사용자가 명시적으로 요청할 때만 적용합니다.
- EduPilot FE의 서버 호출 경계는 항상 Spring Main Service 하나로 유지합니다.

## Core Skills

| Skill | 원본 경로 | 사용 시점 |
| --- | --- | --- |
| Design-first UI prompting | `agent-skills/ui/design-first-ui-prompting/SKILL.md` | 새 화면이나 큰 UI 흐름을 만들기 전 목표, 레이아웃, 상태, 제약을 정리할 때 |
| Tailwind CSS | `agent-skills/web-design/tailwindcss/SKILL.md` | Tailwind 기반 레이아웃, 반응형, 컴포넌트 스타일을 정리할 때 |
| Product-proof SaaS | `agent-skills/web-design/product-proof-saas/SKILL.md` | 실제 제품 흐름이 증거가 되는 SaaS 화면을 만들 때 |
| Audit verify explain | `agent-skills/codex/audit-verify-explain-grade-5/SKILL.md` | 구현 후 검증 결과를 근거 중심으로 정리할 때 |
| Stitched full-page capture | `agent-skills/codex/stitched-full-page-capture/SKILL.md` | 주요 route의 전체 화면 QA 캡처가 필요할 때 |

## Feature-Specific Skills

| Skill | 원본 경로 | 사용 시점 |
| --- | --- | --- |
| Operational enterprise AI | `agent-skills/web-design/operational-enterprise-ai/SKILL.md` | API 경계, 승인 상태, 감사 가능성, 예외/재시도 UI가 필요한 화면 |
| Thinking orbs | `agent-skills/web-design/thinking-orbs/SKILL.md` | 채팅, 진단, 생성, 분석처럼 AI 작업 상태를 표시할 때 |
| Animation systems | `agent-skills/web-design/animation-systems/SKILL.md` | hover, transition, loading motion을 절제된 제품 motion으로 정리할 때 |
| Scroll progress timeline | `agent-skills/web-design/scroll-progress-timeline/SKILL.md` | 세션 진행, 퀴즈 단계, 진단 흐름 같은 순차 상태를 보여줄 때 |
| Optimize web animations | `agent-skills/codex/optimize-web-animations/SKILL.md` | 장시간 학습 화면, 채팅, animation 성능을 점검할 때 |

## Conditional Skills

| Skill | 원본 경로 | 사용 조건 |
| --- | --- | --- |
| Landing page | `agent-skills/web-design/landing-page/SKILL.md` | EduPilot 공개 소개/전환 페이지를 만들 때만 사용 |
| Pricing page | `agent-skills/web-design/pricing-page/SKILL.md` | 요금제/구독 페이지가 생길 때만 사용 |
| Unsplash asset images | `agent-skills/media/unsplash-asset-images/SKILL.md` | 마케팅, 데모, 빈 상태 이미지가 필요할 때만 사용 |

## Route별 추천 매핑

| Route/영역 | 추천 skill | 적용 기준 |
| --- | --- | --- |
| Auth (`/login`, `/signup`) | `design-first-ui-prompting`, `tailwindcss` | 빠른 입력, 명확한 오류, protected route 복귀 흐름을 우선합니다. |
| Materials (`/materials`, `/materials/:materialId`) | `product-proof-saas`, `tailwindcss` | 업로드, 처리 상태, 삭제/충돌 안내를 제품 흐름 중심으로 보여줍니다. |
| Session/PDF/Chat (`/sessions`, `/sessions/:sessionId`) | `thinking-orbs`, `animation-systems`, `optimize-web-animations` | 학습 중 상태 변화, AI 응답 생성, 장시간 사용 성능을 우선합니다. |
| Quiz/Diagnosis (`/quizzes/:quizId`, `/sessions/:sessionId/diagnosis/:diagnosisId`) | `scroll-progress-timeline`, `thinking-orbs` | 문항 진행, 제출 잠금, 저득점 진단, 교정 흐름을 단계적으로 보여줍니다. |
| Deploy/QA | `audit-verify-explain-grade-5`, `stitched-full-page-capture` | route별 화면 검증, 배포 smoke, 근거 기반 완료 보고에 사용합니다. |

## 기본 제외 항목

- `agent-skills/game-development/*`: 현재 FE 학습 SaaS 범위 밖입니다.
- `agent-skills/customer-support/*`: 고객지원 운영 자동화 범위 밖입니다.
- 강한 WebGL, 시네마틱, 브루탈리즘, 과한 glass/laser 계열 web-design skill: 운영형 학습 UI와 충돌할 수 있어 명시 요청 시만 사용합니다.

## PR에 남길 기록

PR 설명에는 이번 작업에서 실제로 읽고 참고한 skill만 적습니다.

```text
MengTo skills:
- agent-skills/web-design/tailwindcss/SKILL.md
- agent-skills/web-design/product-proof-saas/SKILL.md
```

참고하지 않은 skill을 관성적으로 적지 않습니다.
