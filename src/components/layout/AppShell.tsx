'use client'

import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/components/auth/LoginPage'
import Sidebar from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import Link from 'next/link'
import { LogOut, Eye } from 'lucide-react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()

  // Splash mientras se carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/logo/ganaplay.png" alt="GanaPlay" className="w-12 h-12 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-gray-600 font-medium">Cargando plataforma...</p>
        </div>
      </div>
    )
  }

  // No autenticado → mostrar login
  if (!user) {
    return <LoginPage />
  }

  // Invitado → acceso limitado solo a calendario
  if (user.role === 'guest') {
    return (
      <div className="min-h-screen bg-brand-surface flex flex-col">
        {/* Header para invitados */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                <img src="/logo/ganaplay.png" alt="GanaPlay" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">GanaPlay</h1>
                <p className="text-[10px] text-brand font-semibold">Modo Invitado</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>

        {/* Content */}
        <ToastProvider>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={20} className="text-brand" />
                  <h2 className="text-2xl font-bold text-gray-900">Eventos Deportivos</h2>
                </div>
                <p className="text-gray-600">Consulta el calendario de eventos disponibles</p>
              </div>
              {children}
            </div>
          </main>
        </ToastProvider>
      </div>
    )
  }

  // Autenticado → mostrar app completa
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-brand-surface">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
