import { vi } from 'vitest'

type ApiFixtureOverride = (
  request: Request,
) => Response | Promise<Response> | undefined

export function installApiFixtureServer(override?: ApiFixtureOverride) {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const request = new Request(input, init)
    const overriddenResponse = await override?.(request)
    if (overriddenResponse) return overriddenResponse

    const url = new URL(request.url)
    const path = `${url.pathname}${url.search}`

    if (request.method === 'POST' && path === '/api/auth/login') {
      const body = await request.clone().json()
      if (body.email === 'locked@example.com') {
        return apiFailure(
          'INVALID_CREDENTIALS',
          '이메일 또는 비밀번호를 확인하세요.',
          401,
        )
      }
      return apiSuccess({
        accessToken: 'access-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: {
          email: body.email,
          id: 1,
          name: 'learner',
          role: 'USER',
        },
      })
    }

    if (request.method === 'POST' && path === '/api/auth/refresh') {
      return apiFailure('TOKEN_INVALID', '유효하지 않은 인증 토큰입니다.', 401)
    }

    if (request.method === 'POST' && path === '/api/auth/logout') {
      return apiSuccess(null)
    }

    if (request.method === 'DELETE' && path === '/api/users/me') {
      const body = await request.clone().json()
      if (body.password === 'wrong-password-1') {
        return apiFailure('INVALID_CREDENTIALS', '비밀번호가 올바르지 않습니다.', 401)
      }
      return apiSuccess(null)
    }

    if (request.method === 'POST' && path === '/api/auth/signup') {
      const body = await request.clone().json()
      return apiSuccess({
        email: body.email,
        name: body.name,
        userId: 1,
      })
    }

    if (request.method === 'GET' && path === '/api/users/me') {
      return apiSuccess({
        email: 'learner@example.com',
        id: 1,
        name: 'learner',
        role: 'USER',
      })
    }

    if (
      request.method === 'GET' &&
      path === '/api/materials?page=0&size=20'
    ) {
      return apiSuccess(
        paged([
          {
            activeSessionId: 100,
            createdAt: '2026-07-22T00:00:00Z',
            fileSizeBytes: 12_480_000,
            materialId: 10,
            pageCount: 5,
            processingStatus: 'READY',
            title: '시험 대비 요약.pdf',
          },
          {
            createdAt: '2026-07-23T00:00:00Z',
            materialId: 11,
            processingStatus: 'PROCESSING',
            title: '강의 노트 5주차.pdf',
          },
          {
            createdAt: '2026-07-21T00:00:00Z',
            materialId: 12,
            processingStatus: 'FAILED',
            title: '스캔본 복습자료.pdf',
          },
        ]),
      )
    }

    if (request.method === 'POST' && path === '/api/materials') {
      const form = await request.clone().formData()
      return apiSuccess({
        createdAt: '2026-07-27T00:00:00Z',
        materialId: 13,
        processingStatus: 'PROCESSING',
        title: String(form.get('title')),
      })
    }

    if (request.method === 'DELETE' && path === '/api/materials/10') {
      return apiFailure(
        'MATERIAL_HAS_ACTIVE_SESSION',
        '진행 중인 세션이 있는 자료입니다.',
        409,
      )
    }

    if (request.method === 'DELETE' && path === '/api/materials/11') {
      return apiSuccess(null)
    }

    if (request.method === 'GET' && path === '/api/materials/999') {
      return apiFailure('MATERIAL_NOT_FOUND', '자료를 찾을 수 없습니다.', 404)
    }

    if (request.method === 'GET' && path === '/api/materials/10') {
      return apiSuccess({
        activeSessionId: 100,
        createdAt: '2026-07-22T00:00:00Z',
        fileSizeBytes: 12_480_000,
        materialId: 10,
        pageCount: 5,
        processingStatus: 'READY',
        title: '시험 대비 요약.pdf',
      })
    }

    if (request.method === 'GET' && path === '/api/materials/14') {
      return apiSuccess({
        createdAt: '2026-07-24T00:00:00Z',
        fileSizeBytes: 2_048_000,
        materialId: 14,
        pageCount: 8,
        processingStatus: 'READY',
        title: '새 학습 자료.pdf',
      })
    }

    if (
      request.method === 'GET' &&
      path === '/api/sessions?page=0&size=20'
    ) {
      return apiSuccess(
        paged([
          {
            currentPage: 1,
            materialId: 10,
            materialTitle: '시험 대비 요약.pdf',
            sessionId: 100,
            status: 'ACTIVE',
            updatedAt: '2026-07-27T00:00:00Z',
          },
          {
            currentPage: 5,
            materialId: 10,
            materialTitle: '시험 대비 요약.pdf',
            sessionId: 101,
            status: 'COMPLETED',
            updatedAt: '2026-07-26T00:00:00Z',
          },
        ]),
      )
    }

    if (request.method === 'POST' && path === '/api/sessions') {
      return apiSuccess({
        currentPage: 1,
        materialId: 10,
        pageStatus: 'NOT_EXPLAINED',
        sessionId: 102,
        status: 'ACTIVE',
        uiActions: [],
      })
    }

    if (
      request.method === 'GET' &&
      path === '/api/sessions/100/quizzes?page=0&size=20'
    ) {
      return apiSuccess(
        paged([
          {
            quizId: 50,
            quizType: 'MCQ',
            score: 48,
            status: 'SUBMITTED',
            title: '학습 확인 퀴즈',
          },
        ]),
      )
    }

    if (request.method === 'GET' && path === '/api/users/me/memory?materialId=10') {
      return apiSuccess({
        explanationPreferences: ['쉬운 예시 중심 설명 선호'],
        materialId: 10,
        memoryDigest: '수식 전개를 어려워하고 쉬운 예시를 선호함',
        preferredQuizTypes: ['MCQ'],
        strengths: ['평균 개념을 정확히 사용함'],
        updatedAt: '2026-07-27T00:00:00Z',
        weaknesses: ['수식 전개 과정 설명'],
      })
    }

    if (request.method === 'DELETE' && path === '/api/sessions/100') {
      return apiSuccess({ sessionId: 100, status: 'DELETED' })
    }

    if (request.method === 'GET' && path === '/api/sessions/999') {
      return apiFailure('SESSION_NOT_FOUND', '세션을 찾을 수 없습니다.', 404)
    }

    if (request.method === 'GET' && path === '/api/sessions/100') {
      return apiSuccess({
        currentPage: 1,
        materialId: 10,
        pageStatus: 'EXPLAINED',
        pendingDiagnosis: {
          diagnosisId: 42,
          prompt: '오답을 고른 이유와 헷갈린 개념을 적어 보세요.',
          quizScore: 48,
          sourceQuestion: '현재 페이지 핵심 개념',
        },
        sessionId: 100,
        status: 'ACTIVE',
        uiActions: [
          {
            content: '현재 페이지를 설명할까요?',
            noEvent: 'WAIT',
            type: 'BINARY_DECISION',
            yesEvent: 'EXPLAIN_CURRENT_PAGE',
          },
        ],
        updatedAt: '2026-07-27T00:00:00Z',
      })
    }

    if (
      request.method === 'GET' &&
      path === '/api/sessions/100/messages?page=0&size=50'
    ) {
      return apiSuccess(paged([]))
    }

    if (request.method === 'PATCH' && path === '/api/sessions/100/page') {
      const body = await request.clone().json()
      return apiSuccess({ currentPage: body.pageNumber, uiActions: [] })
    }

    if (request.method === 'POST' && path === '/api/sessions/100/turns') {
      const body = await request.clone().json()

      if (body.eventType === 'EXPLAIN_CURRENT_PAGE') {
        return apiSuccess({
          messages: [
            {
              content: '이 페이지는 핵심 개념의 정의를 다룹니다.',
              createdAt: '2026-07-27T00:00:00Z',
              messageId: 502,
              messageType: 'EXPLANATION',
              senderType: 'AI',
            },
          ],
          state: {},
          uiActions: [
            {
              content: '퀴즈를 진행할까요?',
              noEvent: 'MOVE_NEXT_PAGE',
              type: 'BINARY_DECISION',
              yesEvent: 'SHOW_QUIZ_TYPE_SELECT',
            },
          ],
        })
      }

      if (body.eventType === 'QUIZ_TYPE_SELECTED') {
        return apiSuccess({
          messages: [],
          state: { activeQuizId: 50 },
          uiActions: [],
        })
      }

      return apiSuccess({
        messages: [
          {
            content: '개념 정의와 적용 사례를 분리해서 정리해 보세요.',
            createdAt: '2026-07-27T00:00:00Z',
            messageId: 501,
            messageType: 'REPAIR',
            senderType: 'AI',
          },
        ],
        state: {},
        uiActions: [],
      })
    }

    if (request.method === 'POST' && path === '/api/sessions/100/complete') {
      return apiSuccess({
        currentPage: 5,
        materialId: 10,
        sessionId: 100,
        status: 'COMPLETED',
        updatedAt: '2026-07-27T00:00:00Z',
      })
    }

    if (request.method === 'GET' && path === '/api/quizzes/50') {
      return apiSuccess(quizFixture)
    }

    if (request.method === 'POST' && path === '/api/quizzes/50/submit') {
      return apiSuccess({
        gradingResult: {
          items: [
            {
              feedback: '채점이 완료되었습니다.',
              questionId: 'question-short',
            },
          ],
        },
        maxScore: 100,
        passed: false,
        quizId: 50,
        score: 48,
        submissionId: 200,
        uiActions: [{ diagnosisId: 42, type: 'DIAGNOSIS_QUESTION' }],
      })
    }

    return apiFailure('NOT_FOUND', `${request.method} ${path}`, 404)
  })
}

export function apiSuccess(data: unknown, status = 200): Response {
  return jsonResponse({ data, message: '요청이 성공했습니다.', success: true }, status)
}

export function apiFailure(
  code: string,
  message: string,
  status: number,
): Response {
  return jsonResponse(
    {
      error: { code, details: [], message },
      success: false,
    },
    status,
  )
}

function paged(items: unknown[]) {
  return {
    items,
    page: 0,
    size: 20,
    totalElements: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

const quizFixture = {
  questions: [
    {
      choices: [
        { id: 'mcq-a', label: '개념의 정의를 먼저 확인한다.' },
        { id: 'mcq-b', label: '본문 전체를 암기한다.' },
      ],
      id: 'question-mcq',
      kind: 'MCQ',
      prompt: '새 개념을 학습할 때 가장 먼저 확인할 정보는 무엇인가요?',
    },
    {
      choices: [
        { id: 'ox-o', label: 'O' },
        { id: 'ox-x', label: 'X' },
      ],
      id: 'question-ox',
      kind: 'OX',
      prompt: '학습 중 이해가 낮은 부분은 진단 흐름으로 이어질 수 있습니다.',
    },
    {
      id: 'question-short',
      kind: 'SHORT',
      prompt: '현재 페이지의 핵심 키워드를 한 단어로 적어 보세요.',
    },
    {
      id: 'question-essay',
      kind: 'ESSAY',
      prompt: '오늘 학습한 내용을 자신의 말로 설명해 보세요.',
    },
  ],
  quizId: 50,
  quizType: 'MCQ',
  sessionId: 100,
  submitted: false,
  title: '학습 확인 퀴즈',
}
