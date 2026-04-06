import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Tx = { id: string; user_id: string; email: string; name: string; surname: string; phone: string; amount: number; method: string; status: string; note: string; created_at: string; reference_id: string }
type Iban = { id: string; bank_name: string; account_name: string; iban: string; active: number; logo?: string }

const TOKEN_KEY = 'zoe.finance.token'
const PANEL_PASS = 'FinansPanel2026'

export function FinancePanelPage() {
  const [auth, setAuth] = useState(() => localStorage.getItem(TOKEN_KEY) === PANEL_PASS)
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState<'deposits' | 'withdrawals' | 'ibans'>('deposits')
  const [items, setItems] = useState<Tx[]>([])
  const [ibans, setIbans] = useState<Iban[]>([])
  const [status, setStatus] = useState('pending')
  const [total, setTotal] = useState(0)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [msg, setMsg] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [iban, setIban] = useState('')
  const [logo, setLogo] = useState('')
  const [ibanMsg, setIbanMsg] = useState('')

  // Get admin token from main admin session
  const adminToken = localStorage.getItem('zoe.token')

  async function loadTx() {
    if (!adminToken) return
    try {
      const d = await fetchApi(`/admin-finance/${tab}?status=${status}`)
      setItems(tab === 'deposits' ? d.deposits : d.withdrawals)
      setTotal(d.total)
    } catch {}
  }

  async function loadIbans() {
    if (!adminToken) return
    try {
      const d = await fetchApi('/admin-finance/ibans')
      setIbans(d.ibans)
    } catch {}
  }

  useEffect(() => {
    if (!auth) return
    if (tab === 'ibans') loadIbans()
    else loadTx()
  }, [auth, tab, status])

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 8px 40px rgba(0,0,0,.12)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Finans Paneli</h2>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>Yetkili giriş gerekli</p>
          </div>
          <input
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            type="password" placeholder="Panel şifresi" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && pass === PANEL_PASS) { localStorage.setItem(TOKEN_KEY, PANEL_PASS); setAuth(true) } }}
          />
          <button
            style={{ width: '100%', padding: '11px 0', borderRadius: 8, background: '#f5c518', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            onClick={() => { if (pass === PANEL_PASS) { localStorage.setItem(TOKEN_KEY, PANEL_PASS); setAuth(true) } else alert('Şifre hatalı') }}
          >Giriş Yap</button>
        </div>
      </div>
    )
  }

  async function approve(id: string) {
    await fetchApi(`/admin-finance/${tab === 'deposits' ? 'deposits' : 'withdrawals'}/${id}/approve`, { method: 'POST', body: '{}' })
    setMsg('Onaylandı'); loadTx()
  }

  async function reject(id: string) {
    await fetchApi(`/admin-finance/${tab === 'deposits' ? 'deposits' : 'withdrawals'}/${id}/reject`, { method: 'POST', body: JSON.stringify({ note: rejectNote }) })
    setRejectId(null); setRejectNote(''); setMsg('Reddedildi'); loadTx()
  }

  async function addIban() {
    if (!bankName || !accountName || !iban) return setIbanMsg('Tüm alanlar zorunlu')
    try {
      await fetchApi('/admin-finance/ibans', { method: 'POST', body: JSON.stringify({ bank_name: bankName, account_name: accountName, iban, logo: logo || null }) })
      setBankName(''); setAccountName(''); setIban(''); setLogo(''); setIbanMsg('Eklendi'); loadIbans()
    } catch (e: any) { setIbanMsg(e.message) }
  }

  async function toggleIban(id: string, active: number) {
    await fetchApi(`/admin-finance/ibans/${id}`, { method: 'PATCH', body: JSON.stringify({ active: active ? 0 : 1 }) }); loadIbans()
  }

  async function delIban(id: string) {
    if (!confirm('Sil?')) return
    await fetchApi(`/admin-finance/ibans/${id}`, { method: 'DELETE' }); loadIbans()
  }

  const S = { // styles
    page: { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Inter,sans-serif' } as React.CSSProperties,
    header: { background: '#1a1a2e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.06)' } as React.CSSProperties,
    badge: (s: string) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s === 'completed' ? '#dcfce7' : s === 'rejected' ? '#fee2e2' : '#fef9c3', color: s === 'completed' ? '#166534' : s === 'rejected' ? '#991b1b' : '#854d0e' }) as React.CSSProperties,
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>💰</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Finans Paneli</span>
        </div>
        <button onClick={() => { localStorage.removeItem(TOKEN_KEY); setAuth(false) }}
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Çıkış
        </button>
      </header>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['deposits', 'withdrawals', 'ibans'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === t ? '#1a1a2e' : '#fff', color: tab === t ? '#f5c518' : '#374151',
              boxShadow: '0 2px 8px rgba(0,0,0,.06)'
            }}>
              {t === 'deposits' ? '💰 Yatırımlar' : t === 'withdrawals' ? '📤 Çekimler' : '🏦 IBAN\'lar'}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '10px 16px', background: '#dcfce7', borderRadius: 8, color: '#166534', fontWeight: 600, fontSize: 13 }}>{msg}</div>}

        {/* Deposits / Withdrawals */}
        {tab !== 'ibans' && (
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['pending', 'completed', 'rejected'].map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: '6px 14px', borderRadius: 6, border: `2px solid ${status === s ? '#1a1a2e' : '#e5e7eb'}`,
                  background: status === s ? '#1a1a2e' : '#fff', color: status === s ? '#f5c518' : '#374151',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer'
                }}>
                  {s === 'pending' ? 'Bekliyor' : s === 'completed' ? 'Onaylı' : 'Reddedildi'} {status === s && `(${total})`}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Kullanıcı', 'Tutar', 'Yöntem', 'Referans', 'Durum', 'Tarih', 'İşlem'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Kayıt yok</td></tr>}
                  {items.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#111' }}>{tx.name} {tx.surname}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{tx.email}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{tx.phone}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: tab === 'deposits' ? '#166534' : '#991b1b', fontSize: 15 }}>
                        ₺{tx.amount?.toLocaleString('tr-TR')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{tx.method || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 11 }}>{tx.reference_id || '—'}</td>
                      <td style={{ padding: '10px 12px' }}><span style={S.badge(tx.status)}>{tx.status === 'completed' ? 'Onaylı' : tx.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}</span></td>
                      <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: 11 }}>{new Date(tx.created_at).toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {tx.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => approve(tx.id)} style={{ padding: '5px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✓ Onayla</button>
                            <button onClick={() => { setRejectId(tx.id); setRejectNote('') }} style={{ padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✕ Reddet</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IBANs */}
        {tab === 'ibans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={S.card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>+ Yeni IBAN Ekle</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, marginBottom: 10 }}>
                <input style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Banka Adı *" />
                <input style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Hesap Sahibi *" />
                <input style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'monospace' }} value={iban} onChange={e => setIban(e.target.value)} placeholder="IBAN *" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setLogo(r.result as string); r.readAsDataURL(f) }} style={{ fontSize: 12 }} />
                {logo && <img src={logo} alt="" style={{ height: 32, objectFit: 'contain', background: '#f9fafb', borderRadius: 4, padding: 2 }} />}
              </div>
              {ibanMsg && <div style={{ fontSize: 12, color: ibanMsg === 'Eklendi' ? '#166534' : '#dc2626', marginBottom: 8 }}>{ibanMsg}</div>}
              <button onClick={addIban} style={{ padding: '9px 24px', background: '#1a1a2e', color: '#f5c518', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>IBAN Ekle</button>
            </div>

            <div style={S.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Logo', 'Banka', 'Hesap Sahibi', 'IBAN', 'Durum', 'İşlem'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ibans.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px' }}>{i.logo ? <img src={i.logo} alt="" style={{ height: 32, objectFit: 'contain' }} /> : '🏦'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{i.bank_name}</td>
                      <td style={{ padding: '10px 12px' }}>{i.account_name}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{i.iban}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: i.active ? '#dcfce7' : '#fee2e2', color: i.active ? '#166534' : '#991b1b' }}>{i.active ? 'Aktif' : 'Pasif'}</span></td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => toggleIban(i.id, i.active)} style={{ padding: '4px 10px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{i.active ? 'Pasif' : 'Aktif'}</button>
                          <button onClick={() => delIban(i.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Reddetme Nedeni</h3>
            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Opsiyonel not..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRejectId(null)} style={{ flex: 1, padding: '9px 0', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={() => reject(rejectId)} style={{ flex: 1, padding: '9px 0', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Reddet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
