import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../features/auth'
import { ApiClientError, getRequestErrorMessage } from '../../shared/api'
import { ChatPanel, useSessionChat } from '../../features/chat'
import {
  createMaterialsRepository,
  type StudyMaterial,
} from '../../features/materials'
import type { QuizKind } from '../../features/quiz'
import {
  createSessionsRepository,
  movePage,
  SessionPageViewer,
  SessionResourcePanel,
  UiActionsRenderer,
  type LearningSession,
  type SessionQuizSummary,
  type UiActionEvent,
} from '../../features/sessions'
import {
  Badge,
  Button,
  ButtonLink,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../shared/ui'
import {
  diagnosisPath,
  materialDetailPath,
  quizDetailPath,
  routes,
} from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const QUIZ_TYPE_OPTIONS: Array<{ kind: QuizKind; label: string }> = [
  { kind: 'MCQ', label: '객관식' },
  { kind: 'OX', label: 'OX' },
  { kind: 'SHORT', label: '단답형' },
  { kind: 'ESSAY', label: '서술형' },
]

function quizKindLabel(quizType: string): string {
  return (
    QUIZ_TYPE_OPTIONS.find((option) => option.kind === quizType)?.label ??
    quizType
  )
}

export function SessionDetailPage() {
  usePageTitle('학습 공간')
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { apiRequest } = useAuth()
  const sessionsRepository = useMemo(
    () => createSessionsRepository(apiRequest),
    [apiRequest],
  )
  const materialsRepository = useMemo(
    () => createMaterialsRepository(apiRequest),
    [apiRequest],
  )
  const [session, setSession] = useState<
    LearningSession | null | undefined
  >(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionPending, setIsActionPending] = useState(false)
  const [isSelectingQuizType, setIsSelectingQuizType] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [quizHistory, setQuizHistory] = useState<SessionQuizSummary[]>([])
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const chat = useSessionChat(sessionsRepository, sessionId ?? '')

  useEffect(() => {
    const controller = new AbortController()
    materialsRepository
      .list(controller.signal)
      .then(setMaterials)
      .catch(() => {
        // 리소스 패널은 부가 정보 — 실패 시 조용히 생략
      })
    return () => controller.abort()
  }, [materialsRepository])

  useEffect(() => {
    if (!sessionId) return
    const controller = new AbortController()
    sessionsRepository
      .listQuizzes(sessionId, controller.signal)
      .then(setQuizHistory)
      .catch(() => {
        // 퀴즈 기록은 부가 정보 — 실패 시 조용히 생략
      })
    return () => controller.abort()
  }, [reloadKey, sessionId, sessionsRepository])

  useEffect(() => {
    if (!sessionId) return

    const controller = new AbortController()
    sessionsRepository
      .getById(sessionId, controller.signal)
      .then(async (nextSession) => {
        if (!nextSession) {
          setSession(null)
          return
        }

        let totalPages = nextSession.totalPages
        let materialTitle = nextSession.materialTitle
        if (!totalPages && nextSession.materialId) {
          const material = await materialsRepository.getById(
            nextSession.materialId,
            controller.signal,
          )
          totalPages = material?.pageCount
          materialTitle = material?.title ?? materialTitle
        }

        const hydratedSession = { ...nextSession, materialTitle, totalPages }
        setSession(hydratedSession)
        setCurrentPage(hydratedSession.currentPage)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getRequestErrorMessage(requestError))
          setSession(null)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [
    materialsRepository,
    reloadKey,
    sessionId,
    sessionsRepository,
  ])

  if (!sessionId) {
    return (
      <ErrorState
        title="세션을 찾을 수 없습니다."
        description="세션 식별자가 없습니다."
        action={<ButtonLink to={routes.sessions}>세션 목록으로</ButtonLink>}
      />
    )
  }

  if (isLoading) {
    return <LoadingState message="학습 세션을 불러오는 중입니다." />
  }

  if (!session) {
    return (
      <ErrorState
        title="세션을 찾을 수 없습니다."
        description={error ?? '세션 목록에서 다시 선택하세요.'}
        action={
          error ? (
            <Button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                setReloadKey((key) => key + 1)
              }}
              type="button"
            >
              다시 시도
            </Button>
          ) : (
            <ButtonLink to={routes.sessions}>세션 목록으로</ButtonLink>
          )
        }
      />
    )
  }

  const activeSession = session
  const totalPages = activeSession.totalPages ?? Math.max(activeSession.currentPage, 1)

  async function handlePageMove(nextPage: number) {
    if (isActionPending) return
    const nextSafePage = movePage(nextPage, totalPages)
    setIsActionPending(true)
    setError(null)
    try {
      const result = await sessionsRepository.movePage(
        activeSession.id,
        nextSafePage,
      )
      setCurrentPage(result.currentPage)
      setSession((current) =>
        current
          ? { ...current, currentPage: result.currentPage, uiActions: result.uiActions }
          : current,
      )
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setIsActionPending(false)
    }
  }

  async function runTurn(
    eventType: 'EXPLAIN_CURRENT_PAGE' | 'QUIZ_TYPE_SELECTED',
    payload: Record<string, unknown>,
  ) {
    if (isActionPending) return undefined
    setIsActionPending(true)
    setError(null)
    try {
      const result = await chat.submitTurn({
        eventType,
        payload,
        requestId: createTurnRequestId(),
      })
      setSession((current) =>
        current
          ? {
              ...current,
              activeQuizId: result.activeQuizId,
              pendingDiagnosis: result.pendingDiagnosis,
              uiActions: result.uiActions,
            }
          : current,
      )
      return result
    } catch (requestError) {
      if (
        requestError instanceof ApiClientError &&
        requestError.code === 'TURN_ALREADY_PROCESSED'
      ) {
        // 이미 처리된 턴 — 세션 상세 재조회로 서버 상태를 복원 (스펙 §6)
        setIsLoading(true)
        setReloadKey((key) => key + 1)
      } else {
        setError(getRequestErrorMessage(requestError))
      }
      return undefined
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleEvent(event: UiActionEvent) {
    switch (event) {
      case 'MOVE_NEXT_PAGE':
        await handlePageMove(currentPage + 1)
        return
      case 'EXPLAIN_CURRENT_PAGE':
        await runTurn('EXPLAIN_CURRENT_PAGE', { detailLevel: 'NORMAL' })
        return
      case 'SHOW_QUIZ_TYPE_SELECT':
        setIsSelectingQuizType(true)
        return
      case 'COMPLETE_SESSION': {
        if (isActionPending) return
        setIsActionPending(true)
        setError(null)
        try {
          await sessionsRepository.complete(activeSession.id)
          navigate(routes.sessions)
        } catch (requestError) {
          setError(getRequestErrorMessage(requestError))
        } finally {
          setIsActionPending(false)
        }
        return
      }
      case 'WAIT':
        setSession((current) =>
          current ? { ...current, uiActions: [] } : current,
        )
        return
    }
  }

  async function askAboutSelection(text: string) {
    const requestId = createTurnRequestId()
    const message = `"${text}"에 대해 설명해 줘`
    chat.appendLocalMessage({
      content: message,
      id: `user-${requestId}`,
      role: 'user',
      status: 'sent',
    })
    try {
      await chat.submitTurn({
        eventType: 'USER_QUESTION',
        payload: { message },
        requestId,
      })
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    }
  }

  async function handleQuizTypeSelected(kind: QuizKind) {
    const result = await runTurn('QUIZ_TYPE_SELECTED', { quizType: kind })
    if (!result) return
    setIsSelectingQuizType(false)
    if (result.activeQuizId) {
      navigate(quizDetailPath(result.activeQuizId))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Learning Session · ${activeSession.id}`}
        title="학습 공간"
        description={`${activeSession.materialTitle} 학습 화면입니다.`}
        actions={
          <>
            <Badge tone={activeSession.status === 'COMPLETED' ? 'success' : 'info'}>
              {activeSession.status === 'COMPLETED' ? '완료' : '진행 중'}
            </Badge>
            <Badge tone="neutral">
              {currentPage} / {totalPages}쪽
            </Badge>
            {activeSession.status === 'ACTIVE' ? (
              <Button
                disabled={isActionPending}
                onClick={() => {
                  if (window.confirm('학습을 완료 처리할까요?')) {
                    void handleEvent('COMPLETE_SESSION')
                  }
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                학습 완료
              </Button>
            ) : null}
          </>
        }
      />

      <section className="flex min-h-[calc(100vh-190px)] gap-4">
        <SessionResourcePanel
          activeMaterialId={activeSession.materialId}
          backLabel={activeSession.materialTitle}
          backTo={
            activeSession.materialId
              ? materialDetailPath(activeSession.materialId)
              : routes.materials
          }
          materialDetailPath={materialDetailPath}
          materials={materials}
          progressLabel={`${currentPage}/${totalPages}`}
        />

        <div className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-h-0 min-w-0 content-start gap-4">
          <SessionPageViewer
            currentPage={currentPage}
            isPending={isActionPending}
            materialTitle={activeSession.materialTitle}
            onAskAboutSelection={(text) => void askAboutSelection(text)}
            onMovePage={handlePageMove}
            totalPages={totalPages}
          />

          {quizHistory.length > 0 ? (
            <aside className="rounded-xl border border-stone-200 bg-white px-4 py-3">
              <h2 className="text-xs font-bold text-stone-500">퀴즈 기록</h2>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {quizHistory.map((quiz) => (
                  <li key={quiz.quizId}>
                    <Link
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      to={quizDetailPath(quiz.quizId)}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-stone-800">
                        {quiz.title}
                      </span>
                      <Badge tone="neutral">{quizKindLabel(quiz.quizType)}</Badge>
                      {quiz.score !== undefined ? (
                        <Badge tone={quiz.score >= 60 ? 'success' : 'warning'}>
                          {quiz.score}점
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>

        <ChatPanel
          chat={chat}
          currentPage={currentPage}
          footer={
            <div className="grid gap-2">
              {isSelectingQuizType ? (
                <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
                  <p className="text-sm font-semibold text-brand-950">
                    어떤 유형의 퀴즈를 풀까요?
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {QUIZ_TYPE_OPTIONS.map((option) => (
                      <Button
                        disabled={isActionPending}
                        key={option.kind}
                        onClick={() => void handleQuizTypeSelected(option.kind)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <UiActionsRenderer
                  actions={activeSession.uiActions ?? []}
                  disabled={isActionPending}
                  onEvent={(event) => void handleEvent(event)}
                  onOpenDiagnosis={(diagnosisId) =>
                    navigate(diagnosisPath(activeSession.id, diagnosisId))
                  }
                />
              )}

              {activeSession.activeQuizId && !isSelectingQuizType ? (
                <ButtonLink
                  size="sm"
                  to={quizDetailPath(activeSession.activeQuizId)}
                  variant="secondary"
                >
                  진행 중인 퀴즈 풀기
                </ButtonLink>
              ) : null}

              {error ? (
                <p className="text-xs font-medium text-rose-700" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          }
          onRequestQuiz={() => setIsSelectingQuizType(true)}
          sessionId={activeSession.id}
        />
        </div>
      </section>
    </div>
  )
}

function createTurnRequestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `turn-${Date.now()}`
}
