import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

const ALL_PERMISSIONS = [
  { key: 'finance', label: '💰 Finans (Yatırım/Çekim Onay)' },
  { key: 'users', label: '👥 Kullanıcı Yönetimi' },
  { key: 'games', label: '🎮 Oyun Yönetimi' },
  { key: 'banners', label: '🖼️ Banner Yönetimi' },
  { key: 'promotions', label: '🎁 Promosyon Yönetimi' },
  { key: 'matches', label: '⚽ Maç Yönetimi' },
  { key: 'wheel', label: '🎡 Çark Yönetimi' },
  { key: 'settings', label: '⚙️ Site Ayarları' },
]

type Staff = { id: string; email: string; name: string; permissions: string[]; active: number; created_at: string }

export function AdminStaffPage() {
  const [list, setList] = useState<Staff[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [perms, setPerms] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [editData, setEditData] = useState<Staff | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [editActive, setEditActive] = useState(1)
  const [editPass, setEditPass] = useState('')

  async function load() {
    const d = await fetchApi('/staff')
    setList(d.staff)
  }
  useEffect(() => { load() }, [])

  function togglePerm(p: string, arr: string[], set: (v: string[]) => void) {
    set(arr.includes(p) ? arr.filter(x => x !== p) : [...arr, p])
  }

  async function create() {
    if (!name || !email || !password) return setMsg('Ad, email ve şifre zorunlu')
    try {
      await fetchApi('/staff', { method: 'POST', body: JSON.stringify({ name, email, password, permissions: perms }) })
      setName(''); setEmail(''); setPassword(''); setPerms([]); setMsg('Personel oluşturuldu')
      load()
    } catch (e: any) { setMsg(e.message) }
  }

  function startEdit(s: Staff) {
    setEditId(s.id); setEditData(s); setEditPerms(s.permissions); setEditActive(s.active); setEditPass('')
  }

  async function saveEdit() {
    if (!editId) return
    await fetchApi(`/staff/${editId}`, { method: 'PATCH', body: JSON.stringify({ permissions: editPerms, active: editActive, password: editPass || undefined }) })
    setEditId(null); setMsg('Güncellendi'); load()
  }

  async function del(id: string) {
    if (!confirm('Sil?')) return
    await fetchApi(`/staff/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="zoe-page-head">
        <h2>👨‍💼 Personel Yönetimi</h2>
        <p>Personel ekle, yetki ver/kaldır</p>
      </div>

      {/* Create */}
      <div className="zoe-panel">
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>+ Yeni Personel</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label className="zoe-field"><span className="zoe-field-label">Ad Soyad *</span><input className="zoe-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ali Veli" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Email *</span><input className="zoe-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@bahismosco.com" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Şifre *</span><input className="zoe-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" /></label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Yetkiler:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_PERMISSIONS.map(p => (
              <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 10px', borderRadius: 6, background: perms.includes(p.key) ? 'rgba(245,197,24,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${perms.includes(p.key) ? 'rgba(245,197,24,.5)' : 'rgba(255,255,255,.08)'}`, fontSize: 12 }}>
                <input type="checkbox" checked={perms.includes(p.key)} onChange={() => togglePerm(p.key, perms, setPerms)} style={{ accentColor: '#f5c518' }} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.includes('oluşturuldu') || msg.includes('Güncellendi') ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
        <button className="zoe-btn zoe-btn--primary" onClick={create}>Personel Oluştur</button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map(s => (
          <div key={s.id} className="zoe-panel" style={{ padding: '14px 16px' }}>
            {editId === s.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#f9fafb' }}>{s.name} — {s.email}</strong>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span className="zoe-muted">Aktif:</span>
                    <input type="checkbox" checked={editActive === 1} onChange={e => setEditActive(e.target.checked ? 1 : 0)} style={{ accentColor: '#f5c518', width: 16, height: 16 }} />
                  </label>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Yetkiler:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 10px', borderRadius: 6, background: editPerms.includes(p.key) ? 'rgba(245,197,24,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${editPerms.includes(p.key) ? 'rgba(245,197,24,.5)' : 'rgba(255,255,255,.08)'}`, fontSize: 12 }}>
                        <input type="checkbox" checked={editPerms.includes(p.key)} onChange={() => togglePerm(p.key, editPerms, setEditPerms)} style={{ accentColor: '#f5c518' }} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="zoe-field" style={{ maxWidth: 280 }}>
                  <span className="zoe-field-label">Yeni Şifre (boş bırakırsan değişmez)</span>
                  <input className="zoe-input" type="password" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="••••••" />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="zoe-btn zoe-btn--primary zoe-btn--sm" onClick={saveEdit}>Kaydet</button>
                  <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => setEditId(null)}>İptal</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.active ? 'rgba(245,197,24,.15)' : 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {s.active ? '👨‍💼' : '🚫'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.email}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {s.permissions.length === 0
                      ? <span style={{ fontSize: 11, color: '#6b7280' }}>Yetki yok</span>
                      : s.permissions.map(p => {
                          const found = ALL_PERMISSIONS.find(x => x.key === p)
                          return <span key={p} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(245,197,24,.1)', color: '#f5c518', border: '1px solid rgba(245,197,24,.3)' }}>{found?.label || p}</span>
                        })
                    }
                  </div>
                </div>
                <span className={`zoe-badge ${s.active ? 'zoe-badge--on' : 'zoe-badge--off'}`}>{s.active ? 'Aktif' : 'Pasif'}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="zoe-btn zoe-btn--outline zoe-btn--sm" onClick={() => startEdit(s)}>✏️ Düzenle</button>
                  <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }} onClick={() => del(s.id)}>Sil</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="zoe-muted">Henüz personel yok</div>}
      </div>
    </div>
  )
}
