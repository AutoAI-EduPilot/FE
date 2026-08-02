import { useCallback, useEffect, useState } from 'react'
import type { AuthenticatedRequest } from '../auth'

export type CalendarEventKind = 'MATERIAL' | 'NOTICE' | 'PERSONAL'

export interface CalendarEvent {
  createdAt: string
  endsAt?: string
  hasTime?: boolean
  id: string
  kind: CalendarEventKind
  startsAt: string
  title: string
  source?: 'local' | 'remote'
}

export interface CreateCalendarEventInput {
  endsAt?: string
  hasTime?: boolean
  kind: CalendarEventKind
  startsAt: string
  title: string
}

const STORAGE_PREFIX = 'edupilot.calendar.events.v1'
const EVENTS_CHANGED = 'edupilot:calendar-events-changed'
const EVENT_KINDS: CalendarEventKind[] = ['MATERIAL', 'NOTICE', 'PERSONAL']

interface ScheduleDto {
  classroomName: string
  dateTime: string
  scheduleId: string
  title: string
  type: 'NOTICE_PUBLISH' | 'WEEK_RELEASE'
}

export function useCalendarEvents(
  ownerKey: string | number | undefined,
  request?: AuthenticatedRequest,
) {
  const storageKey = getStorageKey(ownerKey)
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    readEvents(storageKey),
  )
  const [remoteEvents, setRemoteEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    const refresh = (event?: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail !== storageKey
      ) {
        return
      }
      if (event instanceof StorageEvent && event.key !== storageKey) return
      setEvents(readEvents(storageKey))
    }

    refresh()
    window.addEventListener(EVENTS_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENTS_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [storageKey])

  useEffect(() => {
    if (!request || !ownerKey) return
    const controller = new AbortController()
    const from = new Date(); from.setMonth(from.getMonth() - 6)
    const to = new Date(); to.setMonth(to.getMonth() + 12)
    const format = (date: Date) => date.toISOString().slice(0, 10)
    const query = new URLSearchParams({ from: format(from), to: format(to) })
    request<{ items: ScheduleDto[] }>(`/api/users/me/schedule?${query}`, { signal: controller.signal })
      .then(({ data }) => setRemoteEvents(data.items.map((item) => ({
        createdAt: item.dateTime,
        id: `remote-${item.scheduleId}`,
        kind: item.type === 'NOTICE_PUBLISH' ? 'NOTICE' : 'MATERIAL',
        source: 'remote',
        hasTime: true,
        startsAt: item.dateTime,
        title: `${item.classroomName} · ${item.title}`,
      }))))
      .catch(() => undefined)
    return () => controller.abort()
  }, [ownerKey, request])

  const addEvent = useCallback(
    (input: CreateCalendarEventInput) => {
      const event: CalendarEvent = {
        createdAt: new Date().toISOString(),
        id: createEventId(),
        kind: input.kind,
        endsAt: input.endsAt,
        hasTime: input.hasTime,
        source: 'local',
        startsAt: input.startsAt,
        title: input.title.trim(),
      }
      writeEvents(storageKey, [...readEvents(storageKey), event])
      notifyChanged(storageKey)
      return event
    },
    [storageKey],
  )

  const removeEvent = useCallback(
    (eventId: string) => {
      writeEvents(
        storageKey,
        readEvents(storageKey).filter((event) => event.id !== eventId),
      )
      notifyChanged(storageKey)
    },
    [storageKey],
  )

  return { addEvent, events: [...events, ...remoteEvents].sort(compareEvents), removeEvent }
}

export function getCalendarEventKindLabel(kind: CalendarEventKind): string {
  switch (kind) {
    case 'MATERIAL':
      return '자료 공개'
    case 'NOTICE':
      return '공지'
    case 'PERSONAL':
      return '개인 일정'
  }
}

function getStorageKey(ownerKey: string | number | undefined): string {
  const normalizedOwner = String(ownerKey ?? 'current-user').replace(
    /[^a-zA-Z0-9_-]/g,
    '_',
  )
  return `${STORAGE_PREFIX}.${normalizedOwner}`
}

function readEvents(storageKey: string): CalendarEvent[] {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCalendarEvent).sort(compareEvents)
  } catch {
    return []
  }
}

function writeEvents(storageKey: string, events: CalendarEvent[]) {
  if (events.length === 0) {
    window.localStorage.removeItem(storageKey)
    return
  }
  window.localStorage.setItem(
    storageKey,
    JSON.stringify([...events].sort(compareEvents)),
  )
}

function notifyChanged(storageKey: string) {
  window.dispatchEvent(new CustomEvent(EVENTS_CHANGED, { detail: storageKey }))
}

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<CalendarEvent>
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.startsAt === 'string' &&
    !Number.isNaN(new Date(event.startsAt).getTime()) &&
    typeof event.createdAt === 'string' &&
    (event.endsAt === undefined || (typeof event.endsAt === 'string' && !Number.isNaN(new Date(event.endsAt).getTime()))) &&
    (event.hasTime === undefined || typeof event.hasTime === 'boolean') &&
    EVENT_KINDS.includes(event.kind as CalendarEventKind)
  )
}

function compareEvents(left: CalendarEvent, right: CalendarEvent): number {
  return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
}

function createEventId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `calendar-${Date.now()}`
}
