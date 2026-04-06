import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

type Banner = { id: string; title: string; subtitle: string; image_url: string; link_url: string; active: number; sort_order: number }

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('/')
  const [active, setActive] = useState(true)
  const [sortOrder, setSortOrder] = useState('0')
  const [msg, setMsg] = useState('')

  async function load() {
    const d = await fetchApi('/banners/all')
    setBanners(d.banners)
  }
  useEffect(() => { load() }, [])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function resetForm() { setTitle(''); setSubtitle(''); setImageUrl(''); setLinkUrl('/'); setActive(true); setSortOrder('0'); setEditId(null) }

  function startEdit(b: Banner) {
    setEditId(b.id); setTitle(b.title); setSubtitle(b.subtitle || '');
    setImageUrl(b.image_url); setLinkUrl(b.link_url || '/');
    setActive(b.active === 1); setSortOrder(String(b.sort_order || 0))
  }

  async function save() {
    if (!title || !imageUrl) return setMsg('Başlık ve görsel zorunlu')
    try {
      if (editId) {
        await fetchApi(`/banners/${editId}`, { method: 'PATCH', body: JSON.stringify({ title, subtitle, image_url: imageUrl, link_url: linkUrl, active: active ? 1 : 0, sort_order: Number(sortOrder) }) })
        setMsg('Güncellendi')
      } else {
        await fetchApi('/banners', { method: 'POST', body: JSON.stringify({ title, subtitle, image_url: imageUrl, link_url: linkUrl, active: active ? 1 : 0, sort_order: Number(sortOrder) }) })
        setMsg('Eklendi')
      }
      resetForm(); load()
    } catch (e: any) { setMsg(e.message) }
  }

  async function toggle(id: string, active: number) {
    await fetchApi(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify({ active: active ? 0 : 1 }) })
    load()
  }

  async function del(id: string) {
    if (!confirm('Sil?')) return
    await fetchApi(`/banners/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="zoe-page-head">
        <h2>🖼️ Banner Yönetimi</h2>
        <p>Ana sayfadaki slider bannerları — önerilen boyut: 1200×400px (3:1)</p>
      </div>

      {/* Form */}
      <div className="zoe-panel">
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 12 }}>{editId ? '✏️ Banner Düzenle' : '+ Yeni Banner'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <label className="zoe-field"><span className="zoe-field-label">Başlık *</span><input className="zoe-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="%100 Hoş Geldin Bonusu" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Alt Başlık</span><input className="zoe-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Kısa açıklama" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Link URL</span><input className="zoe-input" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="/promotions" /></label>
          <label className="zoe-field"><span className="zoe-field-label">Sıra (küçük = önce)</span><input className="zoe-input" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></label>
        </div>

        <label className="zoe-field" style={{ marginBottom: 10 }}>
          <span className="zoe-field-label">Görsel URL</span>
          <input className="zoe-input" value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label className="zoe-field" style={{ marginBottom: 10 }}>
          <span className="zoe-field-label">veya Dosyadan Yükle (1200×400px önerilir)</span>
          <input className="zoe-input" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </label>

        {imageUrl && (
          <div style={{ marginBottom: 10 }}>
            <img src={imageUrl} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)' }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#e5e7eb' }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Aktif (sitede görünsün)
          </label>
        </div>

        {msg && <div style={{ fontSize: 12, color: ['Eklendi','Güncellendi'].includes(msg) ? '#86efac' : '#fca5a5', marginBottom: 8 }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="zoe-btn zoe-btn--primary" onClick={save}>{editId ? 'Güncelle' : 'Banner Ekle'}</button>
          {editId && <button className="zoe-btn zoe-btn--ghost" onClick={resetForm}>İptal</button>}
        </div>
      </div>

      {/* List */}
      <div className="zoe-panel" style={{ padding: 0 }}>
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head" style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1.5fr' }}>
            <span>Görsel</span><span>Başlık</span><span>Link</span><span>Sıra</span><span>Durum</span><span>İşlem</span>
          </div>
          {banners.length === 0 && <div style={{ padding: 16, color: '#6b7280' }}>Henüz banner yok</div>}
          {banners.map(b => (
            <div key={b.id} className="zoe-admin-row" style={{ gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1.5fr' }}>
              <div>
                {b.image_url
                  ? <img src={b.image_url} alt={b.title} style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                  : <span className="zoe-muted">Yok</span>
                }
              </div>
              <div>
                <strong className="zoe-admin-strong">{b.title}</strong>
                {b.subtitle && <div className="zoe-muted" style={{ fontSize: 11 }}>{b.subtitle}</div>}
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{b.link_url}</span>
              <span style={{ fontSize: 12 }}>{b.sort_order}</span>
              <span className={`zoe-badge ${b.active ? 'zoe-badge--on' : 'zoe-badge--off'}`}>{b.active ? 'Aktif' : 'Pasif'}</span>
              <div className="zoe-admin-actions">
                <button className="zoe-btn zoe-btn--outline zoe-btn--sm" onClick={() => startEdit(b)}>✏️ Düzenle</button>
                <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => toggle(b.id, b.active)}>{b.active ? 'Pasif' : 'Aktif'}</button>
                <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }} onClick={() => del(b.id)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
