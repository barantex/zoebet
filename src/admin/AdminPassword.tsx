import { useState } from 'react'
import { fetchApi } from '../api/client'

export function AdminPasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    if (next !== confirm) return setMsg('Yeni şifreler eşleşmiyor')
    if (next.length < 6) return setMsg('Şifre en az 6 karakter olmalı')
    setLoading(true); setMsg('')
    try {
      await fetchApi('/admin/change-password', { method: 'POST', body: JSON.stringify({ current_password: current, new_password: next }) })
      setMsg('Şifre başarıyla değiştirildi')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="zoe-page-head"><h2>🔑 Şifre Değiştir</h2></div>
      <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label className="zoe-field">
          <span className="zoe-field-label">Mevcut Şifre</span>
          <input className="zoe-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
        </label>
        <label className="zoe-field">
          <span className="zoe-field-label">Yeni Şifre</span>
          <input className="zoe-input" type="password" value={next} onChange={e => setNext(e.target.value)} />
        </label>
        <label className="zoe-field">
          <span className="zoe-field-label">Yeni Şifre (Tekrar)</span>
          <input className="zoe-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </label>
        {msg && <div style={{ fontSize: 13, color: msg.includes('başarıyla') ? '#86efac' : '#fca5a5' }}>{msg}</div>}
        <button className="zoe-btn zoe-btn--primary" onClick={save} disabled={loading}>
          {loading ? 'Kaydediliyor…' : 'Şifreyi Değiştir'}
        </button>
      </div>
    </div>
  )
}
