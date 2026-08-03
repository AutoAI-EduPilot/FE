import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { useAuth } from '../features/auth'
import {
  createClassroomsRepository,
  getRememberedClassroomId,
  rememberClassroomId,
} from '../features/classrooms'
import { createExamsRepository } from '../features/exams'
import { createReportsRepository } from '../features/reports'
import { getRequestErrorMessage } from '../shared/api'
import { isApiCapabilityEnabled } from '../shared/config/capabilities'
import { ButtonLink, ErrorState, LoadingState } from '../shared/ui'
import {
  classroomAnalyticsPath,
  classroomAnnouncementsPath,
  classroomEditPath,
  classroomEntranceRequestsPath,
  classroomExamDetailPath,
  classroomExamsPath,
  classroomReportDetailPath,
  routes,
} from './routes'

type ClassroomDestination = 'analytics' | 'announcements' | 'entrance-requests' | 'exams'

export function LegacyClassroomRouteRedirect({ destination }: { destination: ClassroomDestination }) {
  const { apiRequest } = useAuth()
  const [searchParams] = useSearchParams()
  const repository = useMemo(() => createClassroomsRepository(apiRequest), [apiRequest])
  const [classroomId, setClassroomId] = useState(() => searchParams.get('classroomId') ?? getRememberedClassroomId())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (classroomId) return
    const controller = new AbortController()
    repository.list('', controller.signal)
      .then((items) => setClassroomId(items[0]?.id ?? ''))
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getRequestErrorMessage(requestError))
      })
    return () => controller.abort()
  }, [classroomId, repository])

  useEffect(() => {
    if (classroomId) rememberClassroomId(classroomId)
  }, [classroomId])

  if (error) return <ErrorState action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>} description={error} title="강의실을 확인하지 못했습니다" />
  if (classroomId === '') return <ErrorState action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>} description="먼저 사용할 강의실을 만들어 주세요." title="선택할 강의실이 없습니다" />
  if (!classroomId) return <LoadingState message="최근 강의실로 이동하는 중입니다." />

  const target = getDestinationPath(destination, classroomId)
  const nextSearch = new URLSearchParams(searchParams)
  nextSearch.delete('classroomId')
  const query = nextSearch.toString()
  return <Navigate replace to={`${target}${query ? `?${query}` : ''}`} />
}

export function LegacyClassroomSettingsRedirect() {
  const { classroomId = '' } = useParams()
  useEffect(() => {
    if (classroomId) rememberClassroomId(classroomId)
  }, [classroomId])
  if (!classroomId) return <Navigate replace to={routes.classrooms} />
  return <Navigate replace to={classroomEditPath(classroomId)} />
}

export function LegacyExamDetailRedirect() {
  const { apiRequest } = useAuth()
  const { examId = '' } = useParams()
  const repository = useMemo(() => createExamsRepository(apiRequest), [apiRequest])
  const [classroomId, setClassroomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) return
    const controller = new AbortController()
    repository.get(examId, controller.signal)
      .then((exam) => setClassroomId(exam.classroomId))
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getRequestErrorMessage(requestError))
      })
    return () => controller.abort()
  }, [examId, repository])

  useEffect(() => {
    if (classroomId) rememberClassroomId(classroomId)
  }, [classroomId])

  if (!examId) return <Navigate replace to={routes.classrooms} />
  if (error) return <ErrorState action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>} description={error} title="시험 경로를 복원하지 못했습니다" />
  if (!classroomId) return <LoadingState message="시험이 속한 강의실을 확인하는 중입니다." />
  return <Navigate replace to={classroomExamDetailPath(classroomId, examId)} />
}

export function LegacyReportDetailRedirect() {
  const { apiRequest } = useAuth()
  const { reportId = '' } = useParams()
  const repository = useMemo(() => createReportsRepository(apiRequest), [apiRequest])
  const [target, setTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId || !isApiCapabilityEnabled('reports')) return
    const controller = new AbortController()
    repository.getReport(reportId, controller.signal)
      .then((report) => {
        if (!report.classroomId || !report.studentId) {
          throw new Error('리포트의 강의실 또는 학습자 정보가 없습니다.')
        }
        rememberClassroomId(report.classroomId)
        setTarget(classroomReportDetailPath(report.classroomId, report.studentId, report.reportId))
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(getRequestErrorMessage(requestError))
      })
    return () => controller.abort()
  }, [reportId, repository])

  if (!isApiCapabilityEnabled('reports')) {
    return <ErrorState action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>} description="리포트 API가 배포되면 기존 링크를 새 강의실 경로로 복원할 수 있습니다." title="리포트 API 준비 중" />
  }
  if (!reportId) return <Navigate replace to={routes.classrooms} />
  if (error) return <ErrorState action={<ButtonLink to={routes.classrooms}>내 강의실로</ButtonLink>} description={error} title="리포트 경로를 복원하지 못했습니다" />
  if (!target) return <LoadingState message="리포트가 속한 강의실을 확인하는 중입니다." />
  return <Navigate replace to={target} />
}

function getDestinationPath(destination: ClassroomDestination, classroomId: string): string {
  if (destination === 'analytics') return classroomAnalyticsPath(classroomId)
  if (destination === 'announcements') return classroomAnnouncementsPath(classroomId)
  if (destination === 'entrance-requests') return classroomEntranceRequestsPath(classroomId)
  return classroomExamsPath(classroomId)
}
