import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { readJson } from '../lib/storage'
import { KEYS } from '../lib/seed'
import { getPlayRoute } from '../lib/games'
import type { Banner, Game, Match } from '../lib/types'

function GameCard({ game }: { game: Game }) {
  const [hovered, setHovered] = useState(false)
  const route = getPlayRoute(game)
  return (
    <article
      className="zoe-hgame-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {game.imageUrl
        ? <img src={game.imageUrl} alt={game.name} className="zoe-hgame-img" loading="lazy" />
        : <div className="zoe-hgame-placeholder">{game.name[0]}</div>
      }
      <div className={`zoe-hgame-overlay${hovered ? ' zoe-hgame-overlay--show' : ''}`}>
        <span className="zoe-hgame-name">{game.name}</span>
        {route
          ? <Link to={route} className="zoe-btn zoe-btn--primary zoe-btn--sm">▶ Oyna</Link>
          : <button className="zoe-btn zoe-btn--primary zoe-btn--sm">▶ Oyna</button>
        }
      </div>
    </article>
  )
}

export function HomePage() {
  const matches = useMemo(() => readJson<Match[]>(KEYS.matches, []), [])
  const games = useMemo(() => readJson<Game[]>(KEYS.games, []), [])
  const banners = useMemo(() => readJson<Banner[]>(KEYS.banners, []).filter(b => b.active), [])

  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => {
    if (!banners.length) return
    const id = window.setInterval(() => setActiveIndex(p => (p + 1) % banners.length), 5000)
    return () => window.clearInterval(id)
  }, [banners.length])

  const slots = games.filter(g => g.tag !== 'Live')
  const live  = games.filter(g => g.tag === 'Live')
  const liveMatches = matches.filter(m => m.isLive).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* BANNER */}
      {banners.length > 0 && (
        <section className="zoe-banner-slider" style={{ minHeight: 260 }}>
          {banners.map((b, i) => (
            <Link key={b.id} to={b.linkUrl || '/'} className={'zoe-banner' + (i === activeIndex ? ' zoe-banner--active' : '')}>
              <img src={b.imageUrl} alt={b.title} className="zoe-banner-image" loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="zoe-banner-overlay">
                <div className="zoe-banner-text">
                  <h2>{b.title}</h2>
                  <p>{b.subtitle}</p>
                </div>
                <span className="zoe-banner-cta">Keşfet →</span>
              </div>
            </Link>
          ))}
          <div className="zoe-banner-dots">
            {banners.map((b, i) => (
              <button key={b.id} className={'zoe-banner-dot' + (i === activeIndex ? ' zoe-banner-dot--active' : '')} onClick={() => setActiveIndex(i)} />
            ))}
          </div>
        </section>
      )}

      {/* POPULAR SLOTS */}
      <section>
        <div className="zoe-lobby-header">
          <div className="zoe-lobby-title">🔥 Popüler Slotlar</div>
          <Link to="/casino" className="zoe-lobby-more">Tümünü Gör →</Link>
        </div>
        <div className="zoe-hscroll">
          {slots.map(g => <GameCard key={g.id} game={g} />)}
        </div>
      </section>

      {/* LIVE CASINO */}
      {live.length > 0 && (
        <section>
          <div className="zoe-lobby-header">
            <div className="zoe-lobby-title">📹 Canlı Casino</div>
            <Link to="/live-casino" className="zoe-lobby-more">Tümünü Gör →</Link>
          </div>
          <div className="zoe-hscroll">
            {live.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      )}

      {/* LIVE MATCHES */}
      {liveMatches.length > 0 && (
        <section>
          <div className="zoe-lobby-header">
            <div className="zoe-lobby-title">⚽ Canlı Maçlar</div>
            <Link to="/live" className="zoe-lobby-more">Tümünü Gör →</Link>
          </div>
          <div className="zoe-live-table">
            <div className="zoe-live-table-head">
              <span>Maçlar</span><span>1</span><span>X</span><span>2</span>
            </div>
            <div className="zoe-live-table-body">
              {liveMatches.map(m => (
                <article key={m.id} className="zoe-live-row">
                  <div className="zoe-live-main">
                    <div className="zoe-live-meta">
                      <span className="zoe-live-sport">{m.sport}</span>
                      <span className="zoe-live-league">{m.league}</span>
                    </div>
                    <p className="zoe-live-teams">{m.teams}</p>
                    <div className="zoe-live-status">
                      <span className="zoe-live-minute">{m.minute}</span>
                      <span className="zoe-live-score">{m.score}</span>
                    </div>
                  </div>
                  <div className="zoe-live-odds">
                    {[m.odds1, m.oddsX, m.odds2].map((odd, i) => (
                      <button key={i} className={'zoe-odd-btn' + (i === 0 ? ' zoe-odd-btn--primary' : '')} disabled={odd === '-'}>{odd}</button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
