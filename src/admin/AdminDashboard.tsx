import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type HourlyPoint = { hour: string; total: number }
type Stats = {
  totalUsers: number; verifiedUsers: number; totalBalance: number
  pendingDeposits: number; pendingWithdrawals: number
  todayDeposits: number; todayDepositsCount: number
  todayWithdrawalsTotal: number; todayWithdrawalsCount: number
  todayNewUsers: number; totalActiveUsers: number
  totalDeposits: number; totalWithdrawals: number
  recentUsers: any[]; recentTx: any[]
  hourlyDeposits: HourlyPoint[]
}

function MiniBar({ data }: { data: HourlyPoint[] }) {
  if (!data || data.length === 0) return <div style={{ color: '#4b5563', fontSize: 12, padding: '8px 0' }}>Son 24 saatte işlem yok</div>
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map(d => (
        <div key={d.hour} title={`${d.hour}:00 — ₺${d.total.toLocaleString('tr-TR')}`} style={{ flex: 1, background: 'rgba(245,197,24,.7)', borderRadius: '2px 2px 0 0', height: `${Math.max((d.total / max) * 100, 4)}%`, minWidth: 4, cursor: 'default', transition: 'height .3s' }} />
      ))}
    </div>
  )
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

      {/* Alert banners */}
      {stats.pendingDeposits > 0 && (
        <div className="zoe-alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ <strong>{stats.pendingDeposits}</strong> bekleyen yatırım talebi var!</span>
          <a href="/admin/finance" style={{ color: '#fca5a5', fontSize: 12, textDecoration: 'underline' }}>İncele →</a>
        </div>
      )}
      {stats.pendingWithdrawals > 0 && (
        <div className="zoe-alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ <strong>{stats.pendingWithdrawals}</strong> bekleyen çekim talebi var!</span>
          <a href="/admin/finance" style={{ color: '#fca5a5', fontSize: 12, textDecoration: 'underline' }}>İncele →</a>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Toplam Üye', value: stats.totalUsers, color: '#f5c518', icon: '👥' },
          { label: 'Aktif Üye', value: stats.totalActiveUsers, color: '#86efac', icon: '✅' },
          { label: 'Bugün Yeni Üye', value: stats.todayNewUsers, color: '#f5c518', icon: '🆕' },
          { label: 'Toplam Bakiye', value: `₺${stats.totalBalance?.toLocaleString('tr-TR')}`, color: '#f5c518', icon: '💰' },
          { label: 'Bugün Yatırım', value: `₺${stats.todayDeposits?.toLocaleString('tr-TR')}`, color: '#86efac', icon: '📥', sub: `${stats.todayDepositsCount} işlem` },
          { label: 'Bugün Çekim', value: `₺${stats.todayWithdrawalsTotal?.toLocaleString('tr-TR')}`, color: '#fca5a5', icon: '📤', sub: `${stats.todayWithdrawalsCount} işlem` },
          { label: 'Bekleyen Yatırım', value: stats.pendingDeposits, color: stats.pendingDeposits > 0 ? '#fca5a5' : '#6b7280', icon: '⏳' },
          { label: 'Bekleyen Çekim', value: stats.pendingWithdrawals, color: stats.pendingWithdrawals > 0 ? '#fca5a5' : '#6b7280', icon: '⏳' },
        ].map(k => (
          <div key={k.label} className="zoe-kpi" style={{ position: 'relative' }}>
            <span style={{ fontSize: 11 }}>{k.icon} {k.label}</span>
            <strong style={{ color: k.color, fontSize: 20 }}>{k.value}</strong>
            {(k as any).sub && <span style={{ fontSize: 10, color: '#6b7280' }}>{(k as any).sub}</span>}
          </div>
        ))}
      </div>

      {/* Chart + totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="zoe-panel">
          <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 10 }}>📈 Son 24 Saat — Saatlik Yatırım</div>
          <MiniBar data={stats.hourlyDeposits} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#6b7280' }}>
            <span>Toplam Yatırım: <strong style={{ color: '#86efac' }}>₺{stats.totalDeposits?.toLocaleString('tr-TR')}</strong></span>
            <span>Toplam Çekim: <strong style={{ color: '#fca5a5' }}>₺{stats.totalWithdrawals?.toLocaleString('tr-TR')}</strong></span>
          </div>
        </div>

        {/* Recent 5 users */}
        <div className="zoe-panel">
          <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>👥 Son Kayıt Olan Üyeler</div>
          {stats.recentUsers.length === 0 && <div className="zoe-muted">Henüz üye yok</div>}
          {stats.recentUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div>
                <div style={{ fontSize: 13, color: '#f9fafb', fontWeight: 600 }}>{u.name} {u.surname}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(u.created_at).toLocaleDateString('tr-TR')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent 10 transactions */}
      <div className="zoe-panel">
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>💰 Son 10 İşlem</div>
        {stats.recentTx.length === 0 && <div className="zoe-muted">Henüz işlem yok</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 8, padding: '6px 10px', background: '#111118', borderRadius: 6, fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            <span>Kullanıcı</span><span>Tür</span><span>Tutar</span><span>Durum</span><span>Tarih</span>
          </div>
          {stats.recentTx.map(tx => (
            <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 8, padding: '9px 10px', background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)', alignItems: 'center', fontSize: 12 }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{tx.email}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{tx.type === 'deposit' ? '📥 Yatırım' : '📤 Çekim'}</div>
              <div style={{ fontWeight: 700, color: tx.type === 'deposit' ? '#86efac' : '#fca5a5' }}>
                {tx.type === 'deposit' ? '+' : '-'}₺{tx.amount?.toLocaleString('tr-TR')}
              </div>
              <span className={`zoe-badge ${tx.status === 'completed' ? 'zoe-badge--on' : tx.status === 'rejected' ? 'zoe-badge--off' : ''}`} style={{ fontSize: 10 }}>
                {tx.status === 'completed' ? 'Onaylı' : tx.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
              </span>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(tx.created_at).toLocaleString('tr-TR')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
