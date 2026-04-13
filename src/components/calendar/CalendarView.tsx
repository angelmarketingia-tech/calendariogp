'use client'

import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, format, isToday, getDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useEvents } from '@/context/EventsContext'
import { formatTime, cn, isUrgent } from '@/lib/utils'
import { CALENDAR_EVENT_COLORS, DAYS_ES, MONTHS_ES } from '@/lib/constants'
import type { SportEvent } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarMode = 'month' | 'week'

function EventPill({ event, onClick }: { event: SportEvent; onClick: () => void }) {
  const urgent = isUrgent(event.fecha_hora, 24) && event.estado === 'pendiente'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        'w-full text-left px-1.5 py-0.5 rounded-md text-white text-[10px] truncate font-semibold transition-opacity hover:opacity-90 flex items-center gap-1 leading-relaxed',
        CALENDAR_EVENT_COLORS[event.estado],
        urgent && 'ring-2 ring-red-400 ring-offset-1'
      )}
      title={`${event.nombre_evento} · ${formatTime(event.fecha_hora)}`}
    >
      <span className="text-[9px] opacity-75 flex-shrink-0">{formatTime(event.fecha_hora)}</span>
      <span className="truncate">{event.sport?.icon} {event.nombre_evento}</span>
    </button>
  )
}

export default function CalendarView() {
  const { events, selectEvent } = useEvents()
  const [mode, setMode] = useState<CalendarMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SportEvent[]>()
    events.forEach(e => {
      const key = format(new Date(e.fecha_hora), 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      map.set(key, [...existing, e].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      ))
    })
    return map
  }, [events])

  const getEventsForDay = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    return eventsByDate.get(key) ?? []
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const prev = () => {
    if (mode === 'month') setCurrentDate(d => subMonths(d, 1))
    else setCurrentDate(d => subWeeks(d, 1))
  }

  const next = () => {
    if (mode === 'month') setCurrentDate(d => addMonths(d, 1))
    else setCurrentDate(d => addWeeks(d, 1))
  }

  const title = mode === 'month'
    ? `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`

  const dayHeaders = DAYS_ES.slice(1).concat(DAYS_ES[0])

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-3 px-5 py-4 border-b border-slate-100 bg-white">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={17} />
          </button>
          <h2 className="font-bold text-slate-900 text-base min-w-[200px] text-center px-2">{title}</h2>
          <button
            onClick={next}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Today */}
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1.5 text-xs font-bold text-brand border border-brand/30 bg-brand/5 rounded-lg hover:bg-brand/10 transition-colors"
        >
          Hoy
        </button>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Pendiente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand" />
            Arte Solicitado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
            Declinado
          </span>
        </div>

        {/* Mode toggle */}
        <div className="ml-auto flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['month', 'week'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {m === 'month' ? 'Mes' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {dayHeaders.map(day => (
          <div key={day} className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Month View */}
      {mode === 'month' && (
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {monthDays.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            const MAX_VISIBLE = 3

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[112px] p-1.5 flex flex-col gap-1 transition-colors',
                  !isCurrentMonth && 'bg-slate-50/60',
                  isCurrentDay && 'bg-brand/3'
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn(
                    'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full',
                    isCurrentDay
                      ? 'bg-brand text-white shadow-sm'
                      : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > MAX_VISIBLE && (
                    <span className="text-[10px] text-slate-400 font-bold">
                      +{dayEvents.length - MAX_VISIBLE}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 flex-1">
                  {dayEvents.slice(0, MAX_VISIBLE).map(event => (
                    <EventPill
                      key={event.id}
                      event={event}
                      onClick={() => selectEvent(event.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Week View */}
      {mode === 'week' && (
        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[600px]">
          {weekDays.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col',
                  isCurrentDay && 'bg-brand/3'
                )}
              >
                {/* Day header */}
                <div className={cn(
                  'p-3 text-center border-b border-slate-100',
                  isCurrentDay && 'bg-brand/5'
                )}>
                  <p className={cn(
                    'text-[10px] font-bold uppercase tracking-widest mb-1',
                    isCurrentDay ? 'text-brand' : 'text-slate-400'
                  )}>
                    {dayHeaders[i]}
                  </p>
                  <span className={cn(
                    'text-xl font-extrabold',
                    isCurrentDay ? 'text-brand' : 'text-slate-800'
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Events */}
                <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6">
                      <span className="text-slate-200 text-lg">—</span>
                    </div>
                  ) : (
                    dayEvents.map(event => {
                      const urgent = isUrgent(event.fecha_hora, 24) && event.estado === 'pendiente'
                      return (
                        <button
                          key={event.id}
                          onClick={() => selectEvent(event.id)}
                          className={cn(
                            'w-full text-left p-2.5 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
                            event.estado === 'pendiente' && 'bg-amber-50 border-amber-200 hover:bg-amber-100/50',
                            event.estado === 'arte_solicitado' && 'bg-brand/5 border-brand/20 hover:bg-brand/10',
                            event.estado === 'declinado' && 'bg-slate-50 border-slate-200 hover:bg-slate-100',
                            urgent && 'ring-2 ring-red-300'
                          )}
                        >
                          <p className={cn(
                            'text-[10px] font-bold mb-0.5',
                            event.estado === 'pendiente' && 'text-amber-600',
                            event.estado === 'arte_solicitado' && 'text-brand',
                            event.estado === 'declinado' && 'text-slate-400',
                          )}>
                            {formatTime(event.fecha_hora)}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">
                            {event.sport?.icon} {event.nombre_evento}
                          </p>
                          {event.competition?.name && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {event.competition.name}
                            </p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
