import { Session } from '@/types'

const STORAGE_KEY = 'roleplay_re_sessions'
const MAX_SESSIONS = 50

export function getSessions(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return
  const sessions = getSessions()
  const updated = [session, ...sessions.filter(s => s.id !== session.id)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_SESSIONS)))
}

export function getSession(id: string): Session | undefined {
  return getSessions().find(s => s.id === id)
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
