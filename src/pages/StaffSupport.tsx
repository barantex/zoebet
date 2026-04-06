import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { addMessage, readQuickReplies, readThreads, updateThreadStatus, writeQuickReplies } from '../lib/support'
import { DEFAULT_SUPPORT_QUICK_REPLIES, KEYS } from '../lib/seed'
import { readJson } from '../lib/storage'

export function StaffSupportPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState(() => readThreads())
  const [activeId, setActiveId] = useState<string | null>(() => (threads[0]?.id ?? null))
  const [reply, setReply] = useState('')
  const [newReply, setNewReply] = useState('')
  const [personalReplies, setPersonalReplies] = useState<string[]>([])

  const globalReplies = useMemo(
    () => readJson<string[]>(KEYS.supportQuickReplies, DEFAULT_SUPPORT_QUICK_REPLIES),
    [],
  )

  useEffect(() => {
    if (!user) return
    setPersonalReplies(readQuickReplies(user.id))
  }, [user])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === 'zoe.support.threads') {
        setThreads(readThreads())
        if (!activeId) setActiveId(readThreads()[0]?.id ?? null)
      }
      if (event.key === `zoe.support.quickReplies.${user?.id ?? ''}`) {
        setPersonalReplies(readQuickReplies(user?.id ?? ''))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [activeId, user])

  if (!user) {
    return (
      <main className="zoe-main">
        <div className="zoe-panel">
          <h2>Destek</h2>
          <p className="zoe-muted">Bu sayfayı görmek için giriş yapmalısın.</p>
        </div>
      </main>
    )
  }

  const currentUser = user

  const myThreads = threads.filter((t) => t.assignedAgentId === currentUser.id)
  const activeThread = myThreads.find((t) => t.id === activeId) ?? myThreads[0]
  const agentLabel = (currentUser as any).name ?? currentUser.email

  function handleReply() {
    if (!activeThread || !reply.trim()) return
    const updated = addMessage(activeThread.userId, activeThread.userEmail, 'agent', reply.trim(), agentLabel)
    updateThreadStatus(activeThread.id, 'closed')
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setThreads(readThreads())
    setReply('')
  }

  function addPersonalReply() {
    if (!newReply.trim()) return
    const next = [newReply.trim(), ...personalReplies]
    writeQuickReplies(currentUser.id, next)
    setPersonalReplies(next)
    setNewReply('')
  }

  return (
    <main className="zoe-main">
      <div className="zoe-page-head">
        <h2>Personel Paneli</h2>
        <p>Atanan sohbetleri yönet.</p>
      </div>

      <div className="zoe-support-admin">
        <aside className="zoe-support-admin-list">
          {myThreads.length ? (
            myThreads.map((thread) => (
              <button
                key={thread.id}
                className={
                  'zoe-support-admin-item ' +
                  (thread.id === activeThread?.id ? 'zoe-support-admin-item--active' : '')
                }
                onClick={() => setActiveId(thread.id)}
              >
                <div>
                  <strong>{thread.userEmail}</strong>
                  <span>{thread.messages.at(-1)?.text ?? 'Yeni mesaj'}</span>
                </div>
                <em className={thread.status === 'open' ? 'zoe-badge zoe-badge--on' : 'zoe-badge'}>
                  {thread.status === 'open' ? 'Açık' : 'Kapalı'}
                </em>
              </button>
            ))
          ) : (
            <div className="zoe-muted">Atanmış sohbet yok.</div>
          )}
        </aside>

        <section className="zoe-support-admin-chat">
          {activeThread ? (
            <>
              <div className="zoe-support-admin-header">
                <div>
                  <strong>{activeThread.userEmail}</strong>
                  <span>Durum: {activeThread.status === 'open' ? 'Açık' : 'Kapalı'}</span>
                </div>
              </div>
              <div className="zoe-support-admin-messages">
                {activeThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      'zoe-support-message ' +
                      (msg.from === 'agent' ? 'zoe-support-message--agent' : 'zoe-support-message--user')
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
              <div className="zoe-support-admin-quick-panel">
                <div className="zoe-support-admin-quick-head">
                  <strong>Hazır Mesajlarım</strong>
                  <span>Hızlı cevaplar</span>
                </div>
                <div className="zoe-support-admin-quick">
                  {[...personalReplies, ...globalReplies].map((qr) => (
                    <button key={qr} className="zoe-chip" onClick={() => setReply(qr)}>
                      {qr}
                    </button>
                  ))}
                </div>
                <div className="zoe-support-admin-quick-form">
                  <input
                    className="zoe-input"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Yeni hazır mesaj yaz..."
                  />
                  <button className="zoe-btn zoe-btn--outline" onClick={addPersonalReply}>
                    Ekle
                  </button>
                </div>
              </div>
              <div className="zoe-support-admin-input">
                <input
                  className="zoe-input"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Yanıt yaz..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReply()
                  }}
                />
                <button className="zoe-btn zoe-btn--primary" onClick={handleReply}>
                  Gönder
                </button>
              </div>
            </>
          ) : (
            <div className="zoe-muted">Seçili sohbet yok.</div>
          )}
        </section>
      </div>
    </main>
  )
}
