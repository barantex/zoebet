import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Stats = {
  totalUsers: number; verifiedUsers: number; totalBalance: number
  pendingDeposits: number; pendingWithdrawals: number
  todayDeposits: number; totalDeposits: number; totalWithdrawals: number
  recentUsers: any[]; recentTx: any[]
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/admin/stats').then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="zoe-muted">Yükleniyor…</div>
  if (!stats) return <div className="zoe-muted">İstatistikler yüklenemedi.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="zoe-page-head">
        <h2>📊 Dashboard</h2>
        <p>Sitenin genel durumu</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Toplam Üye', value: stats.totalUsers, color: '#f5c518' },
          { label: 'Doğrulanmış', value: stats.verifiedUsers, color: '#86efac' },
          { label: 'Toplam Bakiye', value: `₺${stats.totalBalance?.toLocaleString('tr-TR')}`, color: '#f5c518' },
          { label: 'Bugün Yatırım', value: `₺${stats.todayDeposits?.toLocaleString('tr-TR')}`, color: '#86efac' },
          { label: 'Bekleyen Yatırım', value: stats.pendingDeposits, color: stats.pendingDeposits > 0 ? '#fca5a5' : '#6b7280' },
          { label: 'Bekleyen Çekim', value: stats.pendingWithdrawals, color: stats.pendingWithdrawals > 0 ? '#fca5a5' : '#6b7280' },
          { label: 'Toplam Yatırım', value: `₺${stats.totalDeposits?.toLocaleString('tr-TR')}`, color: '#86efac' },
          { label: 'Toplam Çekim', value: `₺${stats.totalWithdrawals?.toLocaleString('tr-TR')}`, color: '#fca5a5' },
        ].map(k => (
          <div key={k.label} className="zoe-kpi">
            <span>{k.label}</span>
            <strong style={{ color: k.color, fontSize: 20 }}>{k.value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent users */}
        <div className="zoe-panel">
          <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>👥 Son Kayıt Olan Üyeler</div>
          {stats.recentUsers.length === 0 && <div className="zoe-muted">Henüz üye yok</div>}
          {stats.recentUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div>
                <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 600 }}>{u.name} {u.surname}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(u.created_at).toLocaleDateString('tr-TR')}</div>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div className="zoe-panel">
          <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>💰 Son İşlemler</div>
          {stats.recentTx.length === 0 && <div className="zoe-muted">Henüz işlem yok</div>}
          {stats.recentTx.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{tx.email}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{tx.type === 'deposit' ? 'Yatırım' : 'Çekim'} · {tx.method || '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'deposit' ? '#86efac' : '#fca5a5' }}>
                  {tx.type === 'deposit' ? '+' : '-'}₺{tx.amount?.toLocaleString('tr-TR')}
                </div>
                <span className={`zoe-badge ${tx.status === 'completed' ? 'zoe-badge--on' : tx.status === 'rejected' ? 'zoe-badge--off' : ''}`} style={{ fontSize: 10 }}>
                  {tx.status === 'completed' ? 'Onaylı' : tx.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
