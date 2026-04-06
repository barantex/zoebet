import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchApi } from '../api/client'

function Field({ label, value, onChange, type, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <label className="zoe-field">
      <span className="zoe-field-label">{label}</span>
      <input className="zoe-input" value={value} onChange={e => onChange(e.target.value)}
        type={type ?? 'text'} placeholder={placeholder} />
    </label>
  )
}

/* ── OTP Step ── */
function OtpStep({ phone, onSuccess }: { phone: string; onSuccess: (token: string, user: any) => void }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleVerify() {
    setLoading(true); setError(null)
    try {
      const data = await fetchApi('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) })
      onSuccess(data.token, data.user)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function handleResend() {
    setResent(false)
    try {
      await fetchApi('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ phone }) })
      setResent(true)
    } catch (err: any) { setError(err.message) }
  }

  return (
    <div className="zoe-auth-card">
      <div className="zoe-page-head">
        <h2>📱 SMS Doğrulama</h2>
        <p>{phone} numarasına gönderilen 6 haneli kodu gir</p>
      </div>
      <Field label="Doğrulama Kodu *" value={otp} onChange={setOtp} placeholder="123456" />
      {error && <div className="zoe-alert">{error}</div>}
      {resent && <div style={{ color: '#86efac', fontSize: 13 }}>✓ Kod tekrar gönderildi</div>}
      <button className="zoe-btn zoe-btn--primary zoe-btn--full" onClick={handleVerify} disabled={loading}>
        {loading ? 'Doğrulanıyor…' : 'Doğrula ve Hesabı Aç'}
      </button>
      <button className="zoe-btn zoe-btn--ghost zoe-btn--full" onClick={handleResend}>
        Kodu tekrar gönder
      </button>
    </div>
  )
}

/* ── Register Page ── */
export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [tc, setTc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true); setError(null)
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, surname, phone, tc }),
      })
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  function handleOtpSuccess(token: string, user: any) {
    localStorage.setItem('zoe.token', token)
    // Reload to trigger AuthContext session restore
    window.location.href = '/'
  }

  return (
    <main className="zoe-main">
      <div className="zoe-auth-page">
        {step === 'form' ? (
          <div className="zoe-auth-card">
            <div className="zoe-page-head">
              <h2>Kayıt Ol</h2>
              <p>Yeni hesap oluştur</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Ad *" value={name} onChange={setName} placeholder="Adınız" />
              <Field label="Soyad *" value={surname} onChange={setSurname} placeholder="Soyadınız" />
            </div>
            <Field label="E-posta *" value={email} onChange={setEmail} placeholder="mail@ornek.com" />
            <Field label="Telefon * (05xx xxx xx xx)" value={phone} onChange={setPhone} placeholder="05001234567" />
            <Field label="TC Kimlik No *" value={tc} onChange={setTc} placeholder="12345678901" />
            <Field label="Şifre *" value={password} onChange={setPassword} type="password" placeholder="en az 4 karakter" />
            {error && <div className="zoe-alert">{error}</div>}
            <button className="zoe-btn zoe-btn--primary zoe-btn--full" onClick={handleRegister} disabled={loading}>
              {loading ? 'Gönderiliyor…' : 'SMS Kodu Gönder →'}
            </button>
            <p className="zoe-muted" style={{ textAlign: 'center', fontSize: 11 }}>
              Kayıt olarak <Link to="/help/terms" style={{ color: '#f5c518' }}>Kullanım Şartları</Link>'nı kabul etmiş olursunuz. 18+
            </p>
            <p className="zoe-muted" style={{ textAlign: 'center' }}>
              Zaten hesabın var mı? <Link to="/login" style={{ color: '#f5c518' }}>Giriş yap</Link>
            </p>
          </div>
        ) : (
          <OtpStep phone={phone} onSuccess={handleOtpSuccess} />
        )}
      </div>
    </main>
  )
}

/* ── Login Page ── */
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [unverifiedPhone, setUnverifiedPhone] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true); setError(null)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) {
      if ((res as any).unverifiedPhone) {
        setUnverifiedPhone((res as any).unverifiedPhone)
      }
      return setError(res.message)
    }
    navigate('/', { replace: true })
  }

  if (unverifiedPhone) {
    return (
      <main className="zoe-main">
        <div className="zoe-auth-page">
          <OtpStep
            phone={unverifiedPhone}
            onSuccess={(token) => {
              localStorage.setItem('zoe.token', token)
              window.location.href = '/'
            }}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="zoe-main">
      <div className="zoe-auth-page">
        <div className="zoe-auth-card">
          <div className="zoe-page-head">
            <h2>Giriş Yap</h2>
            <p>Hesabına giriş yap</p>
          </div>
          <Field label="E-posta" value={email} onChange={setEmail} placeholder="mail@ornek.com" />
          <Field label="Şifre" value={password} onChange={setPassword} type="password" placeholder="••••" />
          {error && <div className="zoe-alert">{error}</div>}
          <button className="zoe-btn zoe-btn--primary zoe-btn--full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
          <p className="zoe-muted" style={{ textAlign: 'center' }}>
            Hesabın yok mu? <Link to="/register" style={{ color: '#f5c518' }}>Kayıt ol</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
