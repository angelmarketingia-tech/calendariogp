'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, TableProperties, Plus, LogOut, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEvents } from '@/context/EventsContext'
import { useAuth } from '@/context/AuthContext'
import { useMemo, useState } from 'react'
import { isUrgent } from '@/lib/utils'
import AddEventModal from '@/components/events/AddEventModal'
import NotionConnectModal from '@/components/notion/NotionConnectModal'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/events', label: 'Eventos', icon: TableProperties },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { events } = useEvents()
  const { user, logout, getNotionConfig } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotionModal, setShowNotionModal] = useState(false)

  const urgentCount = useMemo(
    () => events.filter(e => e.estado === 'pendiente' && isUrgent(e.fecha_hora, 24)).length,
    [events]
  )

  const totalPending = useMemo(
    () => events.filter(e => e.estado === 'pendiente').length,
    [events]
  )

  const notionConfig = getNotionConfig()
  const notionConnected = notionConfig?.connected === true

  return (
    <>
      <aside className="w-64 flex-shrink-0 flex flex-col h-screen bg-sidebar border-r border-white/5 shadow-2xl">

        {/* Brand Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
              <img src="/logo/logo.png" alt="Métricas IA" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-[15px] tracking-tight leading-none">Métricas IA</h1>
              <p className="text-[10px] text-brand font-semibold uppercase tracking-widest mt-0.5">SportOps</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-white/3 border border-white/5 flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-white/50 text-[11px] font-medium">Sistema activo</span>
          {urgentCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest px-3 pb-2 pt-1">Navegación</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-gradient-to-r from-brand/20 to-brand/10 text-brand ring-1 ring-brand/20 shadow-sm'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon size={17} className={active ? 'text-brand' : ''} />
                {label}
                {href === '/' && urgentCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {urgentCount}
                  </span>
                )}
                {href === '/events' && totalPending > 0 && (
                  <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                    {totalPending}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Add */}
        <div className="px-3 pb-3 pt-2 border-t border-white/5">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
              bg-gradient-to-r from-brand to-brand-dark text-white text-sm font-semibold
              rounded-xl shadow-brand hover:brightness-110 transition-all active:scale-[0.97]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nuevo Evento
          </button>
        </div>

        {/* Notion Connect */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowNotionModal(true)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border',
              notionConnected
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15'
                : 'bg-white/3 border-white/10 text-white/40 hover:bg-white/6 hover:text-white/60'
            )}
          >
            <Database size={14} className={notionConnected ? 'text-emerald-400' : 'text-white/30'} />
            <span className="flex-1 text-left">
              {notionConnected ? 'Notion conectado' : 'Conectar Notion'}
            </span>
            {notionConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Stats chips */}
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          <div className="bg-white/3 rounded-xl p-2.5 border border-white/5">
            <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Totales</p>
            <p className="text-white font-bold text-lg leading-tight">{events.length}</p>
          </div>
          <div className="bg-white/3 rounded-xl p-2.5 border border-white/5">
            <p className="text-[10px] text-amber-400/60 uppercase font-bold tracking-wider">Pendientes</p>
            <p className="text-amber-400 font-bold text-lg leading-tight">{totalPending}</p>
          </div>
        </div>

        {/* User + Logout */}
        <div className="px-3 pb-4 pt-1 border-t border-white/5">
          {showLogoutConfirm ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-fade-in">
              <p className="text-white/70 text-xs font-medium mb-2 text-center">¿Cerrar sesión?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user?.color ?? 'from-brand to-brand-dark'} flex items-center justify-center text-white text-[10px] font-black shadow-brand flex-shrink-0`}>
                {user?.avatar ?? '?'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate leading-tight">{user?.name}</p>
                <p className="text-white/30 text-[10px] font-medium truncate">{user?.role} · Métricas IA</p>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                title="Cerrar sesión"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
      {showNotionModal && <NotionConnectModal onClose={() => setShowNotionModal(false)} />}
    </>
  )
}
