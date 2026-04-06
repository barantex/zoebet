import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchApi } from '../api/client'
import type { Transaction } from '../lib/types'

type Iban = { id: string; bank_name: string; account_name: string; iban: string }

export function FinancePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Banka Havalesi')
  const [reference, setReference] = useState('')
  const [withdrawIban, setWithdrawIban] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ibans, setIbans] = useState<Iban[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    try {
      const [balData, txData, ibanData] = await Promise.all([
        fetchApi('/finance/balance'),
        fetchApi('/finance/history'),
        fetchApi('/finance/ibans'),
      ])
      setBalance(balData.balance ?? 0)
      setTransactions(txData.transactions ?? [])
      setIbans(ibanData.ibans ?? [])
    } catch {}
  }

  useEffect(() => { if (user) load() }, [user])

  if (!user) {
    return (
      <div className="zoe-panel">
        <h2 style={{ marginBottom: 8 }}>Cüzdan</h2>
        <p className="zoe-muted">Bu sayfayı görmek için giriş yapmalısın.</p>
      </div>
    )
  }

  async function handleSubmit() {
    const parsed = Number(amount.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Geçerli bir tutar gir.')
    if (tab === 'withdraw' && parsed > balance) return setError('Yetersiz bakiye.')

    setLoading(true); setError(null); setSuccess(null)
    try {
      await fetchApi('/finance/transaction', {
        method: 'POST',
        body: JSON.stringify({
          type: tab,
          amount: parsed,
          method,
          reference_id: reference || undefined,
          withdraw_iban: withdrawIban || undefined,
        }),
      })
      setSuccess(tab === 'deposit' ? 'Yatırım talebiniz alındı. Admin onayı bekleniyor.' : 'Çekim talebiniz alındı. İşleme alınacak.')
      setAmount(''); setReference(''); setWithdrawIban('')
      load()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const activeIbans = ibans.filter(i => (i as any).active !== 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="zoe-page-head">
        <h2>💰 Cüzdan</h2>
        <p>Bakiyeni yönet, işlem geçmişini takip et.</p>
      </div>

      {/* Balance */}
      <div className="zoe-panel" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Toplam Bakiye</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f5c518' }}>₺{balance.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ padding: '10px 16px', background: '#111118', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Toplam Yatırım</div>
            <div style={{ fontWeight: 700, color: '#86efac' }}>₺{transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((a, t) => a + t.amount, 0).toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ padding: '10px 16px', background: '#111118', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Toplam Çekim</div>
            <div style={{ fontWeight: 700, color: '#fca5a5' }}>₺{transactions.filter(t => t.type === 'withdraw' && t.status === 'completed').reduce((a, t) => a + t.amount, 0).toLocaleString('tr-TR')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Action form */}
        <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`zoe-chip${tab === 'deposit' ? ' zoe-chip--active' : ''}`} onClick={() => { setTab('deposit'); setError(null); setSuccess(null) }}>Para Yatır</button>
            <button className={`zoe-chip${tab === 'withdraw' ? ' zoe-chip--active' : ''}`} onClick={() => { setTab('withdraw'); setError(null); setSuccess(null) }}>Para Çek</button>
          </div>

          {tab === 'deposit' && activeIbans.length > 0 && (
            <div style={{ background: '#111118', borderRadius: 8, padding: 12, border: '1px solid rgba(245,197,24,.2)' }}>
              <div style={{ fontSize: 12, color: '#f5c518', fontWeight: 700, marginBottom: 8 }}>🏦 Yatırım Yapılacak Hesaplar</div>
              {activeIbans.map(ib => (
                <div key={ib.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(ib as any).logo
                    ? <img src={(ib as any).logo} alt={ib.bank_name} style={{ width: 36, height: 36, objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 3, flexShrink: 0 }} />
                    : <span style={{ fontSize: 24, flexShrink: 0 }}>🏦</span>
                  }
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{ib.bank_name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{ib.account_name}</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#f5c518', letterSpacing: '.05em', cursor: 'pointer' }}
                      onClick={() => navigator.clipboard?.writeText(ib.iban)}
                      title="Kopyalamak için tıkla"
                    >{ib.iban} 📋</div>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Havaleyi yaptıktan sonra aşağıya tutarı ve dekont/referans numarasını girin.</p>
            </div>
          )}

          <label className="zoe-field">
            <span className="zoe-field-label">Tutar (₺)</span>
            <input className="zoe-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" />
          </label>

          <label className="zoe-field">
            <span className="zoe-field-label">Yöntem</span>
            <select className="zoe-input" value={method} onChange={e => setMethod(e.target.value)}>
              {['Banka Havalesi', 'Papara', 'Kripto', 'Kredi Kartı'].map(m => <option key={m}>{m}</option>)}
            </select>
          </label>

          {tab === 'deposit' && (
            <label className="zoe-field">
              <span className="zoe-field-label">Dekont / Referans No (opsiyonel)</span>
              <input className="zoe-input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Havale referans numarası" />
            </label>
          )}

          {tab === 'withdraw' && (
            <label className="zoe-field">
              <span className="zoe-field-label">Çekim IBAN'ı</span>
              <input className="zoe-input" value={withdrawIban} onChange={e => setWithdrawIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
            </label>
          )}

          {error && <div className="zoe-alert">{error}</div>}
          {success && <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', color: '#86efac', fontSize: 13 }}>{success}</div>}

          <button className="zoe-btn zoe-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Gönderiliyor…' : tab === 'deposit' ? 'Yatırım Talebi Gönder' : 'Çekim Talebi Gönder'}
          </button>
        </div>

        {/* Transaction history */}
        <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong style={{ color: '#f9fafb' }}>İşlem Geçmişi</strong>
          <div className="zoe-finance-table">
            <div className="zoe-finance-row zoe-finance-row--head">
              <span>Tür</span><span>Tutar</span><span>Yöntem</span><span>Durum</span><span>Tarih</span>
            </div>
            {transactions.length === 0 && <div style={{ padding: 12, color: '#6b7280', fontSize: 13 }}>Henüz işlem yok</div>}
            {transactions.map(tx => (
              <div key={tx.id} className="zoe-finance-row">
                <span className={tx.type === 'deposit' ? 'zoe-finance-positive' : 'zoe-finance-negative'}>
                  {tx.type === 'deposit' ? '↓ Yatırım' : '↑ Çekim'}
                </span>
                <span>₺{tx.amount?.toLocaleString('tr-TR')}</span>
                <span style={{ fontSize: 11 }}>{tx.method || '—'}</span>
                <span className={`zoe-badge ${tx.status === 'completed' ? 'zoe-badge--on' : tx.status === 'rejected' ? 'zoe-badge--off' : ''}`}>
                  {tx.status === 'completed' ? 'Onaylandı' : tx.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                </span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{new Date(tx.created_at || tx.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
