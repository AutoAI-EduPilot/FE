import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
  SessionResourcePanel,
  UiActionsRenderer,
  type LearningSession,
  type SessionQuizSummary,
  type UiActionEvent,
} from '../../features/sessions'
import {
  Button,
  ButtonLink,
  ErrorState,
  LoadingState,
} from '../../shared/ui'
import {
  diagnosisPath,
  materialDetailPath,
  quizDetailPath,
  routes,
  sessionDetailPath,
} from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

const SessionPageViewer = lazy(async () => {
  const module = await import('../../features/sessions/SessionPageViewer')
  return { default: module.SessionPageViewer }
})

const QUIZ_TYPE_OPTIONS: Array<{ kind: QuizKind; label: string }> = [
  { kind: 'MCQ', label: '객관식' },
  { kind: 'OX', label: 'OX' },
  { kind: 'SHORT', label: '단답형' },
  { kind: 'ESSAY', label: '서술형' },
]

export function SessionDetailPage() {
  usePageTitle('학습 공간')
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { apiRequest, rawApiRequest } = useAuth()
  const sessionsRepository = useMemo(
    () => createSessionsRepository(apiRequest, rawApiRequest),
    [apiRequest, rawApiRequest],
  )
  const materialsRepository = useMemo(
    () => createMaterialsRepository(apiRequest, rawApiRequest),
    [apiRequest, rawApiRequest],
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
  const [materialFile, setMaterialFile] = useState<Blob | null | undefined>()
  const [materialFileError, setMaterialFileError] = useState<string | null>(null)
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

  useEffect(() => {
    const materialId = session?.materialId
    const controller = new AbortController()

    const loadMaterialFile = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return

      if (!materialId) {
        setMaterialFile(null)
        setMaterialFileError(null)
        return
      }

      setMaterialFile(undefined)
      setMaterialFileError(null)
      try {
        setMaterialFile(
          await materialsRepository.getFile(materialId, controller.signal),
        )
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          setMaterialFile(null)
          setMaterialFileError(getRequestErrorMessage(requestError))
        }
      }
    }

    void loadMaterialFile()
    return () => controller.abort()
  }, [materialsRepository, session?.materialId])

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

  async function handleQuizTypeSelected(kind: QuizKind) {
    const result = await runTurn('QUIZ_TYPE_SELECTED', { quizType: kind })
    if (!result) return
    setIsSelectingQuizType(false)
    if (result.activeQuizId) {
      navigate(quizDetailPath(result.activeQuizId))
    }
  }

  return (
    <div className="h-full min-h-0">
      <h1 className="sr-only">학습 공간</h1>
      <p className="sr-only">
        {activeSession.materialTitle} 학습 화면입니다.
      </p>

      <section className="flex h-full min-h-0">
        <SessionResourcePanel
          activeMaterialId={activeSession.materialId}
          backLabel="내 자료로"
          backTo={
            activeSession.materialId
              ? materialDetailPath(activeSession.materialId)
              : routes.materials
          }
          materials={materials}
          progressLabel={`${currentPage}/${totalPages}`}
          quizDetailPath={quizDetailPath}
          quizHistory={quizHistory}
          resourcePath={(material) =>
            material.activeSessionId
              ? sessionDetailPath(material.activeSessionId)
              : materialDetailPath(material.id)
          }
        />

        <div className="grid h-full min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:grid-rows-1">
          <Suspense
            fallback={
              <div
                className="flex h-full min-h-0 items-center justify-center border-r border-stone-200 bg-white text-sm text-stone-500"
                role="status"
              >
                PDF 뷰어를 준비하고 있습니다.
              </div>
            }
          >
            <SessionPageViewer
              currentPage={currentPage}
              file={materialFile}
              fileError={materialFileError}
              isPending={isActionPending}
              materialTitle={activeSession.materialTitle}
              onMovePage={handlePageMove}
              totalPages={totalPages}
            />
          </Suspense>

          <ChatPanel
            chat={chat}
            className="rounded-none border-y-0 border-r-0"
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
                    actions={
                      chat.streamUiActions.length > 0
                        ? chat.streamUiActions
                        : (activeSession.uiActions ?? [])
                    }
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
