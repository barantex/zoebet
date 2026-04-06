import { Link } from 'react-router-dom'

const COLS = [
  {
    title: '📄 HAKKIMIZDA',
    links: [
      { label: 'Firma Bilgileri', to: '/help/faq' },
      { label: 'Bize Ulaşın', to: '/help/support' },
      { label: 'İletişim', to: '/help/support' },
      { label: 'Gizlilik Politikası', to: '/help/privacy' },
      { label: 'Kariyer', to: '/help/faq' },
    ],
  },
  {
    title: '⚖️ KURALLAR VE ŞARTLAR',
    links: [
      { label: 'Finansal İşlemler', to: '/help/terms' },
      { label: 'Genel Bonus Kuralları', to: '/help/terms' },
      { label: 'Diğer Kurallar ve Şartlar', to: '/help/terms' },
      { label: 'Bahis Kuralları', to: '/help/terms' },
      { label: 'Bahislerin Kabulü', to: '/help/terms' },
    ],
  },
  {
    title: '🎧 YARDIM',
    links: [
      { label: 'Kontrol Merkezi', to: '/help/faq' },
      { label: 'Yatırım Rehberi', to: '/help/faq' },
      { label: 'Kripto Kullanım Rehberi', to: '/help/faq' },
      { label: 'Sıkça Sorulan Sorular', to: '/help/faq' },
      { label: 'Bahis Sözlüğü', to: '/help/faq' },
    ],
  },
  {
    title: '🏆 ETKİNLİKLER',
    links: [
      { label: 'Turnuvalar', to: '/tournaments' },
      { label: 'Bonuslar & Promosyonlar', to: '/promotions' },
      { label: 'Sorumlu Bahis', to: '/help/responsible' },
    ],
  },
]

export function ZoeFooter() {
  return (
    <footer className="zoe-footer-pro">
      {/* Link columns */}
      <div className="zoe-footer-cols">
        {COLS.map(col => (
          <div key={col.title} className="zoe-footer-col">
            <div className="zoe-footer-col-title">{col.title}</div>
            {col.links.map(l => (
              <Link key={l.label} to={l.to} className="zoe-footer-link">{l.label}</Link>
            ))}
          </div>
        ))}
      </div>

      {/* Gold divider */}
      <div className="zoe-footer-divider" />

      {/* Sponsorships */}
      <div className="zoe-footer-sponsors">
        <div className="zoe-footer-sponsors-title">SPONSORLUKLAR & İŞ BİRLİKLERİ</div>
        <div className="zoe-footer-sponsors-row">
          <div className="zoe-footer-sponsor-card">
            <div className="zoe-footer-sponsor-icon">⚽</div>
            <div className="zoe-footer-sponsor-name">Albacete Balompié</div>
            <div className="zoe-footer-sponsor-desc">Official betting sponsor.</div>
          </div>
          <div className="zoe-footer-sponsor-card">
            <div className="zoe-footer-sponsor-icon">🛡️</div>
            <div className="zoe-footer-sponsor-name">GambleAware</div>
            <div className="zoe-footer-sponsor-desc">Non-profit Organizations</div>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="zoe-footer-payments">
        <div className="zoe-footer-payments-title">YATIRIM YÖNTEMLERİ</div>
        <div className="zoe-footer-payments-row">
          {['🏦 Banka Havalesi', '📱 Papara', '₿ Kripto', '💳 Kredi Kartı'].map(m => (
            <span key={m} className="zoe-footer-payment-badge">{m}</span>
          ))}
        </div>
      </div>

      {/* License */}
      <div className="zoe-footer-license">
        <div className="zoe-footer-license-logos">
          <a href="https://cert.gcb.cw" target="_blank" rel="noreferrer" className="zoe-footer-license-logo-wrap">
            <img
              src="https://gator.drakonapi.tech/storage/drakon/gc-logo.webp"
              alt="Gaming Curaçao"
              className="zoe-footer-license-img"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="zoe-footer-license-badge-img">
              <span style={{ fontSize: 20 }}>🎮</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#e5e7eb' }}>GAMING</div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#e5e7eb' }}>CURAÇAO</div>
              </div>
            </div>
          </a>
          <a href="https://cert.gcb.cw" target="_blank" rel="noreferrer" className="zoe-footer-license-logo-wrap">
            <img
              src="https://gator.drakonapi.tech/storage/drakon/gcb-logo.webp"
              alt="GCB"
              className="zoe-footer-license-img"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="zoe-footer-license-badge-img">
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#e5e7eb' }}>GCB</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#9ca3af' }}>cert.gcb.cw</div>
              </div>
            </div>
          </a>
        </div>
        <p className="zoe-footer-license-text">
          BahisMosco, Curaçao yasaları kapsamında lisanslı olarak faaliyet göstermektedir.
          Tüm hakları saklıdır. 18+ | Sorumlu Bahis |{' '}
          <Link to="/help/responsible" style={{ color: '#f5c518' }}>Sorumlu Bahis Politikası</Link>
          {' | '}
          <Link to="/lisans" style={{ color: '#f5c518' }}>Lisans Bilgileri</Link>
        </p>
      </div>
    </footer>
  )
}

