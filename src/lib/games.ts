import type { Game } from './types'

const SLOT_BASE = 'https://paleturquoise-newt-207603.hostingersite.com/public'

export function getGameLaunchUrl(game: Game): string | null {
  if (!game.code) return null
  return getLaunchUrlFromCode(game.code, game.provider)
}

export function getLaunchUrlFromCode(code: string, provider?: string): string | null {
  if (!code) return null
  // Live casino games use game_id format
  if (code.startsWith('game_id:')) {
    const gameId = code.split(':')[1]
    if (!gameId) return null
    return `${SLOT_BASE}/drakon/launch.php?game_id=${encodeURIComponent(gameId)}`
  }
  // Slot games use code + vendor format
  const vendor = provider && provider.trim() ? provider : 'slot-pragmatic'
  return `${SLOT_BASE}/game.php?code=${encodeURIComponent(code)}&vendor=${encodeURIComponent(vendor)}`
}

export function getPlayRoute(game: Game): string | null {
  if (!game.code) return null
  return `/play/${encodeURIComponent(game.code)}`
}

export function isLiveGame(game: Game): boolean {
  return game.code?.startsWith('game_id:') === true ||
    game.tag?.toLowerCase().includes('live') === true
}
