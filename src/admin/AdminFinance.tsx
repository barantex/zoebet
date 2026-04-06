import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Tx = { id: string; user_id: string; email: string; name: string; surname: string; phone: string; amount: number; method: string; status: string; note: string; created_at: string; reference_id: string }
type Iban = { id: string; bank_name: string; account_name: string; iban: string; active: number; logo?: string }

function StatusBadge({ s }: { s: string }) {
  const cls = s === 'completed' ? 'zoe-badge--on' : s === 'rejected' ? 'zoe-badge--off' : ''
  const label = s === 'completed' ? 'Onaylandi' : s === 'rejected' ? 'Reddedildi' : 'Bekliyor'
  return <span className={`zoe-badge ${cls}`}>{label}</span>
}

function IbanManager() {
  const [ibans, setIbans] = useState<Iban[]>([])
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [iban, setIban] = useState('')
  const [logo, setLogo] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const d = await fetchApi('/admin-finance/ibans')
    setIbans(d.ibans)
  }
  useEffect(() => { load() }, [])

  function handleLogoFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function add() {
    if (!bankName || !accountName || !iban) return setMsg('Banka adi, hesap sahibi ve IBAN zorunlu')
    try {
      await fetchApi('/admin-finance/ibans', { method: 'POST', body: JSON.stringify({ bank_name: bankName, account_name: accountName, iban, logo: logo || null }) })
      setBankName(''); setAccountName(''); setIban(''); setLogo(''); setMsg('Eklendi')
      load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function toggle(id: string, active: number) {
    await fetchApi(`/admin-finance/ibans/${id}`, { method: 'PATCH', body: JSON.stringify({ active: active ? 0 : 1 }) })
    load()
  }

  async function del(id: string) {
    if (!confirm('Sil?')) return
    await fetchApi(`/admin-finance/ibans/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="zoe-page-head"><h2>IBAN Yonetimi</h2></div>
      <div className="zoe-panel">
        <div className="zoe-form-grid">
          <label className="zoe-field">
            <span className="zoe-field-label">Banka Adi *</span>
            <input className="zoe-input" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ziraat Bankasi" />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Hesap Sahibi *</span>
            <input className="zoe-input" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="ZoeBet Ltd." />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">IBAN *</span>
            <input className="zoe-input" value={iban} onChange={e => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label className="zoe-field" style={{ flex: 1 }}>
            <span className="zoe-field-label">Banka Logosu (dosya)</span>
            <input className="zoe-input" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
          </label>
          <label className="zoe-field" style={{ flex: 1 }}>
            <span className="zoe-field-label">veya Logo URL</span>
            <input className="zoe-input" value={logo.startsWith('data:') ? '' : logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." />
          </label>
          {logo && <img src={logo} alt="logo" style={{ height: 40, objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 4 }} />}
        </div>
        {msg && <div style={{ fontSize: 12, color: msg === 'Eklendi' ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
        <button className="zoe-btn zoe-btn--primary" onClick={add}>IBAN Ekle</button>
      </div>
      <div className="zoe-panel" style={{ padding: 0 }}>
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '40px 1.5fr 1.5fr 2fr 1fr 1fr' }}>
            <span>Logo</span><span>Banka</span><span>Hesap Sahibi</span><span>IBAN</span><span>Durum</span><span>Islem</span>
          </div>
          {ibans.map(i => (
            <div key={i.id} className="zoe-admin-row" style={{ gridTemplateColumns: '40px 1.5fr 1.5fr 2fr 1fr 1fr' }}>
              <div>
                {i.logo
                  ? <img src={i.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2 }} />
                  : <span style={{ fontSize: 20 }}>🏦</span>
                }
              </div>
              <strong className="zoe-admin-strong">{i.bank_name}</strong>
              <span style={{ fontSize: 12 }}>{i.account_name}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' }}>{i.iban}</span>
              <span className={`zoe-badge ${i.active ? 'zoe-badge--on' : 'zoe-badge--off'}`}>{i.active ? 'Aktif' : 'Pasif'}</span>
              <div className="zoe-admin-actions">
                <button className="zoe-btn zoe-btn--outline zoe-btn--sm" onClick={() => toggle(i.id, i.active)}>{i.active ? 'Pasif' : 'Aktif'}</button>
                <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => del(i.id)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TxList({ type }: { type: 'deposits' | 'withdrawals' }) {
  const [items, setItems] = useState<Tx[]>([])
  const [status, setStatus] = useState('pending')
  const [total, setTotal] = useState(0)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const d = await fetchApi(`/admin-finance/${type}?status=${status}`)
    setItems(type === 'deposits' ? d.deposits : d.withdrawals)
    setTotal(d.total)
  }
  useEffect(() => { load() }, [status])

  async function approve(id: string) {
    await fetchApi(`/admin-finance/${type === 'deposits' ? 'deposits' : 'withdrawals'}/${id}/approve`, { method: 'POST', body: '{}' })
    setMsg('Onaylandi'); load()
  }

  async function reject(id: string) {
    await fetchApi(`/admin-finance/${type === 'deposits' ? 'deposits' : 'withdrawals'}/${id}/reject`, { method: 'POST', body: JSON.stringify({ note: rejectNote }) })
    setRejectId(null); setRejectNote(''); setMsg('Reddedildi'); load()
  }

  const title = type === 'deposits' ? 'Yatirim Talepleri' : 'Cekim Talepleri'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="zoe-page-head"><h2>{title}</h2><p>Toplam {total} kayit</p></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['pending', 'completed', 'rejected'].map(s => (
            <button key={s} className={`zoe-chip${status === s ? ' zoe-chip--active' : ''}`} onClick={() => setStatus(s)}>
              {s === 'pending' ? 'Bekliyor' : s === 'completed' ? 'Onaylandi' : 'Reddedildi'}
            </button>
          ))}
        </div>
      </div>
      {msg && <div style={{ fontSize: 12, color: '#86efac' }}>{msg}</div>}
      <div className="zoe-panel" style={{ padding: 0 }}>
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr' }}>
            <span>Kullanici</span><span>Tutar</span><span>Yontem</span><span>Durum</span><span>Tarih</span><span>Islem</span>
          </div>
          {items.length === 0 && <div style={{ padding: 16, color: '#6b7280' }}>Kayit yok</div>}
          {items.map(tx => (
            <div key={tx.id} className="zoe-admin-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr' }}>
              <div>
                <strong className="zoe-admin-strong">{tx.name} {tx.surname}</strong>
                <div className="zoe-muted" style={{ fontSize: 11 }}>{tx.email} - {tx.phone}</div>
                {tx.reference_id && <div style={{ fontSize: 10, color: '#6b7280' }}>Ref: {tx.reference_id}</div>}
                {tx.note && <div style={{ fontSize: 10, color: '#fca5a5' }}>Not: {tx.note}</div>}
              </div>
              <span style={{ color: '#f5c518', fontWeight: 700 }}>TL{tx.amount?.toLocaleString('tr-TR')}</span>
              <span style={{ fontSize: 12 }}>{tx.method || '-'}</span>
              <StatusBadge s={tx.status} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>{new Date(tx.created_at).toLocaleString('tr-TR')}</span>
              <div className="zoe-admin-actions">
                {tx.status === 'pending' && (
                  <>
                    <button className="zoe-btn zoe-btn--primary zoe-btn--sm" onClick={() => approve(tx.id)}>Onayla</button>
                    <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }} onClick={() => { setRejectId(tx.id); setRejectNote('') }}>Reddet</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="zoe-panel" style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <strong style={{ color: '#f9fafb' }}>Reddetme Nedeni</strong>
            <textarea className="zoe-input" rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Opsiyonel not..." style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => setRejectId(null)}>Iptal</button>
              <button className="zoe-btn zoe-btn--primary" onClick={() => reject(rejectId)}>Reddet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminFinancePage() {
  const [tab, setTab] = useState<'deposits' | 'withdrawals' | 'ibans'>('deposits')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['deposits', 'withdrawals', 'ibans'] as const).map(t => (
          <button key={t} className={`zoe-chip${tab === t ? ' zoe-chip--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'deposits' ? 'Yatirimlar' : t === 'withdrawals' ? 'Cekimler' : 'IBANlar'}
          </button>
        ))}
      </div>
      {tab === 'deposits' && <TxList type="deposits" />}
      {tab === 'withdrawals' && <TxList type="withdrawals" />}
      {tab === 'ibans' && <IbanManager />}
    </div>
  )
}
