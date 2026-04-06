import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchApi } from '../api/client'

type Slice = { id: string; label: string; amount: number; color: string; probability: number }

export function WheelPage() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [slices, setSlices] = useState<Slice[]>([])
  const [spinning, setSpinning] = useState(false)
  const [canSpin, setCanSpin] = useState(true)
  const [remaining, setRemaining] = useState(0)
  const [winner, setWinner] = useState<Slice | null>(null)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rotationRef = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    fetchApi('/wheel/slices').then(d => setSlices(d.slices)).catch(() => {})
    if (user) {
      fetchApi('/wheel/spin/status').then(d => {
        setCanSpin(d.canSpin)
        setRemaining(d.remaining || 0)
      }).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (slices.length) drawWheel(rotationRef.current)
  }, [slices])

  function drawWheel(rotation: number) {
    const canvas = canvasRef.current
    if (!canvas || !slices.length) return
    const ctx = canvas.getContext('2d')!
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = cx - 10
    const arc = (2 * Math.PI) / slices.length

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Shadow
    ctx.save()
    ctx.shadowColor = 'rgba(245,197,24,0.3)'
    ctx.shadowBlur = 20

    slices.forEach((slice, i) => {
      const start = rotation + i * arc
      const end = start + arc

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = slice.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Text
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${r > 150 ? 14 : 11}px Inter,sans-serif`
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      ctx.fillText(slice.label, r - 12, 5)
      ctx.restore()
    })
    ctx.restore()

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#111118'
    ctx.fill()
    ctx.strokeStyle = '#f5c518'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#f5c518'
    ctx.font = 'bold 11px Inter,sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ÇEVİR', cx, cy + 4)
  }

  async function handleSpin() {
    if (!user || spinning || !canSpin) return
    setError(null); setWinner(null); setNewBalance(null)
    setSpinning(true)

    try {
      const data = await fetchApi('/wheel/spin', { method: 'POST', body: '{}' })
      const winnerSlice: Slice = data.winner

      // Find winner index
      const idx = slices.findIndex(s => s.id === winnerSlice.id)
      const arc = (2 * Math.PI) / slices.length
      const targetAngle = -(idx * arc + arc / 2) // center of winning slice at top

      // Spin animation: 5 full rotations + target
      const totalRotation = rotationRef.current + (Math.PI * 2 * 6) + (targetAngle - (rotationRef.current % (Math.PI * 2)))
      const duration = 4000
      const start = performance.now()
      const startRot = rotationRef.current

      function animate(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = startRot + (totalRotation - startRot) * ease
        rotationRef.current = current
        drawWheel(current)

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate)
        } else {
          setSpinning(false)
          setWinner(winnerSlice)
          setNewBalance(data.newBalance)
          setCanSpin(false)
          setRemaining(24)
        }
      }
      animRef.current = requestAnimationFrame(animate)
    } catch (e: any) {
      setSpinning(false)
      setError(e.message)
      if (e.message?.includes('saat')) setCanSpin(false)
    }
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎡</div>
        <h2 style={{ color: '#f9fafb', marginBottom: 8 }}>Şans Çarkı</h2>
        <p className="zoe-muted" style={{ marginBottom: 16 }}>Çarkı çevirmek için giriş yapmalısın</p>
        <a href="/login" className="zoe-btn zoe-btn--primary">Giriş Yap</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#f9fafb', margin: '0 0 4px', fontSize: 26, fontWeight: 900 }}>🎡 Şans Çarkı</h2>
        <p className="zoe-muted">Her 24 saatte bir çevirme hakkın var</p>
      </div>

      {/* Wheel container */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '28px solid #f5c518',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          zIndex: 10
        }} />
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          style={{ borderRadius: '50%', cursor: canSpin && !spinning ? 'pointer' : 'default', display: 'block' }}
          onClick={handleSpin}
        />
      </div>

      {/* Spin button */}
      <div style={{ textAlign: 'center' }}>
        {canSpin ? (
          <button
            className="zoe-btn zoe-btn--primary zoe-btn--lg"
            onClick={handleSpin}
            disabled={spinning}
            style={{ minWidth: 180, fontSize: 16 }}
          >
            {spinning ? '🎡 Dönüyor…' : '🎡 Çevir!'}
          </button>
        ) : (
          <div style={{ padding: '12px 24px', background: '#1e1e2a', borderRadius: 10, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Sonraki çevirme hakkın</div>
            <div style={{ color: '#f5c518', fontWeight: 700, fontSize: 18, marginTop: 4 }}>{remaining} saat sonra</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="zoe-alert" style={{ maxWidth: 340 }}>{error}</div>}

      {/* Winner modal */}
      {winner && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }} onClick={() => setWinner(null)}>
          <div style={{
            background: '#1e1e2a', border: `2px solid ${winner.color}`,
            borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 320,
            boxShadow: `0 0 40px ${winner.color}40`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Tebrikler!</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: winner.color, marginBottom: 8 }}>
              ₺{winner.amount.toLocaleString('tr-TR')}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
              Bakiyene eklendi!{newBalance !== null && <> Yeni bakiye: <strong style={{ color: '#f5c518' }}>₺{newBalance.toLocaleString('tr-TR')}</strong></>}
            </div>
            <button className="zoe-btn zoe-btn--primary zoe-btn--full" onClick={() => setWinner(null)}>
              Harika! 🎊
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
