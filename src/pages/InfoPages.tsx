import { useMemo, type ReactNode } from 'react'
import { readJson } from '../lib/storage'
import {
  DEFAULT_FAQ,
  DEFAULT_PRIVACY,
  DEFAULT_RESPONSIBLE,
  DEFAULT_SUPPORT,
  DEFAULT_TERMS,
  KEYS,
} from '../lib/seed'
import type { FaqItem, InfoBullet, SupportItem } from '../lib/types'

function InfoLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="zoe-main">
      <div className="zoe-page-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="zoe-panel">{children}</div>
    </main>
  )
}

export function FaqPage() {
  const items = useMemo(() => readJson<FaqItem[]>(KEYS.faq, DEFAULT_FAQ), [])

  return (
    <InfoLayout title="SSS" subtitle="En çok merak edilen sorular ve hızlı cevaplar.">
      <div className="zoe-cards">
        {items.map((item) => (
          <article key={item.id} className="zoe-card">
            <div className="zoe-card-head">
              <h3>{item.question}</h3>
            </div>
            <p className="zoe-muted">{item.answer}</p>
          </article>
        ))}
      </div>
    </InfoLayout>
  )
}

export function SupportPage() {
  const items = useMemo(() => readJson<SupportItem[]>(KEYS.support, DEFAULT_SUPPORT), [])

  return (
    <InfoLayout title="Canlı Destek" subtitle="7/24 destek, hızlı yanıt ve güvenli iletişim.">
      <div className="zoe-cards">
        {items.map((item) => (
          <article key={item.id} className="zoe-card">
            <div className="zoe-card-head">
              <h3>{item.title}</h3>
              <span className={'zoe-badge ' + (item.badge === 'Aktif' ? 'zoe-badge--on' : '')}>
                {item.badge}
              </span>
            </div>
            <p className="zoe-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </InfoLayout>
  )
}

export function ResponsiblePage() {
  const items = useMemo(
    () => readJson<InfoBullet[]>(KEYS.responsible, DEFAULT_RESPONSIBLE),
    [],
  )

  return (
    <InfoLayout title="Sorumlu Bahis" subtitle="Güvenli ve kontrollü oyun için bilgilendirme.">
      <ul className="zoe-info-list">
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </InfoLayout>
  )
}

export function PrivacyPage() {
  const items = useMemo(() => readJson<InfoBullet[]>(KEYS.privacy, DEFAULT_PRIVACY), [])

  return (
    <InfoLayout title="KVKK & Gizlilik" subtitle="Kişisel verilerin korunması ve kullanım esasları.">
      <ul className="zoe-info-list">
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </InfoLayout>
  )
}

export function TermsPage() {
  const items = useMemo(() => readJson<InfoBullet[]>(KEYS.terms, DEFAULT_TERMS), [])

  return (
    <InfoLayout title="Kurallar & Şartlar" subtitle="Hizmet kullanım koşulları ve temel kurallar.">
      <ul className="zoe-info-list">
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </InfoLayout>
  )
}
