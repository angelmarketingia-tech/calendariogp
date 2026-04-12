'use client'

import KPICards from '@/components/dashboard/KPICards'
import UrgentEventsPanel from '@/components/dashboard/UrgentEventsPanel'
import SyncPanel from '@/components/dashboard/SyncPanel'
import EventModal from '@/components/events/EventModal'
import { useEvents } from '@/context/EventsContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { RefreshCw, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function DashboardPage() {
  const { events, selectedEventId } = useEvents()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <>
      <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Panel de Control</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ¡Buenos días! 👋
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5 capitalize">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary flex-shrink-0"
          >
            <RefreshCw size={15} className={`text-brand ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        <section>
          <KPICards />
        </section>

        {/* Two column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Urgent Events */}
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-red-500 rounded-full" />
                <h2 className="font-bold text-slate-800 text-base">Eventos Críticos</h2>
                <span className="text-xs text-slate-400 font-medium">próximas 72h</span>
              </div>
              <Link
                href="/events?urgente=3d"
                className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
              >
                Ver todos
                <ArrowRight size={13} />
              </Link>
            </div>
            <UrgentEventsPanel />
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            <SyncPanel />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-brand rounded-full" />
                <h2 className="font-bold text-slate-800 text-sm">Por Deporte</h2>
              </div>
              <SportDistribution events={events} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-slate-300 rounded-full" />
                <h2 className="font-bold text-slate-800 text-sm">Estado General</h2>
              </div>
              <StatusSummary events={events} />
            </div>
          </div>
        </div>
      </div>

      {selectedEventId && <EventModal />}
    </>
  )
}

function SportDistribution({ events }: { events: ReturnType<typeof useEvents>['events'] }) {
  const sports = events.reduce((acc, e) => {
    const key = e.sport?.name ?? 'Otro'
    const icon = e.sport?.icon ?? '🏅'
    acc[key] = { count: (acc[key]?.count ?? 0) + 1, icon }
    return acc
  }, {} as Record<string, { count: number; icon: string }>)

  const sorted = Object.entries(sports).sort((a, b) => b[1].count - a[1].count).slice(0, 6)
  const max = sorted[0]?.[1].count ?? 1

  if (sorted.length === 0) {
    return (
      <div className="card p-4 text-center text-slate-400 text-sm py-8">
        Sin datos de deporte
      </div>
    )
  }

  return (
    <div className="card p-4 space-y-3">
      {sorted.map(([name, { count, icon }]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
              <span className="text-xs text-slate-400 font-bold ml-2 flex-shrink-0">{count}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full transition-all duration-700"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusSummary({ events }: { events: ReturnType<typeof useEvents>['events'] }) {
  const total = events.length
  const pendiente = events.filter(e => e.estado === 'pendiente').length
  const arte = events.filter(e => e.estado === 'arte_solicitado').length
  const declinado = events.filter(e => e.estado === 'declinado').length

  const items = [
    { label: 'Pendiente', count: pendiente, colorBar: 'bg-amber-400', colorText: 'text-amber-600', pct: total ? (pendiente / total) * 100 : 0 },
    { label: 'Arte Solicitado', count: arte, colorBar: 'bg-brand', colorText: 'text-brand', pct: total ? (arte / total) * 100 : 0 },
    { label: 'Declinado', count: declinado, colorBar: 'bg-slate-300', colorText: 'text-slate-500', pct: total ? (declinado / total) * 100 : 0 },
  ]

  return (
    <div className="card p-4">
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-4 gap-px">
        {items.map(item => (
          <div
            key={item.label}
            className={`${item.colorBar} transition-all duration-700`}
            style={{ width: `${item.pct}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', item.colorBar)} />
              <span className="text-xs text-slate-600 font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold', item.colorText)}>{item.count}</span>
              <span className="text-xs text-slate-400 w-8 text-right">{item.pct.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
