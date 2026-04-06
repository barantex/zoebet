import { useMemo, useState } from 'react'
import type { Banner, Game, Match, Promotion } from '../lib/types'
import { KEYS } from '../lib/seed'
import { readJson, writeJson } from '../lib/storage'
import { PROVIDERS } from '../lib/providers'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="zoe-field">
      <span className="zoe-field-label">{label}</span>
      <input
        className="zoe-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function AdminDashboardPage() {
  const stats = useMemo(() => {
    const matches = readJson<Match[]>(KEYS.matches, [])
    const games = readJson<Game[]>(KEYS.games, [])
    const promotions = readJson<Promotion[]>(KEYS.promotions, [])
    return {
      matches: matches.length,
      live: matches.filter((m) => m.isLive).length,
      games: games.length,
      promotions: promotions.length,
    }
  }, [])

  return (
    <div>
      <div className="zoe-page-head">
        <h2>Dashboard</h2>
        <p>Sitenin içeriklerini buradan yönetebilirsin.</p>
      </div>
      <div className="zoe-admin-kpis">
        <div className="zoe-kpi">
          <span>Maç</span>
          <strong>{stats.matches}</strong>
        </div>
        <div className="zoe-kpi">
          <span>Canlı</span>
          <strong>{stats.live}</strong>
        </div>
        <div className="zoe-kpi">
          <span>Oyun</span>
          <strong>{stats.games}</strong>
        </div>
        <div className="zoe-kpi">
          <span>Promosyon</span>
          <strong>{stats.promotions}</strong>
        </div>
      </div>
      <div className="zoe-panel">
        <p className="zoe-muted">
          Not: Bu demo projede tüm veriler tarayıcı <code>localStorage</code> içinde saklanır.
        </p>
      </div>
    </div>
  )
}

export function AdminMatchesPage() {
  const [items, setItems] = useState<Match[]>(() => readJson<Match[]>(KEYS.matches, []))

  const [sport, setSport] = useState('Futbol')
  const [league, setLeague] = useState('')
  const [teams, setTeams] = useState('')
  const [minute, setMinute] = useState("0'")
  const [score, setScore] = useState('0 - 0')
  const [odds1, setOdds1] = useState('1.90')
  const [oddsX, setOddsX] = useState('3.20')
  const [odds2, setOdds2] = useState('3.80')
  const [isLive, setIsLive] = useState(true)

  function persist(next: Match[]) {
    setItems(next)
    writeJson(KEYS.matches, next)
  }

  return (
    <div>
      <div className="zoe-page-head">
        <h2>Maçlar</h2>
        <p>Listeye maç ekle / düzenle / sil.</p>
      </div>

      <div className="zoe-panel">
        <div className="zoe-form-grid">
          <TextField label="Spor" value={sport} onChange={setSport} placeholder="Futbol" />
          <TextField label="Lig" value={league} onChange={setLeague} placeholder="Süper Lig" />
          <TextField label="Takımlar" value={teams} onChange={setTeams} placeholder="A vs B" />
          <TextField label="Dakika" value={minute} onChange={setMinute} placeholder="23'" />
          <TextField label="Skor" value={score} onChange={setScore} placeholder="1 - 0" />
          <label className="zoe-field">
            <span className="zoe-field-label">Canlı mı?</span>
            <select className="zoe-input" value={isLive ? '1' : '0'} onChange={(e) => setIsLive(e.target.value === '1')}>
              <option value="1">Evet</option>
              <option value="0">Hayır</option>
            </select>
          </label>
          <TextField label="Oran 1" value={odds1} onChange={setOdds1} />
          <TextField label="Oran X" value={oddsX} onChange={setOddsX} />
          <TextField label="Oran 2" value={odds2} onChange={setOdds2} />
        </div>
        <button
          className="zoe-btn zoe-btn--primary"
          onClick={() => {
            const next: Match = {
              id: uid('m'),
              sport,
              league,
              teams,
              minute,
              score,
              odds1,
              oddsX,
              odds2,
              isLive,
            }
            persist([next, ...items])
            setLeague('')
            setTeams('')
          }}
        >
          Maç ekle
        </button>
      </div>

      <div className="zoe-panel">
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head">
            <span>Maç</span>
            <span>Durum</span>
            <span>1</span>
            <span>X</span>
            <span>2</span>
            <span>Aksiyon</span>
          </div>
          {items.map((m) => (
            <div key={m.id} className="zoe-admin-row">
              <div>
                <strong className="zoe-admin-strong">{m.teams}</strong>
                <div className="zoe-muted">{m.league}</div>
              </div>
              <div className="zoe-admin-status">
                <span className={'zoe-badge ' + (m.isLive ? 'zoe-badge--on' : 'zoe-badge--off')}>
                  {m.isLive ? `Canlı ${m.minute}` : 'Planlı'}
                </span>
              </div>
              <span>{m.odds1}</span>
              <span>{m.oddsX}</span>
              <span>{m.odds2}</span>
              <div className="zoe-admin-actions">
                <button
                  className="zoe-btn zoe-btn--outline zoe-btn--sm"
                  onClick={() => {
                    const next = items.map((x) => (x.id === m.id ? { ...x, isLive: !x.isLive } : x))
                    persist(next)
                  }}
                >
                  Canlı değiştir
                </button>
                <button
                  className="zoe-btn zoe-btn--ghost zoe-btn--sm"
                  onClick={() => {
                    const next = items.filter((x) => x.id !== m.id)
                    persist(next)
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminGamesPage() {
  const [items, setItems] = useState<Game[]>(() => readJson<Game[]>(KEYS.games, []))
  const [name, setName] = useState('')
  const [tag, setTag] = useState('Slot')
  const [provider, setProvider] = useState('pragmatic')
  const [imageUrl, setImageUrl] = useState('')

  function handleFileToDataUrl(file: File, cb: (url: string) => void) {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      cb(result)
    }
    reader.readAsDataURL(file)
  }

  function persist(next: Game[]) {
    setItems(next)
    writeJson(KEYS.games, next)
  }

  return (
    <div>
      <div className="zoe-page-head">
        <h2>Oyunlar</h2>
        <p>Casino kartları buradan yönetilir.</p>
      </div>

      <div className="zoe-panel">
        <div className="zoe-form-grid">
          <TextField label="Oyun adı" value={name} onChange={setName} placeholder="Aviator" />
          <TextField label="Etiket" value={tag} onChange={setTag} placeholder="Slot / Live / Crash" />
          <label className="zoe-field">
            <span className="zoe-field-label">Provider</span>
            <select
              className="zoe-input"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Görsel URL (opsiyonel)"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https:// veya yükleme kullan"
          />
          <label className="zoe-field">
            <span className="zoe-field-label">Bilgisayardan görsel yükle</span>
            <input
              className="zoe-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                handleFileToDataUrl(file, (url) => setImageUrl(url))
              }}
            />
          </label>
        </div>
        <button
          className="zoe-btn zoe-btn--primary"
          onClick={() => {
            if (!name.trim()) return
            persist([
              {
                id: uid('g'),
                name: name.trim(),
                tag,
                provider,
                imageUrl: imageUrl.trim() || undefined,
              },
              ...items,
            ])
            setName('')
            setImageUrl('')
          }}
        >
          Oyun ekle
        </button>
      </div>

      <div className="zoe-panel">
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head">
            <span>Oyun</span>
            <span>Önizleme</span>
            <span>Etiket</span>
            <span>Provider</span>
            <span>Aksiyon</span>
          </div>
          {items.map((g) => (
            <div key={g.id} className="zoe-admin-row">
              <div>
                <strong className="zoe-admin-strong">{g.name}</strong>
              </div>
              <div>
                {g.imageUrl ? (
                  <img
                    src={g.imageUrl}
                    alt={g.name}
                    className="zoe-banner-thumb"
                    loading="lazy"
                  />
                ) : (
                  <span className="zoe-muted">Yok</span>
                )}
              </div>
              <span>{g.tag}</span>
              <span>{g.provider}</span>
              <div className="zoe-admin-actions">
                <button
                  className="zoe-btn zoe-btn--ghost zoe-btn--sm"
                  onClick={() => persist(items.filter((x) => x.id !== g.id))}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>(() => readJson<Promotion[]>(KEYS.promotions, []))
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)

  function persist(next: Promotion[]) {
    setItems(next)
    writeJson(KEYS.promotions, next)
  }

  return (
    <div>
      <div className="zoe-page-head">
        <h2>Promosyonlar</h2>
        <p>Kampanyaları ekle / aktif-pasif yap / sil.</p>
      </div>

      <div className="zoe-panel">
        <div className="zoe-form-grid">
          <TextField label="Başlık" value={title} onChange={setTitle} placeholder="Hoş geldin bonusu" />
          <TextField label="Açıklama" value={description} onChange={setDescription} placeholder="Kısa açıklama" />
          <label className="zoe-field">
            <span className="zoe-field-label">Aktif mi?</span>
            <select className="zoe-input" value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}>
              <option value="1">Evet</option>
              <option value="0">Hayır</option>
            </select>
          </label>
        </div>
        <button
          className="zoe-btn zoe-btn--primary"
          onClick={() => {
            if (!title.trim()) return
            persist([{ id: uid('p'), title: title.trim(), description: description.trim(), active }, ...items])
            setTitle('')
            setDescription('')
            setActive(true)
          }}
        >
          Promosyon ekle
        </button>
      </div>

      <div className="zoe-panel">
        <div className="zoe-cards">
          {items.map((p) => (
            <article key={p.id} className="zoe-card">
              <div className="zoe-card-head">
                <h3>{p.title}</h3>
                <span className={'zoe-badge ' + (p.active ? 'zoe-badge--on' : 'zoe-badge--off')}>
                  {p.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="zoe-muted">{p.description}</p>
              <div className="zoe-admin-actions">
                <button
                  className="zoe-btn zoe-btn--outline zoe-btn--sm"
                  onClick={() => persist(items.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))}
                >
                  Aktif değiştir
                </button>
                <button
                  className="zoe-btn zoe-btn--ghost zoe-btn--sm"
                  onClick={() => persist(items.filter((x) => x.id !== p.id))}
                >
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>(() => readJson<Banner[]>(KEYS.banners, []))
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('/')
  const [active, setActive] = useState(true)

  function persist(next: Banner[]) {
    setItems(next)
    writeJson(KEYS.banners, next)
  }

  return (
    <div>
      <div className="zoe-page-head">
        <h2>Bannerlar</h2>
        <p>Ana sayfadaki kayan banner alanını yönet.</p>
      </div>

      <div className="zoe-panel">
        <div className="zoe-form-grid">
          <TextField label="Başlık" value={title} onChange={setTitle} placeholder="Büyük kampanya" />
          <TextField label="Alt başlık" value={subtitle} onChange={setSubtitle} placeholder="Kısa açıklama" />
          <TextField
            label="Görsel URL"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
          />
          <label className="zoe-field">
            <span className="zoe-field-label">Bilgisayardan banner resmi yükle</span>
            <input
              className="zoe-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') setImageUrl(reader.result)
                }
                reader.readAsDataURL(file)
              }}
            />
          </label>
          <TextField label="Link" value={linkUrl} onChange={setLinkUrl} placeholder="/promotions" />
          <label className="zoe-field">
            <span className="zoe-field-label">Aktif mi?</span>
            <select className="zoe-input" value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}>
              <option value="1">Evet</option>
              <option value="0">Hayır</option>
            </select>
          </label>
        </div>
        <button
          className="zoe-btn zoe-btn--primary"
          onClick={() => {
            if (!title.trim() || !imageUrl.trim()) return
            const next: Banner = {
              id: uid('b'),
              title: title.trim(),
              subtitle: subtitle.trim(),
              imageUrl: imageUrl.trim(),
              linkUrl: linkUrl.trim() || '/',
              active,
            }
            persist([next, ...items])
            setTitle('')
            setSubtitle('')
            setImageUrl('')
            setLinkUrl('/')
            setActive(true)
          }}
        >
          Banner ekle
        </button>
      </div>

      <div className="zoe-panel">
        <div className="zoe-admin-table">
          <div className="zoe-admin-row zoe-admin-row--head">
            <span>Banner</span>
            <span>Durum</span>
            <span>Önizleme</span>
            <span>Link</span>
            <span>Aksiyon</span>
          </div>
          {items.map((b) => (
            <div key={b.id} className="zoe-admin-row">
              <div>
                <strong className="zoe-admin-strong">{b.title}</strong>
                <div className="zoe-muted">{b.subtitle}</div>
              </div>
              <div className="zoe-admin-status">
                <span className={'zoe-badge ' + (b.active ? 'zoe-badge--on' : 'zoe-badge--off')}>
                  {b.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div>
                {b.imageUrl ? (
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="zoe-banner-thumb"
                    loading="lazy"
                  />
                ) : (
                  <span className="zoe-muted">Yok</span>
                )}
              </div>
              <span className="zoe-muted">{b.linkUrl}</span>
              <div className="zoe-admin-actions">
                <button
                  className="zoe-btn zoe-btn--outline zoe-btn--sm"
                  onClick={() =>
                    persist(items.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))
                  }
                >
                  Aktif değiştir
                </button>
                <button
                  className="zoe-btn zoe-btn--ghost zoe-btn--sm"
                  onClick={() => persist(items.filter((x) => x.id !== b.id))}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


