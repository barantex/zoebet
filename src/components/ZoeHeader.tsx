import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const TICKER_ITEMS = [
  '🎁 Hoş Geldin Bonusu — İlk yatırımına %100 bonus, 50.000 ₺ ye kadar',
  '🎰 1000DENEME Kodu sadece Slot Oyunlarında Geçerlidir',
  '💰 Günlük 1.000.000 ₺ Çekim İmkânı',
  '🏆 Nakit 50₺ Kod: 50CASH',
  '⚡ Canlı Bahiste Anlık Oranlar — Kaçırma!',
  '🎲 Canlı Casino — 7/24 Kesintisiz Oyun',
]

export function ZoeHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <div className="zoe-ticker">
        <div className="zoe-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
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
