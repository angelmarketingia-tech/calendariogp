'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type AppUser = {
  id: string
  name: string
  role: string
  email: string
  avatar: string
  color: string
  canExportCSV: boolean
}

export type NotionConfig = {
  token: string
  databaseId: string
  email: string
  connected: boolean
}

const USERS: AppUser[] = [
  {
    id: 'directora',
    name: 'Maria',
    role: 'Directora de Marketing',
    email: 'directora@metricas-ia.com',
    avatar: 'MA',
    color: 'from-pink-500 to-rose-600',
    canExportCSV: true,
  },
  {
    id: 'ceo',
    name: 'Angel',
    role: 'CEO',
    email: 'ceo@metricas-ia.com',
    avatar: 'AG',
    color: 'from-brand to-brand-dark',
    canExportCSV: true,
  },
  {
    id: 'fernanda',
    name: 'Fernanda',
    role: 'Coordinadora Creativa',
    email: 'fernanda@metricas-ia.com',
    avatar: 'FE',
    color: 'from-violet-500 to-purple-600',
    canExportCSV: false,
  },
]

const PASSWORD = 'metricas'
const AUTH_KEY = 'metricas_ia_auth'
const NOTION_KEY = (userId: string) => `notion_config_${userId}`

interface AuthContextValue {
  user: AppUser | null
  users: AppUser[]
  login: (userId: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  isLoading: boolean
  getNotionConfig: (userId?: string) => NotionConfig | null
  saveNotionConfig: (config: NotionConfig, userId?: string) => void
  clearNotionConfig: (userId?: string) => void
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

  const getNotionConfig = useCallback((userId?: string): NotionConfig | null => {
    const id = userId ?? user?.id
    if (!id) return null
    try {
      const raw = localStorage.getItem(NOTION_KEY(id))
      if (!raw) return null
      return JSON.parse(raw) as NotionConfig
    } catch {
      return null
    }
  }, [user])

  const saveNotionConfig = useCallback((config: NotionConfig, userId?: string) => {
    const id = userId ?? user?.id
    if (!id) return
    localStorage.setItem(NOTION_KEY(id), JSON.stringify(config))
  }, [user])

  const clearNotionConfig = useCallback((userId?: string) => {
    const id = userId ?? user?.id
    if (!id) return
    localStorage.removeItem(NOTION_KEY(id))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, users: USERS, login, logout, isLoading, getNotionConfig, saveNotionConfig, clearNotionConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
