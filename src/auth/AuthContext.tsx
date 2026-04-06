import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthUser } from '../lib/types'
import { fetchApi } from '../api/client'

const TOKEN_KEY = 'zoe.token'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string; unverifiedPhone?: string }>
  register: (email: string, password: string, name: string, surname: string, phone: string, tc: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore session from token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }
    fetchApi('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      return { ok: true as const }
    } catch (err: any) {
      // Check if unverified
      if (err.message?.includes('doğrulanmamış') || err.unverified) {
        return { ok: false as const, message: err.message || 'Hesap doğrulanmamış.', unverifiedPhone: err.phone }
      }
      return { ok: false as const, message: err.message || 'Giriş başarısız.' }
    }
  }

  async function register(email: string, password: string, name: string, surname: string, phone: string, tc: string) {
    if (!email.includes('@') || !email.includes('.')) {
      return { ok: false as const, message: 'Geçerli bir e-posta gir.' }
    }
    if (password.length < 4) {
      return { ok: false as const, message: 'Şifre en az 4 karakter olmalı.' }
    }
    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, name, surname, phone, tc }),
      })
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      return { ok: true as const }
    } catch (err: any) {
      return { ok: false as const, message: err.message || 'Kayıt başarısız.' }
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
