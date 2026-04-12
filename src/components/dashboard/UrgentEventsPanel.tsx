'use client'

import { useMemo } from 'react'
import { useEvents } from '@/context/EventsContext'
import { isUrgent, formatTime, getRelativeLabel, cn } from '@/lib/utils'
import StatusBadge from '@/components/events/StatusBadge'
import PriorityBadge from '@/components/events/PriorityBadge'
import QuickStatusButtons from '@/components/events/QuickStatusButtons'
import { AlertTriangle, ChevronRight, CheckCircle } from 'lucide-react'

export default function UrgentEventsPanel() {
  const { events, selectEvent } = useEvents()

  const urgentPending = useMemo(() =>
    events
      .filter(e => e.estado === 'pendiente' && isUrgent(e.fecha_hora, 72))
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
      .slice(0, 10),
    [events]
  )

  if (urgentPending.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-100">
          <CheckCircle size={26} className="text-emerald-500" />
        </div>
        <p className="font-bold text-slate-700 text-base mb-1">¡Todo al día!</p>
        <p className="text-slate-400 text-sm">No hay eventos urgentes pendientes en las próximas 72 horas.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-red-100/50 bg-gradient-to-r from-red-50/80 to-orange-50/30">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm">Requieren Atención Urgente</h3>
          <p className="text-slate-400 text-[11px] font-medium">Pendientes · Próximas 72 horas</p>
        </div>
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {urgentPending.length}
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {urgentPending.map(event => {
          const isToday = isUrgent(event.fecha_hora, 24)
          return (
            <div
              key={event.id}
              className={cn(
                'px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group',
                isToday && 'bg-red-50/40'
              )}
            >
              {/* Sport Icon */}
              <span className="text-xl flex-shrink-0 w-8 text-center">
                {event.sport?.icon}
              </span>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-slate-800 text-sm truncate leading-tight">
                    {event.nombre_evento}
                  </p>
                  {isToday && (
                    <span className="flex-shrink-0 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold border border-red-200">
                      HOY
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5 truncate">
                  {getRelativeLabel(event.fecha_hora)}
                  {' · '}
                  <span className="font-medium">{formatTime(event.fecha_hora)}</span>
                  {event.competition?.name && ` · ${event.competition.name}`}
                </p>
              </div>

              {/* Badges */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={event.prioridad} size="sm" />
              </div>

              {/* Quick Actions */}
              <div className="flex-shrink-0">
                <QuickStatusButtons eventId={event.id} currentStatus={event.estado} compact />
              </div>

              {/* Detail */}
              <button
                onClick={() => selectEvent(event.id)}
                className="p-1.5 rounded-lg text-slate-200 hover:text-brand hover:bg-brand/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
