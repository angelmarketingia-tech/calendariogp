'use client'

import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/components/auth/LoginPage'
import Sidebar from '@/components/layout/Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  // Splash while checking localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
            <img src="/logo/logo.png" alt="Métricas IA" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated → show login
  if (!user) {
    return <LoginPage />
  }

  // Authenticated → show app
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-100 to-blue-50/30">
        {children}
      </main>
    </div>
  )
}
