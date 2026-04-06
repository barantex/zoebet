import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type User = {
  id: string; email: string; name: string; surname: string
  phone: string; tc: string; role: string; verified: number
  balance: number; created_at: string
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const data = await fetchApi(`/admin/users?${params}`)
      setUsers(data.users)
      setTotal(data.total)
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search])

  async function openUser(u: User) {
    const data = await fetchApi(`/admin/users/${u.id}`)
    setSelected(data.user)
    setEditBalance(String(data.user.balance))
    setEditPassword('')
    setEditRole(data.user.role)
    setMsg(null)
  }

  async function saveUser() {
    if (!selected) return
    const body: any = { role: editRole, balance: Number(editBalance) }
    if (editPassword) body.password = editPassword
    try {
      await fetchApi(`/admin/users/${selected.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      setMsg('✓ Kaydedildi')
      load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function verifyUser(id: string) {
    await fetchApi(`/admin/users/${id}/verify`, { method: 'POST', body: '{}' })
    setMsg('✓ Doğrulandı')
    load()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, verified: 1 } : null)
  }

  async function deleteUser(id: string) {
    if (!confirm('Bu kullanıcıyı silmek istediğine emin misin?')) return
    await fetchApi(`/admin/users/${id}`, { method: 'DELETE' })
    setSelected(null)
    load()
  }

  const pages = Math.ceil(total / 20)

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="zoe-page-head">
          <h2>👥 Kullanıcılar</h2>
          <p>Toplam {total} kayıt</p>
        </div>

        <input className="zoe-input" placeholder="E-posta, ad, telefon veya TC ara…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />

        <div className="zoe-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="zoe-admin-table">
            <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
              <span>Kullanıcı</span><span>Telefon</span><span>Bakiye</span><span>Rol</span><span>Durum</span><span>İşlem</span>
            </div>
            {loading && <div style={{ padding: 16, color: '#6b7280' }}>Yükleniyor…</div>}
            {users.map(u => (
              <div key={u.id} className="zoe-admin-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr' }}>
                <div>
                  <strong className="zoe-admin-strong">{u.name} {u.surname}</strong>
                  <div className="zoe-muted" style={{ fontSize: 11 }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 12 }}>{u.phone}</span>
                <span style={{ color: '#f5c518', fontWeight: 700 }}>₺{u.balance?.toLocaleString('tr-TR')}</span>
                <span className={'zoe-badge ' + (u.role === 'admin' ? 'zoe-badge--on' : '')}>{u.role}</span>
                <span className={'zoe-badge ' + (u.verified ? 'zoe-badge--on' : 'zoe-badge--off')}>
                  {u.verified ? 'Doğrulandı' : 'Bekliyor'}
                </span>
                <div className="zoe-admin-actions">
                  <button className="zoe-btn zoe-btn--outline zoe-btn--sm" onClick={() => openUser(u)}>Düzenle</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Önceki</button>
            <span style={{ padding: '5px 12px', color: '#9ca3af', fontSize: 13 }}>{page} / {pages}</span>
            <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Sonraki →</button>
          </div>
        )}
      </div>

      {/* Edit panel */}
      {selected && (
        <div className="zoe-panel" style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#f9fafb' }}>Kullanıcı Düzenle</strong>
            <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
            <div><b style={{ color: '#e5e7eb' }}>Ad Soyad:</b> {selected.name} {selected.surname}</div>
            <div><b style={{ color: '#e5e7eb' }}>E-posta:</b> {selected.email}</div>
            <div><b style={{ color: '#e5e7eb' }}>Telefon:</b> {selected.phone}</div>
            <div><b style={{ color: '#e5e7eb' }}>TC:</b> {selected.tc}</div>
            <div><b style={{ color: '#e5e7eb' }}>Kayıt:</b> {new Date(selected.created_at).toLocaleString('tr-TR')}</div>
          </div>

          <label className="zoe-field">
            <span className="zoe-field-label">Bakiye (₺)</span>
            <input className="zoe-input" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
          </label>

          <label className="zoe-field">
            <span className="zoe-field-label">Rol</span>
            <select className="zoe-input" value={editRole} onChange={e => setEditRole(e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label className="zoe-field">
            <span className="zoe-field-label">Yeni Şifre (boş bırakırsan değişmez)</span>
            <input className="zoe-input" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="••••" />
          </label>

          {msg && <div style={{ fontSize: 12, color: msg.startsWith('✓') ? '#86efac' : '#fca5a5' }}>{msg}</div>}

          <button className="zoe-btn zoe-btn--primary" onClick={saveUser}>Kaydet</button>

          {!selected.verified && (
            <button className="zoe-btn zoe-btn--outline" onClick={() => verifyUser(selected.id)}>
              ✓ Manuel Doğrula
            </button>
          )}

          <button className="zoe-btn zoe-btn--ghost" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,.3)' }}
            onClick={() => deleteUser(selected.id)}>
            🗑 Kullanıcıyı Sil
          </button>
        </div>
      )}
    </div>
  )
}
