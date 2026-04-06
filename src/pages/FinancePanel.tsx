import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api/client'

function fpFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('fp.token')
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${API_URL}/finance-panel${endpoint}`, { ...options, headers }).then(async r => {
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Hata')
    return data
  })
}

type Tx = { id: string; email: string; name: string; surname: string; phone: string; amount: number; method: string; status: string; reference_id: string; created_at: string; type: string }
type Iban = { id: string; bank_name: string; account_name: string; iban: string; logo: string; active: number }
type Stats = { pendingDeposits: number; pendingWithdrawals: number; todayDepositsTotal: number; todayDepositsCount: number; todayWithdrawalsTotal: number; todayWithdrawalsCount: number; totalBalance: number }

export function FinancePanelPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'deposits' | 'withdrawals' | 'ibans'>('deposits')
  const [stats, setStats] = useState<Stats | null>(null)
  const [deposits, setDeposits] = useState<Tx[]>([])
  const [withdrawals, setWithdrawals] = useState<Tx[]>([])
  const [ibans, setIbans] = useState<Iban[]>([])
  const [depStatus, setDepStatus] = useState('pending')
  const [wdStatus, setWdStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  // IBAN form
  const [ibanForm, setIbanForm] = useState({ bank_name: '', account_name: '', iban: '', logo: '' })
  const [ibanMsg, setIbanMsg] = useState('')

  const user = (() => { try { return JSON.parse(localStorage.getItem('fp.user') || '{}') } catch { return {} } })()

  function logout() {
    localStorage.removeItem('fp.token')
    localStorage.removeItem('fp.user')
    navigate('/finans-panel/login')
  }

  const loadStats = useCallback(() => {
    fpFetch('/stats').then(setStats).catch(() => {})
  }, [])

  const loadDeposits = useCallback(() => {
    fpFetch(`/deposits?status=${depStatus}`).then(d => setDeposits(d.deposits || [])).catch(() => {})
  }, [depStatus])

  const loadWithdrawals = useCallback(() => {
    fpFetch(`/withdrawals?status=${wdStatus}`).then(d => setWithdrawals(d.withdrawals || [])).catch(() => {})
  }, [wdStatus])

  const loadIbans = useCallback(() => {
    fpFetch('/ibans').then(d => setIbans(d.ibans || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('fp.token')
    if (!token) { navigate('/finans-panel/login'); return }
    loadStats()
    loadDeposits()
    loadWithdrawals()
    loadIbans()
  }, [navigate, loadStats, loadDeposits, loadWithdrawals, loadIbans])

  useEffect(() => { loadDeposits() }, [loadDeposits])
  useEffect(() => { loadWithdrawals() }, [loadWithdrawals])

  async function action(type: 'deposits' | 'withdrawals', id: string, act: 'approve' | 'reject') {
    setLoading(true); setMsg(null)
    try {
      await fpFetch(`/${type}/${id}/${act}`, { method: 'POST' })
      setMsg({ text: act === 'approve' ? 'Onaylandı ✓' : 'Reddedildi ✓', ok: true })
      loadStats(); loadDeposits(); loadWithdrawals()
    } catch (e: any) {
      setMsg({ text: e.message, ok: false })
    } finally { setLoading(false) }
  }

  async function addIban() {
    if (!ibanForm.bank_name || !ibanForm.account_name || !ibanForm.iban) { setIbanMsg('Tüm alanları doldurun'); return }
    try {
      await fpFetch('/ibans', { method: 'POST', body: JSON.stringify(ibanForm) })
      setIbanForm({ bank_name: '', account_name: '', iban: '', logo: '' })
      setIbanMsg('IBAN eklendi ✓')
      loadIbans()
    } catch (e: any) { setIbanMsg(e.message) }
  }

  async function toggleIban(id: string, active: number) {
    await fpFetch(`/ibans/${id}`, { method: 'PATCH', body: JSON.stringify({ active: active ? 0 : 1 }) })
    loadIbans()
  }

  async function deleteIban(id: string) {
    if (!confirm('Bu IBAN silinsin mi?')) return
    await fpFetch(`/ibans/${id}`, { method: 'DELETE' })
    loadIbans()
  }

  const s = { fontFamily: 'Inter,system-ui,sans-serif', minHeight: '100vh', background: '#111118', color: '#e5e7eb' }

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ background: '#1a1a24', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>💰</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#f9fafb' }}>BahisMosco Finans Paneli</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Hoş geldin, {user.name || user.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          Çıkış
        </button>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Bekleyen Yatırım', value: stats.pendingDeposits, alert: stats.pendingDeposits > 0, icon: '⏳' },
              { label: 'Bekleyen Çekim', value: stats.pendingWithdrawals, alert: stats.pendingWithdrawals > 0, icon: '⏳' },
              { label: "Bugün Yatırım", value: `₺${stats.todayDepositsTotal?.toLocaleString('tr-TR')} (${stats.todayDepositsCount})`, alert: false, icon: '📥' },
              { label: "Bugün Çekim", value: `₺${stats.todayWithdrawalsTotal?.toLocaleString('tr-TR')} (${stats.todayWithdrawalsCount})`, alert: false, icon: '📤' },
            ].map(k => (
              <div key={k.label} style={{ background: '#1e1e2a', borderRadius: 10, border: `1px solid ${k.alert ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.07)'}`, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{k.icon} {k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.alert ? '#fca5a5' : '#f5c518' }}>{k.value}</div>
                {k.alert && <div style={{ fontSize: 10, color: '#fca5a5', marginTop: 4 }}>⚠️ Onay bekliyor!</div>}
              </div>
            ))}
          </div>
        )}

        {/* Alert banner */}
        {stats && (stats.pendingDeposits > 0 || stats.pendingWithdrawals > 0) && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', fontSize: 13 }}>
            ⚠️ {stats.pendingDeposits > 0 && `${stats.pendingDeposits} bekleyen yatırım`}{stats.pendingDeposits > 0 && stats.pendingWithdrawals > 0 && ' ve '}{stats.pendingWithdrawals > 0 && `${stats.pendingWithdrawals} bekleyen çekim`} onay bekliyor!
          </div>
        )}

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: msg.ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.4)'}`, color: msg.ok ? '#86efac' : '#fca5a5', fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['deposits', 'withdrawals', 'ibans'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 7, border: `1px solid ${tab === t ? 'rgba(245,197,24,.6)' : 'rgba(255,255,255,.1)'}`,
              background: tab === t ? 'rgba(245,197,24,.1)' : '#1e1e2a', color: tab === t ? '#f5c518' : '#9ca3af',
              fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit'
            }}>
              {t === 'deposits' ? '📥 Yatırımlar' : t === 'withdrawals' ? '📤 Çekimler' : '🏦 IBAN Yönetimi'}
            </button>
          ))}
        </div>

        {/* Deposits */}
        {tab === 'deposits' && (
          <div style={{ background: '#1e1e2a', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <strong style={{ color: '#f9fafb' }}>📥 Yatırım Talepleri</strong>
              <select value={depStatus} onChange={e => setDepStatus(e.target.value)} style={{ background: '#111118', border: '1px solid rgba(255,255,255,.1)', color: '#e5e7eb', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontFamily: 'inherit' }}>
                <option value="pending">Bekleyen</option>
                <option value="completed">Onaylanan</option>
                <option value="rejected">Reddedilen</option>
              </select>
            </div>
            <TxTable txs={deposits} type="deposits" onAction={action} loading={loading} />
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div style={{ background: '#1e1e2a', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <strong style={{ color: '#f9fafb' }}>📤 Çekim Talepleri</strong>
              <select value={wdStatus} onChange={e => setWdStatus(e.target.value)} style={{ background: '#111118', border: '1px solid rgba(255,255,255,.1)', color: '#e5e7eb', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontFamily: 'inherit' }}>
                <option value="pending">Bekleyen</option>
                <option value="completed">Onaylanan</option>
                <option value="rejected">Reddedilen</option>
              </select>
            </div>
            <TxTable txs={withdrawals} type="withdrawals" onAction={action} loading={loading} />
          </div>
        )}

        {/* IBANs */}
        {tab === 'ibans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Add IBAN form */}
            <div style={{ background: '#1e1e2a', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)', padding: 16 }}>
              <strong style={{ color: '#f9fafb', display: 'block', marginBottom: 12 }}>➕ Yeni IBAN Ekle</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {[
                  { label: 'Banka Adı', key: 'bank_name', placeholder: 'Ziraat Bankası' },
                  { label: 'Hesap Sahibi', key: 'account_name', placeholder: 'Ad Soyad' },
                  { label: 'IBAN', key: 'iban', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
                  { label: 'Logo URL (opsiyonel)', key: 'logo', placeholder: 'https://...' },
                ].map(f => (
                  <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{f.label}</span>
                    <input
                      style={{ background: '#111118', border: '1px solid rgba(255,255,255,.1)', color: '#e5e7eb', borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}
                      value={(ibanForm as any)[f.key]} onChange={e => setIbanForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  </label>
                ))}
              </div>
              {ibanMsg && <div style={{ marginTop: 8, fontSize: 12, color: ibanMsg.includes('✓') ? '#86efac' : '#fca5a5' }}>{ibanMsg}</div>}
              <button onClick={addIban} style={{ marginTop: 12, background: '#f5c518', color: '#111', border: 'none', borderRadius: 6, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                IBAN Ekle
              </button>
            </div>

            {/* IBAN list */}
            <div style={{ background: '#1e1e2a', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)', padding: 16 }}>
              <strong style={{ color: '#f9fafb', display: 'block', marginBottom: 12 }}>🏦 Mevcut IBAN'lar</strong>
              {ibans.length === 0 && <div style={{ color: '#6b7280', fontSize: 13 }}>Henüz IBAN yok</div>}
              {ibans.map(ib => (
                <div key={ib.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {ib.logo ? <img src={ib.logo} alt={ib.bank_name} style={{ width: 32, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} /> : <span style={{ fontSize: 20 }}>🏦</span>}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb' }}>{ib.bank_name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{ib.account_name}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#f5c518' }}>{ib.iban}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: ib.active ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: ib.active ? '#86efac' : '#fca5a5', border: `1px solid ${ib.active ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}` }}>
                      {ib.active ? 'Aktif' : 'Pasif'}
                    </span>
                    <button onClick={() => toggleIban(ib.id, ib.active)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#e5e7eb', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                      {ib.active ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button onClick={() => deleteIban(ib.id)} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TxTable({ txs, type, onAction, loading }: { txs: Tx[]; type: 'deposits' | 'withdrawals'; onAction: (type: 'deposits' | 'withdrawals', id: string, act: 'approve' | 'reject') => void; loading: boolean }) {
  if (txs.length === 0) return <div style={{ color: '#6b7280', fontSize: 13, padding: '8px 0' }}>İşlem bulunamadı</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 8, padding: '6px 10px', background: '#111118', borderRadius: 6, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        <span>Kullanıcı</span><span>Tutar</span><span>Yöntem</span><span>Referans</span><span>Durum</span><span>İşlem</span>
      </div>
      {txs.map(tx => (
        <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', gap: 8, padding: '10px', background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)', alignItems: 'center', fontSize: 12 }}>
          <div>
            <div style={{ color: '#f9fafb', fontWeight: 600 }}>{tx.name} {tx.surname}</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>{tx.email}</div>
            <div style={{ color: '#6b7280', fontSize: 10 }}>{new Date(tx.created_at).toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ fontWeight: 700, color: type === 'deposits' ? '#86efac' : '#fca5a5' }}>₺{tx.amount?.toLocaleString('tr-TR')}</div>
          <div style={{ color: '#9ca3af' }}>{tx.method || '—'}</div>
          <div style={{ color: '#9ca3af', fontSize: 10, wordBreak: 'break-all' }}>{tx.reference_id || '—'}</div>
          <div>
            <span style={{
              padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: tx.status === 'completed' ? 'rgba(34,197,94,.1)' : tx.status === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(245,197,24,.1)',
              color: tx.status === 'completed' ? '#86efac' : tx.status === 'rejected' ? '#fca5a5' : '#f5c518',
              border: `1px solid ${tx.status === 'completed' ? 'rgba(34,197,94,.3)' : tx.status === 'rejected' ? 'rgba(239,68,68,.3)' : 'rgba(245,197,24,.3)'}`
            }}>
              {tx.status === 'completed' ? 'Onaylı' : tx.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {tx.status === 'pending' && (
              <>
                <button disabled={loading} onClick={() => onAction(type, tx.id, 'approve')} style={{ background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.4)', color: '#86efac', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                  Onayla
                </button>
                <button disabled={loading} onClick={() => onAction(type, tx.id, 'reject')} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                  Reddet
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
