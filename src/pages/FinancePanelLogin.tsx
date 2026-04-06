import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api/client'

export function FinancePanelLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/finance-panel/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız')
      localStorage.setItem('fp.token', data.token)
      localStorage.setItem('fp.user', JSON.stringify({ email: data.email, name: data.name, role: data.role }))
      navigate('/finans-panel')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#111118', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif'
    }}>
      <div style={{
        width: 'min(420px,100%)', background: '#1e1e2a', borderRadius: 14,
        border: '1px solid rgba(255,255,255,.08)', padding: 32,
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#f9fafb' }}>Finans Paneli</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>BahisMosco — Finans Ekibi Girişi</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>E-posta</span>
            <input
              style={{ borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: '#111118', color: '#e5e7eb', padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="finans@bahismosco.com" required autoFocus
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Şifre</span>
            <input
              style={{ borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: '#111118', color: '#e5e7eb', padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </label>

          {error && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              background: '#f5c518', color: '#111', border: 'none', borderRadius: 7,
              padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: 4
            }}
          >
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', margin: 0 }}>
          Bu panel yalnızca finans ekibi içindir.
        </p>
      </div>
    </div>
  )
}
