import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

export function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('BahisMosco')
  const [logoIcon, setLogoIcon] = useState('⚡')
  const [logoText, setLogoText] = useState('BAHİSMOSCO')
  const [logoUrl, setLogoUrl] = useState('')
  const [tickerItems, setTickerItems] = useState<string[]>([])
  const [newTicker, setNewTicker] = useState('')
  const [tawkId, setTawkId] = useState('')
  const [favicon, setFavicon] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchApi('/settings').then(d => {
      if (d.site_name) setSiteName(d.site_name)
      if (d.site_logo_icon) setLogoIcon(d.site_logo_icon)
      if (d.site_logo_text) setLogoText(d.site_logo_text)
      if (d.site_logo_url !== undefined) setLogoUrl(d.site_logo_url || '')
      if (d.ticker_items) setTickerItems(Array.isArray(d.ticker_items) ? d.ticker_items : [])
      if (d.tawk_id !== undefined) setTawkId(d.tawk_id || '')
      if (d.favicon !== undefined) setFavicon(d.favicon || '')
      if (d.favicon_url !== undefined) setFaviconUrl(d.favicon_url || '')
    }).catch(() => {})
  }, [])

  async function save() {
    setLoading(true); setMsg('')
    try {
      await fetchApi('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          site_name: siteName,
          site_logo_icon: logoIcon,
          site_logo_text: logoText,
          site_logo_url: logoUrl,
          ticker_items: tickerItems,
          tawk_id: tawkId,
          favicon,
          favicon_url: faviconUrl,
        })
      })
      setMsg('Kaydedildi — Sayfa yenilenince değişiklikler görünür')
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  function handleLogoFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <div className="zoe-page-head">
        <h2>⚙️ Site Ayarları</h2>
        <p>Logo, site adı ve ticker metinlerini buradan yönet</p>
      </div>

      {/* Logo & Site Name */}
      <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>Logo & Site Adı</div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#1a1a24', borderRadius: 8, border: '1px solid rgba(255,255,255,.07)' }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ height: 32, objectFit: 'contain' }} />
            : <span style={{ fontSize: 22 }}>{logoIcon}</span>
          }
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '.06em' }}>{logoText}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label className="zoe-field">
            <span className="zoe-field-label">Site Adı</span>
            <input className="zoe-input" value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="BahisMosco" />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Logo Metni (sidebar)</span>
            <input className="zoe-input" value={logoText} onChange={e => setLogoText(e.target.value)} placeholder="BAHİSMOSCO" />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Logo İkonu (emoji)</span>
            <input className="zoe-input" value={logoIcon} onChange={e => setLogoIcon(e.target.value)} placeholder="⚡" />
          </label>
          <label className="zoe-field">
            <span className="zoe-field-label">Logo URL (opsiyonel)</span>
            <input className="zoe-input" value={logoUrl.startsWith('data:') ? '' : logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
          </label>
        </div>

        <label className="zoe-field">
          <span className="zoe-field-label">Favicon (tarayıcı sekmesi ikonu) — .ico veya .png</span>
          <input className="zoe-input" type="file" accept="image/*,.ico" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setFaviconUrl(r.result as string); r.readAsDataURL(f) } }} />
        </label>
        {faviconUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={faviconUrl.startsWith('data:') ? faviconUrl : faviconUrl} alt="favicon" style={{ width: 32, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Favicon önizleme</span>
          </div>
        )}
        <label className="zoe-field">
          <span className="zoe-field-label">veya Favicon URL</span>
          <input className="zoe-input" value={faviconUrl.startsWith('data:') ? '' : faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://..." />
        </label>
      </div>

      {/* Ticker */}
      <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>📢 Ticker Metinleri</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tickerItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="zoe-input" value={item} onChange={e => {
                const next = [...tickerItems]; next[i] = e.target.value; setTickerItems(next)
              }} style={{ flex: 1 }} />
              <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" style={{ color: '#fca5a5' }}
                onClick={() => setTickerItems(tickerItems.filter((_, j) => j !== i))}>Sil</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="zoe-input" value={newTicker} onChange={e => setNewTicker(e.target.value)}
            placeholder="Yeni ticker metni..." style={{ flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter' && newTicker.trim()) { setTickerItems([...tickerItems, newTicker.trim()]); setNewTicker('') } }} />
          <button className="zoe-btn zoe-btn--outline" onClick={() => { if (newTicker.trim()) { setTickerItems([...tickerItems, newTicker.trim()]); setNewTicker('') } }}>Ekle</button>
        </div>
      </div>

      {/* Favicon */}
      <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>🌐 Favicon & Sekme İkonu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {favicon && <img src={favicon} alt="favicon" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#111', padding: 4 }} />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="zoe-field">
              <span className="zoe-field-label">Favicon Dosyası Yükle (PNG/ICO önerilen 64x64)</span>
              <input className="zoe-input" type="file" accept="image/*,.ico" onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                const reader = new FileReader()
                reader.onload = () => {
                  const result = reader.result as string
                  setFavicon(result)
                  // Update favicon in browser immediately
                  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
                  link.rel = 'icon'
                  link.href = result
                  document.head.appendChild(link)
                }
                reader.readAsDataURL(f)
              }} />
            </label>
            <label className="zoe-field">
              <span className="zoe-field-label">veya Favicon URL</span>
              <input className="zoe-input" value={favicon.startsWith('data:') ? '' : favicon} onChange={e => setFavicon(e.target.value)} placeholder="https://..." />
            </label>
          </div>
        </div>
      </div>

      {/* Tawk.to */}
      <div className="zoe-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>💬 Tawk.to Canlı Destek</div>
        <label className="zoe-field">
          <span className="zoe-field-label">Tawk.to Property ID (örn: 69bb56ef6e8f601c36d1c0d3/1jk1sn62i)</span>
          <input className="zoe-input" value={tawkId} onChange={e => setTawkId(e.target.value)}
            placeholder="PROPERTY_ID/WIDGET_ID" />
        </label>
        <p className="zoe-muted" style={{ fontSize: 11 }}>
          tawk.to → Administration → Channels → Chat Widget → Script içindeki embed.tawk.to/ sonrasını gir
        </p>
      </div>

      <button className="zoe-btn zoe-btn--primary" onClick={save} disabled={loading} style={{ alignSelf: 'flex-start', minWidth: 160 }}>
        {loading ? 'Kaydediliyor…' : '💾 Kaydet'}
      </button>
    </div>
  )
}
