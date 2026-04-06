import { API_URL } from './client'

export type DrakonGame = {
  id?: string | number
  game_id?: string | number
  name?: string
  title?: string
  provider?: string
  image?: string
  imageUrl?: string
  thumbnail?: string
  type?: string
  category?: string
  code?: string
  [key: string]: unknown
}

export type DrakonProvider = {
  id?: string | number
  code?: string
  name?: string
  label?: string
  logo?: string
  [key: string]: unknown
}

// Generic proxy call (POST)
async function drakonProxy<T = unknown>(
  path: string,
  options?: { method?: 'GET' | 'POST'; body?: object }
): Promise<T> {
  const res = await fetch(`${API_URL}/zeritra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      method: options?.method ?? 'GET',
      body: options?.body ?? null,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message ?? `Drakon API hatası: ${res.status}`)
  }
  return res.json()
}

// Fetch all providers
export async function fetchDrakonProviders(): Promise<DrakonProvider[]> {
  const res = await fetch(`${API_URL}/zeritra/providers`)
  if (!res.ok) throw new Error('Provider listesi alınamadı')
  const data = await res.json()
  const list = data?.data ?? data?.providers ?? (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list : []
}

// Fetch games (optionally by provider)
export async function fetchDrakonGames(provider?: string, page = 1): Promise<DrakonGame[]> {
  const params = new URLSearchParams({ page: String(page), limit: '200' })
  if (provider) params.set('provider', provider)
  const res = await fetch(`${API_URL}/zeritra/games?${params}`)
  if (!res.ok) throw new Error('Oyun listesi alınamadı')
  const data = await res.json()
  const list = data?.data ?? data?.games ?? data?.items ?? (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list : []
}

// Legacy: fetch all games via proxy
export async function fetchZeritraGamesAll(): Promise<DrakonGame[]> {
  return fetchDrakonGames()
}
