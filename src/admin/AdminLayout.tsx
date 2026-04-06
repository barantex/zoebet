import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV = [
  { to: '/admin',              label: '📊 Dashboard',     end: true },
  { to: '/admin/settings',     label: '⚙️ Site Ayarları',  end: false },
  { to: '/admin/users',        label: '👥 Kullanıcılar',  end: false },
  { to: '/admin/finance',      label: '💰 Finans',         end: false },
  { to: '/admin/wheel',        label: '🎡 Çark Yönetimi',   end: false },
  { to: '/admin/matches',      label: '⚽ Maçlar',         end: false },
  { to: '/admin/games',        label: '🎮 Oyunlar',        end: false },
  { to: '/admin/promotions',   label: '🎁 Promosyonlar',   end: false },
  { to: '/admin/banners',      label: '🖼️ Bannerlar',      end: false },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="zoe-admin-standalone">
      {/* Top header */}
      <header className="zoe-admin-standalone-header">
        <Link to="/admin" className="logo">
          ⚡ BAHİS<span>MOSCO</span> — Back Office
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{user?.email}</span>
          <Link to="/" className="zoe-btn zoe-btn--ghost zoe-btn--sm">← Siteye Dön</Link>
          <button className="zoe-btn zoe-btn--ghost zoe-btn--sm" onClick={() => { logout(); navigate('/login') }}>Çıkış</button>
        </div>
      </header>

      <div className="zoe-admin-standalone-body">
        {/* Side nav */}
        <aside className="zoe-admin-standalone-side">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'zoe-admin-standalone-link' + (isActive ? ' zoe-admin-standalone-link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        {/* Content */}
        <main className="zoe-admin-standalone-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

