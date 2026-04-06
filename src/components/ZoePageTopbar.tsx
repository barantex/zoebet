import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ZoePageTopbar({ label = 'Hype Box' }: { label?: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="zoe-page-topbar">
      <div className="zoe-page-pill">
        <span className="zoe-page-pill-icon">HB</span>
        {label}
      </div>
      <div className="zoe-page-auth">
        {!user ? (
          <>
            <button className="zoe-btn zoe-btn--ghost" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="zoe-btn zoe-btn--primary" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            <div className="zoe-user-pill" title={user.email}>
              <span className="zoe-user-dot" />
              <span className="zoe-user-text">{user.email}</span>
            </div>
            <button className="zoe-btn zoe-btn--ghost" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  )
}
