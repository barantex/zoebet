import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AdminLoginPage() {
  const { login, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already logged in as admin
  if (isAdmin) {
    navigate('/admin', { replace: true })
    return null
  }

  async function handleLogin() {
    setLoading(true); setError(null)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) return setError((res as any).message)
    // login sets user in context — navigate to admin
    navigate('/admin', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#111118', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif'
    }}>
      <div style={{
        width: 380, background: '#1a1a24', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>⚡ BAHİS<span style={{ color: '#f5c518' }}>MOSCO</span></div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Back Office Girişi</div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>E-posta</span>
          <input
            style={{ borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: '#111118', color: '#e5e7eb', padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@bahismosco.com" type="email"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Şifre</span>
          <input
            style={{ borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', background: '#111118', color: '#e5e7eb', padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••" type="password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </label>

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ background: '#f5c518', color: '#111', border: 'none', borderRadius: 7, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1, fontFamily: 'inherit' }}
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <a href="/" style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
          ← Siteye Dön
        </a>
      </div>
    </div>
  )
}

