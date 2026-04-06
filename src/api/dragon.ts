type DragonConfig = {
  baseUrl: string
  apiKey?: string
}

let config: DragonConfig | null = null

export function configureDragon(next: DragonConfig) {
  config = next
}

function getConfig(): DragonConfig {
  if (!config) {
    throw new Error('Dragon API henüz configureDragon ile yapılandırılmadı.')
  }
  return config
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = getConfig()
  const res = await fetch(baseUrl.replace(/\/$/, '') + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Dragon API hata: ${res.status}`)
  }
  return (await res.json()) as T
}

// Örnek: ileride banner verilerini Dragon API ile senkronize etmek için
export async function fetchDragonBanners() {
  return request<unknown>('/banners')
}

export async function saveDragonBanners(payload: unknown) {
  return request<unknown>('/banners', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

