import { useEffect } from 'react'
import { fetchApi } from '../api/client'

export function TawkChat() {
  useEffect(() => {
    fetchApi('/settings').then(settings => {
      const tawkId = settings?.tawk_id
      if (!tawkId || tawkId.trim() === '') return

      // Remove existing tawk script if any
      const existing = document.getElementById('tawk-script')
      if (existing) existing.remove()

      const s = document.createElement('script')
      s.id = 'tawk-script'
      s.async = true
      s.src = `https://embed.tawk.to/${tawkId.trim()}`
      s.charset = 'UTF-8'
      s.setAttribute('crossorigin', '*')
      document.head.appendChild(s)

      // Update favicon if set
      const faviconUrl = settings?.favicon_url
      if (faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = faviconUrl
      }
    }).catch(() => {})
  }, [])

  return null
}
