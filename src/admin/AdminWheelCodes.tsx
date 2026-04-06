import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Code = {
  id: string; code: string; amount: number; used: number
  used_by_email: string | null; used_at: string | null
  expires_at: string | null; created_at: string
}

export function AdminWheelCodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState('1')
  const [expiresAt, setExpiresAt] = useState('')
  const [msg, setMsg] = useState('')
  const [newCodes, setNewCodes] = useState<{ code: string; amount: number }[]>([])

  async function load() {
    const d = await fetchApi('/wheel/admin/codes')
    setCodes(d.codes)
  }
  useEffect(() => { load() }, [])

  async function generate() {
    if (!amount || Number(amount) <= 0) return setMsg('Geçerli bir tutar gir')
    try {
      const d = await fetchApi('/wheel/admin/codes', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), count: Number(count), expires_at: expiresAt || null }),
      })
      setNewCodes(d.codes)
      setMsg(`${d.codes.length} kod oluşturuldu`)
      setAmount(''); setCount('1'); setExpiresAt('')
      load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function del(id: string) {
    if (!confirm('Sil?')) return
    await fetchApi(`/wheel/admin/codes/${id}`, { method: 'DELETE' })
    load()
  }

  const unused = codes.filter(c => !c.used)
  const used = codes.filter(c => c.used)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="zoe-page-head">
        <h2>🎡 Çark Kodları</h2>
        <p>Özel müşteriler için bonus kod oluştur</p>
      </div>

      {/* Generate form */}
      <div className="zoe-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label className="zoe-field">
            <span className="zoe-field-label">Bonus Tutarı (₺) *</span>
            <input className="zoe-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Kaç Kod Oluştur</span>
            <input className="zoe-input" type="number" min="1" max="100" value={count} onChange={e => setCount(e.target.value)} />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Son Kullanma Tarihi (opsiyonel)</span>
            <input className="zoe-input" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </label>
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.includes('oluşturuldu') ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
        <button className="zoe-btn zoe-btn--primary" onClick={generate}>Kod Oluştur</button>

        {/* Newly generated codes */}
        {newCodes.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#111118', borderRadius: 8, border: '1px solid rgba(245,197,24,.3)' }}>
            <div style={{ fontSize: 12, color: '#f5c518', fontWeight: 700, marginBottom: 8 }}>Oluşturulan Kodlar — Kopyala ve Paylaş</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {newCodes.map(c => (
                <div key={c.code} style={{ padding: '6px 12px', background: '#1e1e2a', borderRadius: 6, border: '1px solid rgba(245,197,24,.4)', cursor: 'pointer' }}
                  onClick={() => navigator.clipboard?.writeText(c.code)}
                  title="Kopyalamak için tıkla">
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#f5c518', letterSpacing: '.1em' }}>{c.code}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>₺{c.amount}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>Koda tıklayarak kopyalayabilirsin</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div className="zoe-kpi"><span>Toplam Kod</span><strong>{codes.length}</strong></div>
        <div className="zoe-kpi"><span>Kullanılmayan</span><strong style={{ color: '#86efac' }}>{unused.length}</strong></div>
        <div className="zoe-kpi"><span>Kullanılan</span><strong style={{ color: '#f5c518' }}>{used.length}</strong></div>
      </div>

      {/* Code list */}
      <div className="zoe-panel" style={{ padding: 0 }}>
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.5fr 1fr' }}>
            <span>Kod</span><span>Tutar</span><span>Durum</span><span>Kullanan</span><span>Tarih</span><span>İşlem</span>
          </div>
          {codes.map(c => (
            <div key={c.id} className="zoe-admin-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.5fr 1fr' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: c.used ? '#6b7280' : '#f5c518', letterSpacing: '.08em' }}>{c.code}</span>
              <span style={{ color: '#86efac', fontWeight: 700 }}>₺{c.amount?.toLocaleString('tr-TR')}</span>
              <span className={`zoe-badge ${c.used ? 'zoe-badge--off' : 'zoe-badge--on'}`}>{c.used ? 'Kullanıldı' : 'Aktif'}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.used_by_email || '—'}</span>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                <div>Oluşturuldu: {new Date(c.created_at).toLocaleDateString('tr-TR')}</div>
                {c.used_at && <div>Kullanıldı: {new Date(c.used_at).toLocaleDateString('tr-TR')}</div>}
                {c.expires_at && <div style={{ color: new Date(c.expires_at) < new Date() ? '#fca5a5' : '#9ca3af' }}>Son: {new Date(c.expires_at).toLocaleDateString('tr-TR')}</div>}
              </div>
              <div className="zoe-admin-actions">
                {!c.used && <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => del(c.id)}>Sil</button>}
              </div>
            </div>
          ))}
          {codes.length === 0 && <div style={{ padding: 16, color: '#6b7280' }}>Henüz kod yok</div>}
        </div>
      </div>
    </div>
  )
}
