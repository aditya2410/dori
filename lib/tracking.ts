'use client'

const SESSION_KEY = 'dori_session_id'

function generateSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateSessionId()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function track(event: string, meta?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const payload = {
    sessionId: getSessionId(),
    event,
    path: window.location.pathname,
    meta: meta ?? {},
  }
  // Fire-and-forget — never blocks the UI
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,   // survives navigation away
  }).catch(() => {})
}
