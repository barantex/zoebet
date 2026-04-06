export type Role = 'user' | 'admin'

export type AuthUser = {
  id: string
  email: string
  role: Role
}

export type Match = {
  id: string
  sport: string
  league: string
  teams: string
  minute: string
  score: string
  odds1: string
  oddsX: string
  odds2: string
  isLive: boolean
}

export type Game = {
  id: string
  name: string
  tag: string
  provider: string
  imageUrl?: string
  code?: string
}

export type TransactionType = 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund'

export type Transaction = {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  method?: string
  status?: string
  reference_id?: string
  created_at: string
  createdAt: string
}

export type SupportMessage = {
  id: string
  from: 'user' | 'agent'
  agentName?: string
  text: string
  at: string
  createdAt: string
}

export type SupportThread = {
  id: string
  userId: string
  userEmail: string
  status: 'open' | 'closed'
  messages: SupportMessage[]
  assignedAgentId?: string
  assignedAgentName?: string
  updatedAt: string
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export type InfoBullet = {
  id: string
  text: string
}

export type SupportItem = {
  id: string
  title: string
  description: string
  badge: string
}

export type Promotion = {
  id: string
  title: string
  description: string
  active: boolean
}

export type Banner = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  active: boolean
}


