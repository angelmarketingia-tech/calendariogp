'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type AppUser = {
  id: string
  name: string
  role: string
  email: string
  avatar: string
  color: string
}

const USERS: AppUser[] = [
  {
    id: 'directora',
    name: 'Directora de Marketing',
    role: 'Directora de Marketing',
    email: 'directora@metricas-ia.com',
    avatar: 'DM',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'ceo',
    name: 'CEO',
    role: 'Chief Executive Officer',
    email: 'ceo@metricas-ia.com',
    avatar: 'CEO',
    color: 'from-brand to-brand-dark',
  },
]

const PASSWORD = 'metricas'
const AUTH_KEY = 'metricas_ia_auth'

interface AuthContextValue {
  user: AppUser | null
  users: AppUser[]
  login: (userId: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const found = USERS.find(u => u.id === parsed.id)
        if (found) setUser(found)
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((userId: string, password: string) => {
    if (password !== PASSWORD) {
      return { success: false, error: 'Contraseña incorrecta' }
    }
    const found = USERS.find(u => u.id === userId)
    if (!found) {
      return { success: false, error: 'Usuario no encontrado' }
    }
    setUser(found)
    localStorage.setItem(AUTH_KEY, JSON.stringify({ id: found.id }))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, users: USERS, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
