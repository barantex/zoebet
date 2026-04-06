import { readJson, writeJson } from './storage'
import type { SupportMessage, SupportThread } from './types'

const THREADS_KEY = 'zoe.support.threads'
const QUICK_PREFIX = 'zoe.support.quickReplies.'

function nowIso() {
  return new Date().toISOString()
}

function nowTime() {
  return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function readThreads(): SupportThread[] {
  return readJson<SupportThread[]>(THREADS_KEY, [])
}

export function writeThreads(next: SupportThread[]): void {
  writeJson(THREADS_KEY, next)
}

export function ensureThread(userId: string, userEmail: string): SupportThread {
  const threads = readThreads()
  const existing = threads.find((t) => t.userId === userId)
  if (existing) return existing

  const thread: SupportThread = {
    id: uid('th'),
    userId,
    userEmail,
    status: 'open',
    messages: [
      {
        id: uid('msg'),
        from: 'agent',
        agentName: 'Zoe Destek',
        text: 'Merhaba! BahisMosco canlı destek hattına hoş geldiniz.',
        at: nowTime(),
        createdAt: nowIso(),
      },
    ],
    updatedAt: nowIso(),
  }

  writeThreads([thread, ...threads])
  return thread
}

export function addMessage(
  userId: string,
  userEmail: string,
  from: 'user' | 'agent',
  text: string,
  agentName?: string,
) {
  const threads = readThreads()
  const thread = threads.find((t) => t.userId === userId)
  const message: SupportMessage = {
    id: uid('msg'),
    from,
    agentName,
    text,
    at: nowTime(),
    createdAt: nowIso(),
  }

  if (!thread) {
    const next: SupportThread = {
      id: uid('th'),
      userId,
      userEmail,
      status: 'open',
      messages: [message],
      updatedAt: nowIso(),
    }
    writeThreads([next, ...threads])
    return next
  }

  const updated: SupportThread = {
    ...thread,
    messages: [...thread.messages, message],
    updatedAt: nowIso(),
    status: from === 'user' ? 'open' : thread.status,
  }

  const nextThreads = threads.map((t) => (t.id === thread.id ? updated : t))
  writeThreads(nextThreads)
  return updated
}

export function updateThreadStatus(threadId: string, status: 'open' | 'closed'): void {
  const threads = readThreads()
  const next = threads.map((t) => (t.id === threadId ? { ...t, status, updatedAt: nowIso() } : t))
  writeThreads(next)
}

export function assignThread(threadId: string, agentId: string, agentName: string): void {
  const threads = readThreads()
  const next = threads.map((t) =>
    t.id === threadId
      ? {
          ...t,
          assignedAgentId: agentId,
          assignedAgentName: agentName,
          updatedAt: nowIso(),
        }
      : t,
  )
  writeThreads(next)
}

export function unassignThread(threadId: string): void {
  const threads = readThreads()
  const next = threads.map((t) =>
    t.id === threadId
      ? {
          ...t,
          assignedAgentId: undefined,
          assignedAgentName: undefined,
          updatedAt: nowIso(),
        }
      : t,
  )
  writeThreads(next)
}

export function readQuickReplies(agentId: string): string[] {
  return readJson<string[]>(`${QUICK_PREFIX}${agentId}`, [])
}

export function writeQuickReplies(agentId: string, replies: string[]): void {
  writeJson(`${QUICK_PREFIX}${agentId}`, replies)
}

