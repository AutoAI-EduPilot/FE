import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

import { useAuth } from '../../features/auth'
import { getRememberedClassroomId } from '../../features/classrooms'
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
  type SessionTurnResult,
  type UiActionEvent,
} from '../../features/sessions'
import {
  Button,
  ButtonLink,
  ErrorState,
  LoadingState,
} from '../../shared/ui'
import {
  classroomDetailPath,
  diagnosisPath,
  materialViewerPath,
  routes,
  sessionDetailPath,
} from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'
import { QuizWorkspace } from './QuizPage'

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

const DEFAULT_CHAT_PANEL_WIDTH = 660
const MIN_CHAT_PANEL_WIDTH = 360
const MIN_PDF_PANEL_WIDTH = 360
const PANEL_RESIZER_WIDTH = 6

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
  const [embeddedQuizId, setEmbeddedQuizId] = useState<string | null>(null)
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialFile, setMaterialFile] = useState<Blob | null | undefined>()
  const [materialFileError, setMaterialFileError] = useState<string | null>(null)
  const [chatPanelWidth, setChatPanelWidth] = useState<number | null>(null)
  const [chatPanelMaxWidth, setChatPanelMaxWidth] = useState(DEFAULT_CHAT_PANEL_WIDTH)
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(
    () => window.innerWidth >= 1536,
  )
  const [sessionsPastInitialChat, setSessionsPastInitialChat] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const chat = useSessionChat(sessionsRepository, sessionId ?? '')
  const classroomId = getRememberedClassroomId()
  const weekPagePath = classroomId
    ? classroomDetailPath(classroomId)
    : routes.classrooms

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

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace || typeof ResizeObserver === 'undefined') return

    const updatePanelBounds = () => {
      const nextMaximum = Math.max(
        MIN_CHAT_PANEL_WIDTH,
        workspace.clientWidth - MIN_PDF_PANEL_WIDTH - PANEL_RESIZER_WIDTH,
      )
      setChatPanelMaxWidth(nextMaximum)
      setChatPanelWidth((width) => width === null
        ? null
        : Math.min(nextMaximum, Math.max(MIN_CHAT_PANEL_WIDTH, width)))
    }

    updatePanelBounds()
    const observer = new ResizeObserver(updatePanelBounds)
    observer.observe(workspace)
    return () => observer.disconnect()
  }, [])

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

  function leaveInitialChatState() {
    setSessionsPastInitialChat((current) => {
      if (current.has(activeSession.id)) return current
      const next = new Set(current)
      next.add(activeSession.id)
      return next
    })
  }

  function applyTurnResult(result: SessionTurnResult) {
    const nextPage = result.currentPage === undefined
      ? undefined
      : movePage(result.currentPage, totalPages)
    if (nextPage !== undefined) setCurrentPage(nextPage)
    setSession((current) => current
      ? {
          ...current,
          activeQuizId: result.activeQuizId === undefined
            ? current.activeQuizId
            : result.activeQuizId ?? undefined,
          currentPage: nextPage ?? current.currentPage,
          pageStatus: result.pageStatus ?? current.pageStatus,
          pendingDiagnosis: result.pendingDiagnosis === undefined
            ? current.pendingDiagnosis
            : result.pendingDiagnosis ?? undefined,
          uiActions: result.uiActions,
        }
      : current)
  }

  async function handlePageMove(nextPage: number) {
    if (isActionPending) return
    leaveInitialChatState()
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
      applyTurnResult(result)
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
    leaveInitialChatState()
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
      setEmbeddedQuizId(result.activeQuizId)
    }
  }

  const availableUiActions = chat.streamUiActions.length > 0
    ? chat.streamUiActions
    : (activeSession.uiActions ?? [])
  const isInitialChatState = !chat.isLoadingHistory
    && !sessionsPastInitialChat.has(activeSession.id)
    && chat.messages.length === 0
  const visibleUiActions = availableUiActions.filter((action) => (
    isInitialChatState || !isInitialPageExplanationAction(action)
  ))

  function resizeChatPanel(clientX: number) {
    const workspace = workspaceRef.current
    if (!workspace) return
    const bounds = workspace.getBoundingClientRect()
    const nextMaximum = Math.max(
      MIN_CHAT_PANEL_WIDTH,
      bounds.width - MIN_PDF_PANEL_WIDTH - PANEL_RESIZER_WIDTH,
    )
    const nextWidth = bounds.right - clientX - PANEL_RESIZER_WIDTH / 2
    setChatPanelMaxWidth(nextMaximum)
    setChatPanelWidth(Math.min(nextMaximum, Math.max(MIN_CHAT_PANEL_WIDTH, nextWidth)))
  }

  function handleResizerPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeChatPanel(event.clientX)
  }

  function handleResizerPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    resizeChatPanel(event.clientX)
  }

  function handleResizerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const delta = event.key === 'ArrowLeft' ? 24 : -24
    setChatPanelWidth((width) => {
      const currentWidth = width ?? Math.max(
        MIN_CHAT_PANEL_WIDTH,
        ((workspaceRef.current?.clientWidth || DEFAULT_CHAT_PANEL_WIDTH * 2) - PANEL_RESIZER_WIDTH) / 2,
      )
      return Math.min(
        chatPanelMaxWidth,
        Math.max(MIN_CHAT_PANEL_WIDTH, currentWidth + delta),
      )
    })
  }

  return (
    <div className="h-full min-h-0">
      <h1 className="sr-only">학습 공간</h1>
      <p className="sr-only">
        {activeSession.materialTitle} 학습 화면입니다.
      </p>

      <section className="flex h-full min-h-0">
        {isResourcePanelOpen ? (
          <SessionResourcePanel
            activeMaterialId={activeSession.materialId}
            backLabel="주차 페이지로"
            backTo={weekPagePath}
            materials={materials}
            onClose={() => setIsResourcePanelOpen(false)}
            progressLabel={`${currentPage}/${totalPages}`}
            quizHistory={quizHistory}
            onOpenQuiz={setEmbeddedQuizId}
            resourcePath={(material) =>
              material.activeSessionId
                ? sessionDetailPath(material.activeSessionId)
                : materialViewerPath(material.id)
            }
          />
        ) : null}

        <div
          className="study-session-content h-full min-h-0 min-w-0 flex-1"
          ref={workspaceRef}
          style={chatPanelWidth === null
            ? undefined
            : { '--chat-panel-width': `${chatPanelWidth}px` } as CSSProperties}
        >
          <Suspense
            fallback={
              <div
                className="flex h-full min-h-0 items-center justify-center border-r border-stone-200 bg-white type-body text-stone-500"
                role="status"
              >
                PDF 뷰어를 준비하고 있습니다.
              </div>
            }
          >
            {embeddedQuizId ? (
              <QuizWorkspace
                embedded
                onBackToPdf={() => setEmbeddedQuizId(null)}
                quizId={embeddedQuizId}
              />
            ) : (
              <SessionPageViewer
                currentPage={currentPage}
                file={materialFile}
                fileError={materialFileError}
                isPending={isActionPending}
                materialTitle={activeSession.materialTitle}
                onMovePage={handlePageMove}
                onOpenResources={isResourcePanelOpen
                  ? undefined
                  : () => setIsResourcePanelOpen(true)}
                totalPages={totalPages}
              />
            )}
          </Suspense>

          <div
            aria-label="PDF와 AI 채팅 너비 조절"
            aria-orientation="vertical"
            aria-valuemax={Math.round(chatPanelMaxWidth)}
            aria-valuemin={MIN_CHAT_PANEL_WIDTH}
            aria-valuenow={chatPanelWidth === null ? undefined : Math.round(chatPanelWidth)}
            className="group hidden h-full cursor-col-resize touch-none items-center justify-center bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-600 lg:flex"
            onDoubleClick={() => setChatPanelWidth(null)}
            onKeyDown={handleResizerKeyDown}
            onPointerDown={handleResizerPointerDown}
            onPointerMove={handleResizerPointerMove}
            onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            role="separator"
            tabIndex={0}
            title="드래그하여 PDF와 채팅 너비 조절, 두 번 클릭하여 동일 너비로 복원"
          >
            <span className="h-full w-px bg-stone-200 transition-colors group-hover:bg-brand-400" />
          </div>

          <ChatPanel
            request={apiRequest}
            chat={chat}
            className="!rounded-none !border-0"
            currentPage={currentPage}
            footer={
              <div className="grid gap-2">
                {isSelectingQuizType ? (
                  <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
                    <p className="type-body font-semibold text-brand-950">
                      어떤 유형의 퀴즈를 풀까요?
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {QUIZ_TYPE_OPTIONS.map((option) => (
                        <Button
                          disabled={isActionPending || chat.isTurnPending}
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
                    actions={visibleUiActions}
                    disabled={isActionPending || chat.isTurnPending}
                    onEvent={(event) => void handleEvent(event)}
                    onOpenDiagnosis={(diagnosisId) =>
                      navigate(diagnosisPath(activeSession.id, diagnosisId))
                    }
                  />
                )}

                {activeSession.activeQuizId && !isSelectingQuizType && !embeddedQuizId ? (
                  <Button
                    onClick={() => setEmbeddedQuizId(activeSession.activeQuizId ?? null)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    진행 중인 퀴즈 풀기
                  </Button>
                ) : null}

                {error ? (
                  <p className="type-caption font-medium text-rose-700" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            }
            headerAction={activeSession.status === 'ACTIVE' ? (
              <Button
                disabled={isActionPending || chat.isTurnPending}
                onClick={() => {
                  if (window.confirm('학습을 완료 처리할까요?')) {
                    void handleEvent('COMPLETE_SESSION')
                  }
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                <CheckCircle2 aria-hidden="true" size={13} />
                학습 완료
              </Button>
            ) : undefined}
            onConversationStarted={leaveInitialChatState}
            onRequestQuiz={() => setIsSelectingQuizType(true)}
            onTurnCompleted={applyTurnResult}
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

function isInitialPageExplanationAction(action: { kind: string; yesEvent?: string }): boolean {
  return action.kind === 'BINARY_DECISION' && action.yesEvent === 'EXPLAIN_CURRENT_PAGE'
}
