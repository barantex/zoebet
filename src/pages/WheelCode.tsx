import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchApi } from '../api/client'

export function WheelCodePage() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ amount: number; newBalance: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="zoe-panel" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎡</div>
        <h2 style={{ color: '#f9fafb', marginBottom: 8 }}>Çark Kodu</h2>
        <p className="zoe-muted">Kodu kullanmak için giriş yapmalısın.</p>
        <a href="/login" className="zoe-btn zoe-btn--primary" style={{ marginTop: 12, display: 'inline-flex' }}>Giriş Yap</a>
      </div>
    )
  }

  async function handleRedeem() {
    if (!code.trim()) return setError('Kod gir')
    setLoading(true); setError(null); setResult(null)
    try {
      const d = await fetchApi('/wheel/redeem', { method: 'POST', body: JSON.stringify({ code: code.trim().toUpperCase() }) })
      setResult({ amount: d.amount, newBalance: d.newBalance })
      setCode('')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', paddingTop: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🎡</div>
        <h2 style={{ color: '#f9fafb', margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>Çark Kodu Kullan</h2>
        <p className="zoe-muted">Özel kodunu gir, bakiyene anında yüklensin</p>
      </div>

      <div className="zoe-panel" style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="zoe-field">
          <span className="zoe-field-label">Çark Kodun</span>
          <input
            className="zoe-input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ÖRNEK: AB3K9XYZ"
            style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: '.12em', textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleRedeem()}
          />
        </label>

        {error && <div className="zoe-alert">{error}</div>}

        {result && (
          <div style={{ padding: 16, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#86efac' }}>+₺{result.amount.toLocaleString('tr-TR')}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Bakiyene eklendi! Yeni bakiye: <strong style={{ color: '#f5c518' }}>₺{result.newBalance.toLocaleString('tr-TR')}</strong></div>
          </div>
        )}

        <button className="zoe-btn zoe-btn--primary zoe-btn--full" onClick={handleRedeem} disabled={loading}>
          {loading ? 'Kontrol ediliyor…' : 'Kodu Kullan'}
        </button>
      </div>

      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <p className="zoe-muted" style={{ fontSize: 12 }}>
          Çark kodları tek kullanımlıktır. Her kod yalnızca bir kez kullanılabilir.
          Kodunu kimseyle paylaşma.
        </p>
      </div>
    </div>
  )
}
