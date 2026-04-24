import type { GameSlug } from './types'

const API_URL = import.meta.env.VITE_API_URL || ''
const SCHEMA_VERSION = 1
const SESSION_TTL_MS = 30 * 60 * 1000

type EventType = 'card_viewed' | 'guess_submitted' | 'share_clicked'

type PropValue = string | number | boolean | null
type EventProps = Record<string, PropValue>

interface AnalyticsEvent {
  schema_version: number
  event_id: string
  ts: string
  session_id: string
  anon_user_id: string
  game: GameSlug
  puzzle_number: number
  event_type: EventType
  props?: EventProps
}

interface SessionRecord {
  id: string
  lastActiveAt: number
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getAnonUserId(): string {
  const key = 'gg-anon-user-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = uuid()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return uuid()
  }
}

function getSessionId(): string {
  const key = 'gg-session'
  const now = Date.now()
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed: SessionRecord = JSON.parse(raw)
      if (parsed.id && now - parsed.lastActiveAt < SESSION_TTL_MS) {
        const next: SessionRecord = { id: parsed.id, lastActiveAt: now }
        localStorage.setItem(key, JSON.stringify(next))
        return parsed.id
      }
    }
    const fresh: SessionRecord = { id: uuid(), lastActiveAt: now }
    localStorage.setItem(key, JSON.stringify(fresh))
    return fresh.id
  } catch {
    return uuid()
  }
}

export function track(
  eventType: EventType,
  context: { game: GameSlug; puzzleNumber: number },
  props?: EventProps,
): void {
  try {
    const event: AnalyticsEvent = {
      schema_version: SCHEMA_VERSION,
      event_id: uuid(),
      ts: new Date().toISOString(),
      session_id: getSessionId(),
      anon_user_id: getAnonUserId(),
      game: context.game,
      puzzle_number: context.puzzleNumber,
      event_type: eventType,
      ...(props ? { props } : {}),
    }
    const blob = new Blob([JSON.stringify(event)], { type: 'text/plain' })
    fetch(`${API_URL}/daily/event`, {
      method: 'POST',
      body: blob,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // analytics must never break the app
  }
}
