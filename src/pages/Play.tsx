import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getLaunchUrlFromCode } from '../lib/games'
import { readJson } from '../lib/storage'
import { KEYS } from '../lib/seed'
import type { Game } from '../lib/types'

export function PlayPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()

  const code = useMemo(() => {
    if (!params.code) return ''
    try {
      return decodeURIComponent(params.code)
    } catch {
      return params.code
    }
  }, [params.code])

  const vendorParam = searchParams.get('vendor') ?? undefined
  const games = useMemo(() => readJson<Game[]>(KEYS.games, []), [])

  const game = useMemo(
    () => games.find((g) => g.code === code) ?? null,
    [games, code],
  )

  const launchUrl = useMemo(() => {
    if (game?.code) return getLaunchUrlFromCode(game.code, game.provider)
    return getLaunchUrlFromCode(code, vendorParam)
  }, [code, game, vendorParam])

  return (
    <main className="zoe-main">
      <div className="zoe-page-head">
        <h2>{game?.name ?? 'Oyun'}</h2>
        <p>{game?.provider ?? 'Oyun başlatılıyor'}</p>
      </div>

      <div className="zoe-panel zoe-play">
        <div className="zoe-play-header">
          <div>
            <strong>{game?.name ?? code}</strong>
            <span className="zoe-muted">{game?.provider ?? 'BahisMosco'}</span>
          </div>
          {launchUrl ? (
            <div className="zoe-play-actions">
              <a className="zoe-btn zoe-btn--outline zoe-btn--sm" href={launchUrl} target="_blank" rel="noreferrer">
                Yeni sekmede aç
              </a>
            </div>
          ) : null}
        </div>

        {launchUrl ? (
          <div className="zoe-play-frame">
            <iframe
              src={launchUrl}
              title={game?.name ?? 'Oyun'}
              className="zoe-play-iframe"
              allow="fullscreen; autoplay; clipboard-read; clipboard-write"
              loading="lazy"
            />
            <div className="zoe-play-note">
              Oyun görünmüyorsa yeni sekmede açmayı deneyebilirsin.
            </div>
          </div>
        ) : (
          <div className="zoe-muted">Oyun bağlantısı bulunamadı.</div>
        )}
      </div>
    </main>
  )
}

