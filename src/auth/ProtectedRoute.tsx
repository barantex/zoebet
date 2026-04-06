import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({
  children,
  requireAdmin,
  loginPath = '/login',
}: {
  children: React.ReactNode
  requireAdmin?: boolean
  loginPath?: string
}) {
  const { user, isAdmin } = useAuth()

  if (!user) return <Navigate to={loginPath} replace />
  if (requireAdmin && !isAdmin) return <Navigate to={loginPath} replace />
  return <>{children}</>
}
