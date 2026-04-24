'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type UserRole = 'superadmin' | 'admin' | 'user' | 'guest'

export type AppUser = {
  id: string
  username: string
  name: string
  role: UserRole
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
    id: 'superadmin',
    username: 'ganaplay.admin',
    name: 'Angel',
    role: 'superadmin',
    email: 'admin@ganaplay.com',
    avatar: 'AG',
    color: 'from-brand to-brand-dark',
    canExportCSV: true,
  },
  {
    id: 'ganaplay_admin',
    username: 'ganaplay',
    name: 'Equipo Administrativo',
    role: 'admin',
    email: 'admin@ganaplay.com',
    avatar: 'GA',
    color: 'from-brand to-brand-light',
    canExportCSV: true,
  },
  {
    id: 'diseno',
    username: 'diseño',
    name: 'Equipo Diseño',
    role: 'admin',
    email: 'diseno@ganaplay.com',
    avatar: 'DI',
    color: 'from-violet-500 to-purple-600',
    canExportCSV: true,
  },
  {
    id: 'community',
    username: 'community',
    name: 'Community',
    role: 'admin',
    email: 'community@ganaplay.com',
    avatar: 'CM',
    color: 'from-blue-500 to-cyan-600',
    canExportCSV: true,
  },
  {
    id: 'ceo',
    username: 'ceo',
    name: 'CEO',
    role: 'admin',
    email: 'ceo@ganaplay.com',
    avatar: 'CE',
    color: 'from-orange-500 to-red-600',
    canExportCSV: true,
  },
  {
    id: 'director',
    username: 'director',
    name: 'Director',
    role: 'admin',
    email: 'director@ganaplay.com',
    avatar: 'DR',
    color: 'from-pink-500 to-rose-600',
    canExportCSV: true,
  },
  {
    id: 'fernanda',
    username: 'fernanda',
    name: 'Fernanda',
    role: 'user',
    email: 'fernanda@ganaplay.com',
    avatar: 'FE',
    color: 'from-green-500 to-emerald-600',
    canExportCSV: false,
  },
]

const GUEST_USER: AppUser = {
  id: 'guest',
  username: 'guest',
  name: 'Invitado',
  role: 'guest',
  email: '',
  avatar: '?',
  color: 'from-slate-400 to-slate-600',
  canExportCSV: false,
}

const AUTH_KEY = 'ganaplay_auth'
const NOTION_KEY = (userId: string) => `notion_config_${userId}`

interface AuthContextValue {
  user: AppUser | null
  users: AppUser[]
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loginAsGuest: () => void
  isLoading: boolean
  getNotionConfig: (userId?: string) => NotionConfig | null
  saveNotionConfig: (config: NotionConfig, userId?: string) => void
  clearNotionConfig: (userId?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function canManageUsers(role: UserRole): boolean {
  return role === 'superadmin'
}

export function canPublishEvents(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canCreateEvents(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canEditEvents(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canDeleteEvents(role: UserRole): boolean {
  return role === 'superadmin'
}

export function canViewAdmin(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canViewEvents(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'user'
}

export function canViewPublic(role: UserRole): boolean {
  return true
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.id === 'guest') {
          setUser(GUEST_USER)
        } else {
          const found = USERS.find(u => u.id === parsed.id)
          if (found) setUser(found)
        }
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { success: false, error: data.error || 'Error de autenticación' }
      }

      const data = await response.json()
      const userData = USERS.find(u => u.id === data.user.id)
      if (userData) {
        setUser(userData)
        localStorage.setItem(AUTH_KEY, JSON.stringify({ id: userData.id }))
        return { success: true }
      }

      return { success: false, error: 'Usuario no encontrado' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  const loginAsGuest = useCallback(() => {
    setUser(GUEST_USER)
    localStorage.setItem(AUTH_KEY, JSON.stringify({ id: 'guest' }))
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
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        users: USERS,
        login,
        logout,
        loginAsGuest,
        isLoading,
        getNotionConfig,
        saveNotionConfig,
        clearNotionConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
