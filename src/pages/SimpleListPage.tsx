import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { readJson } from '../lib/storage'
import { KEYS } from '../lib/seed'
import type { Game, Match, Promotion } from '../lib/types'
import { getPlayRoute } from '../lib/games'

/* ── Game Card ── */
function GameCard({ game }: { game: Game }) {
  const [hovered, setHovered] = useState(false)
  const route = getPlayRoute(game)

  return (
    <article
      className="zoe-game-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {game.imageUrl
        ? <img src={game.imageUrl} alt={game.name} className="zoe-game-card-img" loading="lazy" />
        : <div className="zoe-game-card-placeholder">{game.name[0]}</div>
      }
      <div className={`zoe-game-card-overlay${hovered ? ' zoe-game-card-overlay--show' : ''}`}>
        <span className="zoe-game-card-name">{game.name}</span>
        {route
          ? <Link to={route} className="zoe-btn zoe-btn--primary zoe-btn--sm">▶ Oyna</Link>
          : <button className="zoe-btn zoe-btn--primary zoe-btn--sm">▶ Oyna</button>
        }
      </div>
      <span className="zoe-game-card-tag">{game.tag}</span>
    </article>
  )
}

/* ── Casino Page ── */
export function CasinoPage() {
  const games = useMemo(() => readJson<Game[]>(KEYS.games, []), [])
  const tags = useMemo(() => {
    const all = ['Tümü', ...Array.from(new Set(games.map(g => g.tag)))]
    return all
  }, [games])
  const [activeTag, setActiveTag] = useState('Tümü')

  const filtered = activeTag === 'Tümü' ? games : games.filter(g => g.tag === activeTag)

  return (
    <div>
      <div className="zoe-page-head" style={{ marginBottom: 16 }}>
        <h2>🎰 Casino</h2>
        <p>Tüm oyunlar — {games.length} oyun</p>
      </div>

      <div className="zoe-game-filters">
        {tags.map(t => (
          <button
            key={t}
            className={'zoe-chip' + (activeTag === t ? ' zoe-chip--active' : '')}
            onClick={() => setActiveTag(t)}
          >{t}</button>
        ))}
      </div>

      <div className="zoe-game-grid">
        {filtered.map(game => <GameCard key={game.id} game={game} />)}
      </div>
    </div>
  )
}

/* ── Live Casino Page ── */
export function LiveCasinoPage() {
  const games = useMemo(() => readJson<Game[]>(KEYS.games, []).filter(g =>
    g.tag?.toLowerCase().includes('live') || g.provider?.toLowerCase().includes('live')
  ), [])

  return (
    <div>
      <div className="zoe-page-head" style={{ marginBottom: 16 }}>
        <h2>🎲 Canlı Casino</h2>
        <p>Canlı masa oyunları</p>
      </div>
      <div className="zoe-game-grid">
        {games.length
          ? games.map(game => <GameCard key={game.id} game={game} />)
          : <p className="zoe-muted">Canlı oyun bulunamadı.</p>
        }
      </div>
    </div>
  )
}

/* ── Sports Page ── */
export function SportsPage() {
  const matches = useMemo(() => readJson<Match[]>(KEYS.matches, []), [])
  return (
    <div>
      <div className="zoe-page-head" style={{ marginBottom: 16 }}>
        <h2>⚽ Spor</h2>
        <p>Oranlar ve karşılaşmalar</p>
      </div>
      <div className="zoe-panel">
        <div className="zoe-live-table">
          <div className="zoe-live-table-head">
            <span>Maçlar</span><span>1</span><span>X</span><span>2</span>
          </div>
          <div className="zoe-live-table-body">
            {matches.map(match => (
              <article key={match.id} className="zoe-live-row">
                <div className="zoe-live-main">
                  <div className="zoe-live-meta">
                    <span className="zoe-live-sport">{match.sport}</span>
                    <span className="zoe-live-league">{match.league}</span>
                  </div>
                  <p className="zoe-live-teams">{match.teams}</p>
                  <div className="zoe-live-status">
                    {match.isLive && <span className="zoe-live-minute">{match.minute}</span>}
                    <span className="zoe-live-score">{match.score}</span>
                  </div>
                </div>
                <div className="zoe-live-odds">
                  {[match.odds1, match.oddsX, match.odds2].map((odd, i) => (
                    <button key={i} className={'zoe-odd-btn' + (i === 0 ? ' zoe-odd-btn--primary' : '')} disabled={odd === '–'}>{odd}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Live Page ── */
export function LivePage() {
  const matches = useMemo(() => readJson<Match[]>(KEYS.matches, []).filter(m => m.isLive), [])
  return (
    <div>
      <div className="zoe-page-head" style={{ marginBottom: 16 }}>
        <h2>📡 Canlı Bahis</h2>
        <p>Devam eden karşılaşmalar</p>
      </div>
      <div className="zoe-panel">
        {matches.length ? (
          <div className="zoe-live-table">
            <div className="zoe-live-table-head">
              <span>Maçlar</span><span>1</span><span>X</span><span>2</span>
            </div>
            <div className="zoe-live-table-body">
              {matches.map(match => (
                <article key={match.id} className="zoe-live-row">
                  <div className="zoe-live-main">
                    <div className="zoe-live-meta">
                      <span className="zoe-live-sport">{match.sport}</span>
                      <span className="zoe-live-league">{match.league}</span>
                    </div>
                    <p className="zoe-live-teams">{match.teams}</p>
                    <div className="zoe-live-status">
                      <span className="zoe-live-minute">{match.minute}</span>
                      <span className="zoe-live-score">{match.score}</span>
                    </div>
                  </div>
                  <div className="zoe-live-odds">
                    {[match.odds1, match.oddsX, match.odds2].map((odd, i) => (
                      <button key={i} className={'zoe-odd-btn' + (i === 0 ? ' zoe-odd-btn--primary' : '')} disabled={odd === '–'}>{odd}</button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : <p className="zoe-muted">Şu an canlı maç yok.</p>}
      </div>
    </div>
  )
}

/* ── Promotions Page ── */
export function PromotionsPage() {
  const promos = useMemo(() => readJson<Promotion[]>(KEYS.promotions, []), [])
  return (
    <div>
      <div className="zoe-page-head" style={{ marginBottom: 16 }}>
        <h2>🎁 Promosyonlar</h2>
        <p>Kampanyalar ve bonuslar</p>
      </div>
      <div className="zoe-cards">
        {promos.map(p => (
          <article key={p.id} className="zoe-card">
            <div className="zoe-card-head">
              <h3>{p.title}</h3>
              <span className={'zoe-badge ' + (p.active ? 'zoe-badge--on' : 'zoe-badge--off')}>
                {p.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <p className="zoe-muted">{p.description}</p>
            <button className="zoe-btn zoe-btn--primary zoe-btn--sm">Detay</button>
          </article>
        ))}
      </div>
    </div>
  )
}

/* ── Tournaments Page ── */
export function TournamentsPage() {
  return (
    <div>
      <div className="zoe-page-head">
        <h2>🏆 Turnuvalar</h2>
        <p>Yaklaşan etkinlikler</p>
      </div>
      <div className="zoe-panel">
        <p className="zoe-muted">Turnuvalar yakında duyurulacak.</p>
      </div>
    </div>
  )
}
