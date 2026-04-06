import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

export function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('BahisMosco')
  const [logoIcon, setLogoIcon] = useState('⚡')
  const [logoText, setLogoText] = useState('BAHİSMOSCO')
  const [logoUrl, setLogoUrl] = useState('')
  const [tickerItems, setTickerItems] = useState<string[]>([])
  const [newTicker, setNewTicker] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchApi('/settings').then(d => {
      if (d.site_name) setSiteName(d.site_name)
      if (d.site_logo_icon) setLogoIcon(d.site_logo_icon)
      if (d.site_logo_text) setLogoText(d.site_logo_text)
      if (d.site_logo_url !== undefined) setLogoUrl(d.site_logo_url || '')
      if (d.ticker_items) setTickerItems(Array.isArray(d.ticker_items) ? d.ticker_items : [])
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
          <span className="zoe-field-label">Logo Dosyası Yükle</span>
          <input className="zoe-input" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
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

      {msg && <div style={{ fontSize: 13, color: msg.includes('Kaydedildi') ? '#86efac' : '#fca5a5', padding: '10px 14px', background: 'rgba(255,255,255,.04)', borderRadius: 8 }}>{msg}</div>}

      <button className="zoe-btn zoe-btn--primary" onClick={save} disabled={loading} style={{ alignSelf: 'flex-start', minWidth: 160 }}>
        {loading ? 'Kaydediliyor…' : '💾 Kaydet'}
      </button>
    </div>
  )
}
