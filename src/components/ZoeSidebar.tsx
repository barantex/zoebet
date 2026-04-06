import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useState } from 'react'
import { getSiteSettings } from '../lib/siteSettings'

type Item = { to: string; label: string; icon: string; badge?: string }

const GAMES: Item[] = [
  { to: '/',           label: 'Ana Sayfa',      icon: '🏠' },
  { to: '/sports',     label: 'Spor Bahisleri', icon: '⚽' },
  { to: '/casino',     label: 'Popüler Slotlar',icon: '🎰', badge: 'HOT' },
  { to: '/live-casino',label: 'Canlı Casino',   icon: '🎲' },
  { to: '/live',       label: 'Canlı Bahis',    icon: '📡' },
]

const EXTRA: Item[] = [
  { to: '/promotions',  label: 'Bonuslar & Promosyonlar', icon: '🎁' },
  { to: '/tournaments', label: 'Turnuvalar',               icon: '🏆' },
  { to: '/wheel',       label: 'Şans Çarkı',               icon: '🎡', badge: 'YENİ' },
  { to: '/wheel-code',  label: 'Çark Kodu',                icon: '🎟️' },
  { to: '/wallet',      label: 'Cüzdan',                   icon: '💰' },
]

const HELP: Item[] = [
  { to: '/help/faq',         label: 'SSS',             icon: '❓' },
  { to: '/help/support',     label: 'Canlı Destek',    icon: '💬' },
  { to: '/help/responsible', label: 'Sorumlu Bahis',   icon: '🛡️' },
]

function SideLink({ item }: { item: Item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => 'zoe-side-link' + (isActive ? ' zoe-side-link--active' : '')}
    >
      <span className="zoe-side-icon">{item.icon}</span>
      <span className="zoe-side-text">{item.label}</span>
      {item.badge && <span className="zoe-side-badge">{item.badge}</span>}
    </NavLink>
  )
}

export function ZoeSidebar() {
  const { isAdmin } = useAuth()
  const [logoIcon, setLogoIcon] = useState('⚡')
  const [logoText, setLogoText] = useState('BAHİS')
  const [logoSub, setLogoSub] = useState('MOSCO')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    getSiteSettings().then(s => {
      setLogoIcon(s.site_logo_icon || '⚡')
      const text = s.site_logo_text || 'BAHİSMOSCO'
      const mid = Math.ceil(text.length / 2)
      setLogoText(text.slice(0, mid))
      setLogoSub(text.slice(mid))
      setLogoUrl(s.site_logo_url || '')
    })
  }, [])

  return (
    <aside className="zoe-sidebar">
      <Link to="/" className="zoe-sidebar-logo">
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ height: 32, objectFit: 'contain' }} />
          : <span className="zoe-logo-icon">{logoIcon}</span>
        }
        <span className="zoe-logo-text">{logoText}<span>{logoSub}</span></span>
      </Link>
      <nav className="zoe-side-nav">
        <div className="zoe-side-group-label">OYUNLAR</div>
        {GAMES.map(i => <SideLink key={i.to} item={i} />)}
        <div className="zoe-side-group-label">EKSTRA</div>
        {EXTRA.map(i => <SideLink key={i.to} item={i} />)}
        <div className="zoe-side-group-label">YARDIM</div>
        {HELP.map(i => <SideLink key={i.to} item={i} />)}
        {isAdmin && (
          <>
            <div className="zoe-side-group-label">YÖNETİM</div>
            <SideLink item={{ to: '/admin', label: 'Back Office', icon: '⚙️' }} />
          </>
        )}
      </nav>
    </aside>
  )
}

