import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useState } from 'react'
import { getSiteSettings } from '../lib/siteSettings'

export function ZoeHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tickerItems, setTickerItems] = useState([
    '🎁 Hoş Geldin Bonusu — İlk yatırımına %100 bonus',
    '🎰 1000DENEME Kodu sadece Slot Oyunlarında Geçerlidir',
    '💰 Günlük 1.000.000 ₺ Çekim İmkânı',
    '🏆 Nakit 50₺ Kod: 50CASH',
    '⚡ Canlı Bahiste Anlık Oranlar',
  ])

  useEffect(() => {
    getSiteSettings().then(s => { if (s.ticker_items?.length) setTickerItems(s.ticker_items) })
  }, [])

  return (
    <>
      <div className="zoe-ticker">
        <div className="zoe-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="zoe-ticker-item">📢 {item}</span>
          ))}
        </div>
      </div>
      <div className="zoe-topbar">
        <div className="zoe-topbar-auth">
          {!user ? (
            <>
              <button className="zoe-btn zoe-btn--ghost" onClick={() => navigate('/login')}>Giriş Yap</button>
              <button className="zoe-btn zoe-btn--primary" onClick={() => navigate('/register')}>Kayıt Ol</button>
            </>
          ) : (
            <>
              <Link className="zoe-btn zoe-btn--ghost zoe-btn--sm" to="/wallet">💰 Cüzdan</Link>
              <div className="zoe-user-pill" title={user.email}>
                <span className="zoe-user-dot" />
                <span className="zoe-user-text">{user.email}</span>
              </div>
              <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={logout}>Çıkış</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
