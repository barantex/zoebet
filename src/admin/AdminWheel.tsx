import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Slice = { id: string; label: string; amount: number; color: string; probability: number; active: number }
type Code = { id: string; code: string; amount: number; used: number; used_by_email: string | null; used_at: string | null; expires_at: string | null; created_at: string }

const COLORS = ['#f5c518','#e67e00','#22c55e','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#f59e0b','#ec4899','#10b981']

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <div key={c} onClick={() => onChange(c)} style={{
          width: 20, height: 20, borderRadius: 3, background: c, cursor: 'pointer',
          border: value === c ? '2px solid #fff' : '2px solid transparent', flexShrink: 0
        }} />
      ))}
    </div>
  )
}

function WheelPreview({ slices }: { slices: Slice[] }) {
  const active = slices.filter(s => s.active)
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {active.map((s, i) => {
        const arc = (2 * Math.PI) / active.length
        const start = i * arc - Math.PI / 2
        const end = start + arc
        const r = 90
        const x1 = 100 + r * Math.cos(start), y1 = 100 + r * Math.sin(start)
        const x2 = 100 + r * Math.cos(end),   y2 = 100 + r * Math.sin(end)
        const large = arc > Math.PI ? 1 : 0
        const mx = 100 + 62 * Math.cos(start + arc / 2)
        const my = 100 + 62 * Math.sin(start + arc / 2)
        return (
          <g key={s.id}>
            <path d={`M100,100 L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={s.color} stroke="rgba(0,0,0,.3)" strokeWidth="1.5" />
            <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="bold">{s.label}</text>
          </g>
        )
      })}
      <circle cx="100" cy="100" r="18" fill="#111118" stroke="#f5c518" strokeWidth="2.5" />
      <text x="100" y="104" textAnchor="middle" fill="#f5c518" fontSize="8" fontWeight="bold">ÇEVİR</text>
    </svg>
  )
}

/* ── SLICES TAB ── */
function SlicesTab() {
  const [slices, setSlices] = useState<Slice[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editProb, setEditProb] = useState('')
  const [editColor, setEditColor] = useState('#f5c518')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [color, setColor] = useState('#f5c518')
  const [prob, setProb] = useState('10')
  const [msg, setMsg] = useState('')

  async function load() { const d = await fetchApi('/wheel/admin/slices'); setSlices(d.slices) }
  useEffect(() => { load() }, [])

  function startEdit(s: Slice) { setEditId(s.id); setEditLabel(s.label); setEditAmount(String(s.amount)); setEditProb(String(s.probability)); setEditColor(s.color) }

  async function saveEdit(id: string) {
    await fetchApi(`/wheel/admin/slices/${id}`, { method: 'PATCH', body: JSON.stringify({ label: editLabel, amount: Number(editAmount), probability: Number(editProb), color: editColor }) })
    setEditId(null); load()
  }

  async function add() {
    if (!label || !amount) return setMsg('Etiket ve tutar zorunlu')
    try {
      await fetchApi('/wheel/admin/slices', { method: 'POST', body: JSON.stringify({ label, amount: Number(amount), color, probability: Number(prob) }) })
      setLabel(''); setAmount(''); setProb('10'); setMsg('Eklendi'); load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function toggle(id: string, active: number) { await fetchApi(`/wheel/admin/slices/${id}`, { method: 'PATCH', body: JSON.stringify({ active: active ? 0 : 1 }) }); load() }
  async function del(id: string) { if (!confirm('Sil?')) return; await fetchApi(`/wheel/admin/slices/${id}`, { method: 'DELETE' }); load() }

  const totalProb = slices.filter(s => s.active).reduce((a, s) => a + s.probability, 0)

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Add */}
        <div className="zoe-panel">
          <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 10, fontSize: 13 }}>+ Yeni Dilim</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <label className="zoe-field"><span className="zoe-field-label">Etiket *</span><input className="zoe-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="500 TL" /></label>
            <label className="zoe-field"><span className="zoe-field-label">Tutar (₺) *</span><input className="zoe-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" /></label>
            <label className="zoe-field"><span className="zoe-field-label">Olasılık</span><input className="zoe-input" type="number" min="1" max="100" value={prob} onChange={e => setProb(e.target.value)} /></label>
          </div>
          <label className="zoe-field" style={{ marginBottom: 10 }}><span className="zoe-field-label">Renk</span><ColorPicker value={color} onChange={setColor} /></label>
          {msg && <div style={{ fontSize: 12, color: msg === 'Eklendi' ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
          <button className="zoe-btn zoe-btn--primary" onClick={add}>Dilim Ekle</button>
        </div>

        {/* List */}
        {slices.map(s => (
          <div key={s.id} className="zoe-panel" style={{ padding: '10px 14px' }}>
            {editId === s.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                  <label className="zoe-field"><span className="zoe-field-label">Etiket</span><input className="zoe-input" value={editLabel} onChange={e => setEditLabel(e.target.value)} /></label>
                  <label className="zoe-field"><span className="zoe-field-label">Tutar (₺)</span><input className="zoe-input" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} /></label>
                  <label className="zoe-field"><span className="zoe-field-label">Olasılık</span><input className="zoe-input" type="number" min="1" max="100" value={editProb} onChange={e => setEditProb(e.target.value)} /></label>
                </div>
                <label className="zoe-field"><span className="zoe-field-label">Renk</span><ColorPicker value={editColor} onChange={setEditColor} /></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="zoe-btn zoe-btn--primary zoe-btn--sm" onClick={() => saveEdit(s.id)}>Kaydet</button>
                  <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => setEditId(null)}>İptal</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: 14 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>₺{s.amount} · Olasılık: {s.probability} ({totalProb > 0 ? ((s.probability / totalProb) * 100).toFixed(1) : 0}%)</div>
                </div>
                <span className={`zoe-badge ${s.active ? 'zoe-badge--on' : 'zoe-badge--off'}`}>{s.active ? 'Aktif' : 'Pasif'}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="zoe-btn zoe-btn--outline zoe-btn--sm" onClick={() => startEdit(s)}>✏️ Düzenle</button>
                  <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => toggle(s.id, s.active)}>{s.active ? 'Pasif' : 'Aktif'}</button>
                  <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }} onClick={() => del(s.id)}>Sil</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="zoe-panel" style={{ width: 220, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: 700 }}>Canlı Önizleme</div>
        <WheelPreview slices={slices} />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{slices.filter(s => s.active).length} aktif dilim · Toplam olasılık: {totalProb}</div>
      </div>
    </div>
  )
}

/* ── CODES TAB ── */
function CodesTab() {
  const [codes, setCodes] = useState<Code[]>([])
  const [codeVal, setCodeVal] = useState('BahisMosco')
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState('1')
  const [expiresAt, setExpiresAt] = useState('')
  const [msg, setMsg] = useState('')
  const [newCodes, setNewCodes] = useState<{ code: string; amount: number }[]>([])

  async function load() { const d = await fetchApi('/wheel/admin/codes'); setCodes(d.codes) }
  useEffect(() => { load() }, [])

  async function generate() {
    if (!amount || Number(amount) <= 0) return setMsg('Geçerli bir tutar gir')
    try {
      const d = await fetchApi('/wheel/admin/codes', {
        method: 'POST',
        body: JSON.stringify({ code: Number(count) === 1 ? codeVal.trim().toUpperCase() || undefined : undefined, amount: Number(amount), count: Number(count), expires_at: expiresAt || null }),
      })
      setNewCodes(d.codes); setMsg(`${d.codes.length} kod oluşturuldu`)
      setAmount(''); setCount('1'); setExpiresAt(''); setCodeVal('BahisMosco'); load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function del(id: string) { if (!confirm('Sil?')) return; await fetchApi(`/wheel/admin/codes/${id}`, { method: 'DELETE' }); load() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="zoe-panel">
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 10, fontSize: 13 }}>+ Yeni Kod Oluştur</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label className="zoe-field">
            <span className="zoe-field-label">Kod (tek kod için) — varsayılan: BahisMosco</span>
            <input className="zoe-input" value={codeVal} onChange={e => setCodeVal(e.target.value.toUpperCase())} placeholder="BahisMosco"
              style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.1em' }} />
          </label>
          <label className="zoe-field"><span className="zoe-field-label">Bonus Tutarı (₺) *</span><input className="zoe-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Kaç Adet</span><input className="zoe-input" type="number" min="1" max="100" value={count} onChange={e => setCount(e.target.value)} /></label>
          <label className="zoe-field"><span className="zoe-field-label">Son Kullanma (opsiyonel)</span><input className="zoe-input" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></label>
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.includes('oluşturuldu') ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
        <button className="zoe-btn zoe-btn--primary" onClick={generate}>Kod Oluştur</button>

        {newCodes.length > 0 && (
          <div style={{ marginTop: 14, padding: 12, background: '#111118', borderRadius: 8, border: '1px solid rgba(245,197,24,.3)' }}>
            <div style={{ fontSize: 12, color: '#f5c518', fontWeight: 700, marginBottom: 8 }}>Oluşturulan Kodlar — Tıklayarak Kopyala</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {newCodes.map(c => (
                <div key={c.code} onClick={() => navigator.clipboard?.writeText(c.code)}
                  style={{ padding: '6px 14px', background: '#1e1e2a', borderRadius: 6, border: '1px solid rgba(245,197,24,.4)', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#f5c518', letterSpacing: '.1em' }}>{c.code}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>₺{c.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div className="zoe-kpi"><span>Toplam</span><strong>{codes.length}</strong></div>
        <div className="zoe-kpi"><span>Aktif</span><strong style={{ color: '#86efac' }}>{codes.filter(c => !c.used).length}</strong></div>
        <div className="zoe-kpi"><span>Kullanılan</span><strong style={{ color: '#f5c518' }}>{codes.filter(c => c.used).length}</strong></div>
      </div>

      <div className="zoe-panel" style={{ padding: 0 }}>
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.5fr 0.5fr' }}>
            <span>Kod</span><span>Tutar</span><span>Durum</span><span>Kullanan</span><span>Tarih</span><span></span>
          </div>
          {codes.length === 0 && <div style={{ padding: 16, color: '#6b7280' }}>Henüz kod yok</div>}
          {codes.map(c => (
            <div key={c.id} className="zoe-admin-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1.5fr 0.5fr' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: c.used ? '#6b7280' : '#f5c518', letterSpacing: '.08em', cursor: 'pointer' }}
                onClick={() => navigator.clipboard?.writeText(c.code)} title="Kopyala">{c.code} 📋</span>
              <span style={{ color: '#86efac', fontWeight: 700 }}>₺{c.amount}</span>
              <span className={`zoe-badge ${c.used ? 'zoe-badge--off' : 'zoe-badge--on'}`}>{c.used ? 'Kullanıldı' : 'Aktif'}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.used_by_email || '—'}</span>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                <div>{new Date(c.created_at).toLocaleDateString('tr-TR')}</div>
                {c.expires_at && <div style={{ color: new Date(c.expires_at) < new Date() ? '#fca5a5' : '#9ca3af' }}>Son: {new Date(c.expires_at).toLocaleDateString('tr-TR')}</div>}
              </div>
              <div>{!c.used && <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }} onClick={() => del(c.id)}>Sil</button>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── MAIN ── */
export function AdminWheelPage() {
  const [tab, setTab] = useState<'slices' | 'codes'>('slices')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="zoe-page-head">
        <h2>🎡 Çark Yönetimi</h2>
        <p>Dilimler ve özel kodlar</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`zoe-chip${tab === 'slices' ? ' zoe-chip--active' : ''}`} onClick={() => setTab('slices')}>🎰 Çark Dilimleri</button>
        <button className={`zoe-chip${tab === 'codes' ? ' zoe-chip--active' : ''}`} onClick={() => setTab('codes')}>🎟️ Çark Kodları</button>
      </div>
      {tab === 'slices' ? <SlicesTab /> : <CodesTab />}
    </div>
  )
}

