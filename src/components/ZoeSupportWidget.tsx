import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { addMessage, ensureThread, readThreads } from '../lib/support'
import type { SupportMessage } from '../lib/types'
import { ADMIN_ROUTE, STAFF_ROUTE } from '../lib/admin'

export function ZoeSupportWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  const identity = useMemo(() => {
    if (user) return { id: user.id, email: user.email }
    return { id: 'guest', email: 'guest@zoebet.com' }
  }, [user])

  useEffect(() => {
    const thread = ensureThread(identity.id, identity.email)
    setMessages(thread.messages)
  }, [identity])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== 'zoe.support.threads') return
      const threads = readThreads()
      const thread = threads.find((t) => t.userId === identity.id)
      if (thread) setMessages(thread.messages)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [identity.id])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const unreadCount = useMemo(() => {
    if (open) return 0
    const agentMessages = messages.filter((m) => m.from === 'agent')
    return agentMessages.length > 1 ? 1 : 0
  }, [messages, open])

  if (
    location.pathname.startsWith(ADMIN_ROUTE) ||
    location.pathname.startsWith(STAFF_ROUTE)
  ) {
    return null
  }

  function sendMessage(text: string) {
    if (!text.trim()) return
    const next = addMessage(identity.id, identity.email, 'user', text.trim())
    setMessages(next.messages)
    setInput('')
  }

  return (
    <div className="zoe-support">
      {open ? (
        <div className="zoe-support-panel">
          <div className="zoe-support-header">
            <div>
              <strong>Canlı Destek</strong>
              <span>Şu an aktif</span>
            </div>
            <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => setOpen(false)}>
              Kapat
            </button>
          </div>
          <div className="zoe-support-messages" ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  'zoe-support-message ' +
                  (msg.from === 'user'
                    ? 'zoe-support-message--user'
                    : 'zoe-support-message--agent')
                }
              >
                {msg.from === 'agent' && msg.agentName ? (
                  <strong className="zoe-support-agent">{msg.agentName}</strong>
                ) : null}
                <p>{msg.text}</p>
                <span>{msg.at}</span>
              </div>
            ))}
          </div>
          <div className="zoe-support-input">
            <input
              className="zoe-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajını yaz..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage(input)
              }}
            />
            <button className="zoe-btn zoe-btn--primary" onClick={() => sendMessage(input)}>
              Gönder
            </button>
          </div>
        </div>
      ) : null}

      <button className="zoe-support-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span>Canlı Destek</span>
        {unreadCount ? <em>{unreadCount}</em> : null}
      </button>
    </div>
  )
}
