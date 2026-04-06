import { useEffect, useState } from 'react'
import { fetchApi } from '../api/client'

export function LisansPage() {
  const [licenseText, setLicenseText] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApi('/settings').then(d => {
      setLicenseText(d.license_text || defaultLicense)
    }).catch(() => setLicenseText(defaultLicense)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="zoe-muted">Yükleniyor…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
      <div className="zoe-page-head">
        <h2>📜 Lisans Bilgileri</h2>
        <p>BahisMosco lisans ve yasal bilgileri</p>
      </div>
      <div className="zoe-panel" style={{ lineHeight: 1.8, color: '#d1d5db', fontSize: 14, whiteSpace: 'pre-wrap' }}>
        {licenseText}
      </div>
    </div>
  )
}

const defaultLicense = `BahisMosco Lisans Bilgileri

BahisMosco, Curaçao yasaları kapsamında lisanslı olarak faaliyet göstermektedir.

Lisans No: 8048/JAZ
Lisans Veren: Gaming Curaçao (GCB)
Lisans Doğrulama: https://cert.gcb.cw

Yasal Uyarı:
Bu site yalnızca 18 yaş ve üzeri bireyler için tasarlanmıştır. Kumar bağımlılığı ciddi bir sorundur. Sorumlu bahis oynayın.

Tüm hakları saklıdır © ${new Date().getFullYear()} BahisMosco`
