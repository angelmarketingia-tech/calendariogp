'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, TableProperties, Plus, LogOut, Database, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEvents } from '@/context/EventsContext'
import { useAuth, canViewAdmin } from '@/context/AuthContext'
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
      <aside className="w-64 flex-shrink-0 flex flex-col h-screen bg-sidebar border-r border-brand/10 shadow-lg">

        {/* Brand Header */}
        <div className="p-6 pb-5 border-b border-brand/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
              <img src="/logo/ganaplay.png" alt="GanaPlay" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight leading-tight">GanaPlay</h1>
              <p className="text-[10px] text-brand-light font-semibold uppercase tracking-wider mt-0.5">
                {user?.role === 'superadmin' ? 'Admin' : user?.role === 'admin' ? 'Gestor' : 'Operador'}
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mx-4 my-4 px-3 py-2.5 rounded-lg bg-brand/10 border border-brand/20 flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-light" />
          </span>
          <span className="text-white/70 text-xs font-medium flex-1">Sistema activo</span>
          {urgentCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold animate-pulse flex items-center gap-1">
              <AlertTriangle size={12} />
              {urgentCount}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-3 py-2.5">Menú Principal</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'bg-brand/20 text-brand-light border border-brand/30 shadow-sm'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                )}
              >
                <Icon size={18} className={cn('transition-colors', active ? 'text-brand-light' : 'group-hover:text-brand-light')} />
                <span className="flex-1">{label}</span>
                {href === '/' && urgentCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-2 py-1 rounded-md font-bold">
                    {urgentCount}
                  </span>
                )}
                {href === '/events' && totalPending > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-1 rounded-md font-bold border border-amber-500/20">
                    {totalPending}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin section */}
        {canViewAdmin(user?.role ?? 'guest') && (
          <div className="px-3 py-3 border-t border-brand/10 space-y-2">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-3 py-2">Administración</p>
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-brand to-brand-dark text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98] shadow-sm shadow-brand/20"
            >
              <Plus size={18} />
              <span>Nuevo Evento</span>
            </button>

            <button
              onClick={() => setShowNotionModal(true)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                notionConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              )}
            >
              <Database size={18} />
              <span>{notionConnected ? 'Notion' : 'Conectar'}</span>
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="px-3 py-4 border-t border-brand/10 space-y-2">
          <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-lg">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br', user?.color)}>
              {user?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/50 truncate">{user?.role}</p>
            </div>
          </div>

          {showLogoutConfirm ? (
            <div className="space-y-2">
              <p className="text-xs text-white/70 px-3 py-2">¿Confirmar salida?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    logout()
                  }}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-all"
                >
                  Salir
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-3 py-2 bg-white/10 text-white/80 text-xs font-semibold rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2 justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          )}
        </div>
      </aside>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
      {showNotionModal && <NotionConnectModal onClose={() => setShowNotionModal(false)} />}
    </>
  )
}
