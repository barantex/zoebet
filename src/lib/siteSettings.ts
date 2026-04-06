import { fetchApi } from '../api/client'

export type SiteSettings = {
  site_name: string
  site_logo_text: string
  site_logo_icon: string
  site_logo_url: string
  ticker_items: string[]
}

const defaults: SiteSettings = {
  site_name: 'BahisMosco',
  site_logo_text: 'BAHİSMOSCO',
  site_logo_icon: '⚡',
  site_logo_url: '',
  ticker_items: [
    '🎁 Hoş Geldin Bonusu — İlk yatırımına %100 bonus',
    '🎰 1000DENEME Kodu sadece Slot Oyunlarında Geçerlidir',
    '💰 Günlük 1.000.000 ₺ Çekim İmkânı',
    '🏆 Nakit 50₺ Kod: 50CASH',
    '⚡ Canlı Bahiste Anlık Oranlar',
  ],
}

let cached: SiteSettings | null = null

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cached) return cached
  try {
    const d = await fetchApi('/settings')
    cached = { ...defaults, ...d }
    return cached
  } catch {
    return defaults
  }
}

export function clearSettingsCache() { cached = null }
